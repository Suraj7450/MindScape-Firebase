import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateContentWithPollinations } from './pollinations-client';
export type AIProvider = 'gemini' | 'pollinations';

interface GenerateContentOptions {
    provider?: AIProvider;
    apiKey?: string;
    systemPrompt: string;
    userPrompt: string;
    images?: { inlineData: { mimeType: string, data: string } }[];
    schema?: any; // Zod schema for validation
    model?: string; // Optional model name
}

export class StructuredOutputError extends Error {
    constructor(message: string, public rawOutput: string, public zodError?: any) {
        super(message);
        this.name = 'StructuredOutputError';
    }
}

/**
 * Helper to retry a function with exponential backoff
 */
async function retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            lastError = err;

            const errorMessage = err.message || "";
            const statusCode = err.status || (err.response && err.response.status);

            const isRateLimit = statusCode === 429 || errorMessage.toLowerCase().includes('rate limit');
            const isTimeout = statusCode === 408 || errorMessage.toLowerCase().includes('timeout');
            const isRetryableServerErr = statusCode >= 500 || [502, 503, 504].includes(statusCode);

            // AI-specific retryable errors: syntax errors in JSON and reasoning-only outputs
            const isAISyntaxError = err instanceof StructuredOutputError && !err.zodError;
            const isReasoningOnlyErr = errorMessage.includes('reasoning-only');

            const shouldRetry = isRateLimit || isTimeout || isRetryableServerErr || isAISyntaxError || isReasoningOnlyErr;

            if (i < retries - 1 && shouldRetry) {
                // For rate limits or AI errors, we wait and retry
                const jitter = Math.random() * 2000;
                const waitTime = isRateLimit
                    ? (5000 * (i + 1)) + jitter
                    : (isAISyntaxError || isReasoningOnlyErr)
                        ? 1000 + jitter // Short wait for AI to "think again"
                        : delayMs * Math.pow(2, i) + jitter;

                console.warn(`Attempt ${i + 1} failed (${isRateLimit ? 'Rate Limit' : isAISyntaxError ? 'JSON Syntax' : isReasoningOnlyErr ? 'Reasoning Only' : 'Provider Error'}), retrying in ${Math.round(waitTime)}ms...`, errorMessage);
                await new Promise(res => setTimeout(res, waitTime));
            } else {
                // Non-retryable error or out of retries
                throw err;
            }
        }
    }
    throw lastError;
}

// Simple in-memory circuit breaker
let pollinationsDisabledUntil = 0;

function isPollinationsAvailable() {
    return Date.now() > pollinationsDisabledUntil;
}

function disablePollinations(minutes = 10) {
    pollinationsDisabledUntil = Date.now() + minutes * 60 * 1000;
    console.warn(`🚫 Pollinations disabled for ${minutes} minutes due to repeated failures.`);
}

/**
 * Health monitor for AI providers to enable smart fallback
 */
class ProviderMonitor {
    private health: Record<AIProvider, { success: number; failure: number; status: 'healthy' | 'degraded' | 'down' }> = {
        gemini: { success: 0, failure: 0, status: 'healthy' },
        pollinations: { success: 0, failure: 0, status: 'healthy' }
    };

    recordSuccess(provider: AIProvider) {
        if (!this.health[provider]) return;
        this.health[provider].success++;
        this.health[provider].failure = 0; // Reset failures on success
        this.updateStatus(provider);
    }

    recordFailure(provider: AIProvider) {
        if (!this.health[provider]) return;
        this.health[provider].failure++;
        this.updateStatus(provider);
    }

    getStatus(provider: AIProvider) {
        return this.health[provider]?.status || 'healthy';
    }

    private updateStatus(provider: AIProvider) {
        const p = this.health[provider];
        if (p.failure > 5) p.status = 'down';
        else if (p.failure > 2) p.status = 'degraded';
        else p.status = 'healthy';
    }
}

const providerMonitor = new ProviderMonitor();

/**
 * Detects if a response object contains only AI reasoning/planning 
 * but lacks the actual structured data fields.
 */
function isReasoningOnly(raw: any): boolean {
    if (typeof raw !== 'object' || raw === null) return false;

    // Check if it has reasoning but NONE of the expected data markers
    const hasReasoning = !!raw.reasoning_content || !!raw.reasoning;
    const hasData = !!raw.topic || !!raw.mode || !!raw.similarities || !!raw.differences || !!raw.root || (raw.subTopics && raw.subTopics.length > 0);

    return hasReasoning && !hasData;
}

/**
 * Unified AI Client Dispatcher
 * Routes requests to the appropriate provider (Gemini or Pollinations)
 * based on the user's configuration.
 */
