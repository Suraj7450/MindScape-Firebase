import { GoogleGenAI } from '@google/genai';
import { generateContentWithPollinations } from './pollinations-client';
export type AIProvider = 'gemini' | 'pollinations';

interface GenerateContentOptions {
    provider?: AIProvider;
    apiKey?: string;
    systemPrompt: string;
    userPrompt: string;
    images?: { inlineData: { mimeType: string, data: string } }[];
    strict?: boolean; // If true, do not fall back to other providers
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
    let { provider = 'pollinations' } = options;
    const { apiKey, systemPrompt, userPrompt, images, strict, schema } = options;

    // Self-Healing: Check if preferred provider is degraded
    if (!strict) {
        const status = providerMonitor.getStatus(provider);
        if (status !== 'healthy') {
            console.warn(`🔄 Preferred provider ${provider} is ${status}. Attempting auto-fallback.`);
            // Choose a fallback
            if (provider === 'pollinations') {
                provider = 'gemini';
            } else if (provider === 'gemini') {
                provider = 'pollinations';
            }
        }
    }

    // Inject JSON-only instruction into system prompt if schema is provided
    const effectiveSystemPrompt = schema
        ? `${systemPrompt}\n\nSTRICT JSON ENFORCEMENT: You must respond ONLY with a valid JSON object matching the requested schema. No prose, no conversation, no markdown markers like \`\`\`json.`
        : systemPrompt;

    console.log('🔌 AI Provider selected:', provider);

    // 1. Try Pollinations (if selected AND available)
    if (provider === 'pollinations') {
        if (isPollinationsAvailable()) {
            try {
                const result = await retry(async () => {
                    const raw = await generateContentWithPollinations(effectiveSystemPrompt, userPrompt, images, {
                        model: options.model,
                        response_format: schema ? { type: 'json_object' } : undefined
                    });

                    if (isReasoningOnly(raw)) {
                        throw new Error('Pollinations returned reasoning-only output (retryable)');
                    }

                    return validateAndParse(raw, schema);
                }, 3);

                providerMonitor.recordSuccess('pollinations');
                return result;
            } catch (error: any) {
                providerMonitor.recordFailure('pollinations');
                console.warn("⚠️ Pollinations failed after retries:", error.message);

                // Trip circuit breaker if it's a 500-level error
                if (error.message && (error.message.includes('502') || error.message.includes('503') || error.message.includes('504'))) {
                    disablePollinations(5);
                }

                // Fallback to Gemini if NOT strict.
                if (strict) {
                    throw error;
                }

                console.warn(`🔄 Falling back to Gemini due to Pollinations error: ${error.message}`);
                provider = 'gemini';
            }
        } else {
            if (strict || options.provider === 'pollinations') {
                throw new Error("Pollinations is temporarily disabled due to failures. Please try again in 5-10 minutes.");
            }
            console.warn("⚠️ Pollinations is temporarily disabled. Falling back to Gemini.");
            provider = 'gemini';
        }
    }

    // 3. Gemini (Selected OR Fallback)
    if (provider === 'gemini') {
        const effectiveApiKey = apiKey || process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

        if (!effectiveApiKey) {
            throw new Error("Gemini provider requires an API Key. Please configure GOOGLE_GENAI_API_KEY or GEMINI_API_KEY or provide a custom key.");
        }

        try {
            const ai = new GoogleGenAI({ apiKey: effectiveApiKey });

            const contents: any[] = [userPrompt];
            if (images && images.length > 0) {
                contents.push(...images);
            }

            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: contents,
                config: {
                    systemInstruction: systemPrompt,
                    responseMimeType: 'application/json'
                }
            });

            if (!response) throw new Error("No response received from Gemini");

            const text = response.text;
            if (!text) {
                throw new Error("Empty response from Gemini");
            }

            console.log(`📝 Raw AI text response: ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`);

            const result = validateAndParse(text, schema);
            providerMonitor.recordSuccess('gemini');
            return result;
        } catch (error: any) {
            providerMonitor.recordFailure('gemini');
            console.error("Gemini AI Error:", error);
            throw error;
        }
    }

    throw new Error(`Unsupported AI Provider: ${provider}`);
}

/**
 * Validates and parses the AI response text.
 * Handles markdown stripping, robust JSON extraction, and schema validation.
 */
function validateAndParse(raw: any, schema?: any): any {
    if (typeof raw !== 'string') {
        if (schema) {
            const result = schema.safeParse(raw);
            if (!result.success) {
                throw new StructuredOutputError("Schema validation failed", JSON.stringify(raw), result.error);
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
        return performSchemaValidation(JSON.parse(cleaned), schema, cleaned);
    } catch (e) {
        // 3. Robust Extraction fallback
        // Sometimes models prefix the JSON with prose even if told not to
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const extracted = cleaned.substring(firstBrace, lastBrace + 1);
            try {
                return performSchemaValidation(JSON.parse(extracted), schema, extracted);
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
function performSchemaValidation(parsed: any, schema: any, originalRaw: string): any {
    if (!schema) return parsed;

    const result = schema.safeParse(parsed);
    if (!result.success) {
        console.error("❌ Schema Validation Error:", result.error);
        throw new StructuredOutputError("AI response did not match the required schema structure.", originalRaw, result.error);
    }
    return result.data;
}