export async function generateContent(options: GenerateContentOptions): Promise<any> {
    const originalProvider = options.provider || 'pollinations';
    let { provider = originalProvider } = options;
    const { apiKey, systemPrompt, userPrompt, images, schema } = options;
    const strict = false; // Rigidly disabled

    // Inject JSON-only instruction into system prompt if schema is provided
    const effectiveSystemPrompt = schema
        ? `${systemPrompt}\n\nPlease respond with a valid JSON object matching the requested schema.`
        : systemPrompt;

    console.log('🔌 AI Provider attempt:', provider, 'with auto-fallback enabled');

    // 1. Try Pollinations (Priority)
    if (provider === 'pollinations') {
        try {
            const result = await retry(async () => {
                const raw = await generateContentWithPollinations(effectiveSystemPrompt, userPrompt, images, {
                    model: options.model,
                    apiKey: provider === 'pollinations' ? options.apiKey : undefined,
                    response_format: schema ? { type: 'json_object' } : undefined
                });

                if (isReasoningOnly(raw)) {
                    throw new Error('Pollinations returned reasoning-only output (retryable)');
                }

                console.log(`✅ Pollinations Response Success. Raw length: ${JSON.stringify(raw).length} chars`);
                return validateAndParse(raw, schema, strict);
            }, 5); // Increased to 5 retries for Pollinations stability

            providerMonitor.recordSuccess('pollinations');
            return result;
        } catch (error: any) {
            providerMonitor.recordFailure('pollinations');

            console.warn(`🔄 Falling back from Pollinations to Gemini as secondary engine: ${error.message}`);
            provider = 'gemini';
        }
    }

    // 3. Gemini (Selected OR Fallback)
    if (provider === 'gemini') {
        const effectiveApiKey = (provider === originalProvider ? options.apiKey : undefined) || process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

        if (!effectiveApiKey) {
            throw new Error("Gemini provider requires an API Key. Please configure GOOGLE_GENAI_API_KEY or GEMINI_API_KEY or provide a custom key.");
        }

        try {
            const genAI = new GoogleGenerativeAI(effectiveApiKey);
            const geminiModel = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash'
            });

            const userParts: any[] = [{ text: userPrompt }];
            if (images && images.length > 0) {
                userParts.push(...images);
            }

            const text = await retry(async () => {
                console.log('🔵 Calling Gemini with:', {
                    model: 'gemini-2.0-flash',
                    systemPromptLength: effectiveSystemPrompt.length,
                    userPromptLength: userPrompt.length,
                    hasSchema: !!schema
                });

                const geminiResult = await geminiModel.generateContent({
                    contents: [{ role: 'user', parts: userParts }],
                    systemInstruction: effectiveSystemPrompt,
                    generationConfig: {
                        responseMimeType: 'application/json',
                        temperature: 0.7,
                        maxOutputTokens: 8192
                    }
                });

                const response = geminiResult.response;
                console.log('🔵 Gemini response candidates:', response.candidates?.length || 0);

                if (!response.text || response.text().trim() === '') {
                    console.error('❌ Gemini returned empty response. Candidates:', JSON.stringify(response.candidates, null, 2));
                    throw new Error('Gemini returned empty response - possibly blocked by safety filters');
                }

                return response.text();
            }, 3);

            console.log(`📝 Raw AI text response Success. Length: ${text.length} chars. Snippet: ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`);

            const finalResult = validateAndParse(text, schema, strict);
            providerMonitor.recordSuccess('gemini');
            return finalResult;
        } catch (error: any) {
            providerMonitor.recordFailure('gemini');
            console.error("Gemini AI Error:", error);
            // If Gemini fails with 429 after retries, suggest switching to developer mode or checking quota
            if (error.status === 429 || error.message?.includes('429')) {
                throw new Error("Gemini API Rate Limit Exceeded. The free tier quota has been reached. Please wait a few minutes or try a different topic.");
            }
            throw error;
        }
    }

    throw new Error(`Unsupported AI Provider: ${provider}`);
}

/**
 * Validates and parses the AI response text.
 * Handles markdown stripping, robust JSON extraction, and schema validation.
 */
function validateAndParse(raw: any, schema?: any, strict: boolean = false): any {
    if (typeof raw !== 'string') {
        if (schema) {
            const result = schema.safeParse(raw);
            if (!result.success) {
                if (strict) {
                    throw new StructuredOutputError("Schema validation failed", JSON.stringify(raw), result.error);
                } else {
                    console.warn("⚠️ Schema validation failed in loose mode, returning raw object:", result.error);
                    return raw; // Return as-is, let the flow handle it
                }
            }
            return result.data;
        }
        return raw;
    }

    let cleaned = raw.trim();

    // 1. Remove markdown code blocks if present
    if (cleaned.includes('```')) {
        // More robust replacement for multiple or single code blocks
        cleaned = cleaned.replace(/```[a-z]*\n?([\s\S]*?)\n?```/g, '$1').trim();
    }

    // 2. Initial attempt at parsing
    try {
        return performSchemaValidation(JSON.parse(cleaned), schema, cleaned, strict);
    } catch (e) {
        // 3. Robust Extraction fallback
        // Sometimes models prefix the JSON with prose even if told not to
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const extracted = cleaned.substring(firstBrace, lastBrace + 1);
            try {
                return performSchemaValidation(JSON.parse(extracted), schema, extracted, strict);
            } catch (innerError: any) {
                // If still failing, it might be a real syntax error (e.g. unescaped quotes)
                if (innerError instanceof StructuredOutputError) throw innerError;
                throw new StructuredOutputError(`Failed to parse extracted AI response: ${innerError.message}`, extracted);
            }
        }

        throw new StructuredOutputError(`Failed to parse AI response as JSON: ${(e as any).message}`, cleaned);
    }
}

/**
 * Internal helper to run Zod validation if schema exists
 */
function performSchemaValidation(parsed: any, schema: any, originalRaw: string, strict: boolean = false): any {
    if (!schema) return parsed;

    const result = schema.safeParse(parsed);
    if (!result.success) {
        // --- FIX 3: Partial Salvage Acceptance ---
        // If schema fails but we have at least 4 subTopics, accept it as a "salvaged" map.
        const partial = parsed as any;
        if (
            partial?.subTopics &&
            Array.isArray(partial.subTopics) &&
            partial.subTopics.length >= 4
        ) {
            console.warn('⚠️ Accepting partial deep-mode mind map due to size limits. Zod Error:', result.error.message);
            return partial;
        }

        if (strict) {
            console.error("❌ Schema Validation Error:", result.error);
            throw new StructuredOutputError("AI response did not match the required schema structure.", originalRaw, result.error);
        } else {
            console.warn("⚠️ Schema Validation failed in loose mode, returning raw parsed JSON.");
            return parsed;
        }
    }
    return result.data;
}

