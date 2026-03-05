import { generateContentWithPollinations, ModelCapability } from './pollinations-client';
export type AIProvider = 'pollinations';

interface GenerateContentOptions {
    provider?: AIProvider;
    apiKey?: string;
    systemPrompt: string;
    userPrompt: string;
    images?: { inlineData: { mimeType: string, data: string } }[];
    schema?: any; // Zod schema for validation
    model?: string; // Optional model name
    capability?: ModelCapability; // Optional capability hint
    strict?: boolean; // Optional strict response validation
    options?: {
        model?: string;
        capability?: ModelCapability;
    };
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
async function retry<T>(fn: (attempt: number) => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn(i);
        } catch (err: any) {
            lastError = err;

            const errorMessage = err.message || "";
            const statusCode = err.status || (err.response && err.response.status);

            const isRateLimit = statusCode === 429 || errorMessage.toLowerCase().includes('rate limit');
            const isTimeout = statusCode === 408 ||
                errorMessage.toLowerCase().includes('timeout') ||
                err.code === 'UND_ERR_HEADERS_TIMEOUT';
            const isRetryableServerErr = statusCode >= 500 || [502, 503, 504].includes(statusCode);

            // AI-specific retryable errors: syntax errors in JSON and reasoning-only outputs
            const isAISyntaxError = (err instanceof StructuredOutputError || err.name === 'StructuredOutputError') && !err.zodError;
            const isReasoningOnlyErr =
                errorMessage.toLowerCase().includes('reasoning-only') ||
                errorMessage.toLowerCase().includes('empty content') ||
                errorMessage.toLowerCase().includes('reasoning-heavy');

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

    getFailureCount(provider: AIProvider): number {
        return this.health[provider]?.failure || 0;
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
function isReasoningOnly(raw: any, schema?: any, isFinalAttempt: boolean = false): boolean {
    if (typeof raw !== 'object' || raw === null) return false;

    // Detect reasoning-heavy fields used by various models
    const hasReasoning = !!raw.reasoning_content || !!raw.reasoning || (typeof raw.thought === 'string' && raw.thought.length > 200);

    // Check for "meaningful" data.
    const hasSubTopics = Array.isArray(raw.subTopics) && raw.subTopics.length > 0;
    const hasCompareData = !!raw.compareData || !!raw.similarities || !!raw.differences;
    const hasRootData = !!raw.root || !!raw.topic;

    // Check for general content fields (for non-mindmap tasks)
    const hasGeneralContent = !!raw.content || !!raw.text || !!raw.enhancedPrompt || !!raw.answer || !!raw.result;

    // Mind Map detection
    const isMindMapSchema = (schema?.description || '').toLowerCase().includes('mind map') || JSON.stringify(schema || {}).toLowerCase().includes('subtopics');

    if (isMindMapSchema && hasRootData && !hasSubTopics) {
        if (isFinalAttempt) {
            console.warn('⚠️ Final attempt: Accepting response with topic but no subTopics.');
            return false;
        }
        return true;
    }

    // If it has reasoning but ALSO has either mindmap data, compare data, OR general content, it's NOT reasoning-only.
    const hasActualData = hasSubTopics || hasCompareData || hasGeneralContent;

    // If it's a very small object and has reasoning, it's likely reasoning-only
    if (Object.keys(raw).length <= 2 && hasReasoning && !hasActualData) {
        return !isFinalAttempt;
    }

    // If it's not a mindmap or compare task, be much more lenient
    if (!isMindMapSchema && !hasCompareData) {
        // If it has any data at all, it's fine
        if (hasActualData) return false;
        // If it only has reasoning and it's not the final attempt, retry
        return hasReasoning && !isFinalAttempt;
    }

    return hasReasoning && !hasActualData;
}

/**
 * Unified AI Client Dispatcher
 * Routes requests to the appropriate provider (Pollinations only now!)
 */
export async function generateContent(options: GenerateContentOptions): Promise<any> {
    const provider: AIProvider = 'pollinations'; // Force pollinations
    const { apiKey, systemPrompt, userPrompt, images, schema } = options;
    const strict = false; // Rigidly disabled

    // Inject JSON-only instruction into system prompt if schema is provided
    const effectiveSystemPrompt = schema
        ? `${systemPrompt}\n\nPlease respond with a valid JSON object matching the requested schema.`
        : systemPrompt;

    console.log('🔌 AI Provider: pollinations (Single engine active)');

    try {
        const result = await retry(async (retryIndex) => {
            const retriesCount = 2;
            const isFinalAttempt = retryIndex === retriesCount - 1;

            // Tracking total attempt for model rotation (monitor failures + current retry index)
            const baseFailureCount = providerMonitor.getFailureCount('pollinations');
            const currentAttempt = baseFailureCount + retryIndex;

            const raw = await generateContentWithPollinations(effectiveSystemPrompt, userPrompt, images, {
                model: options.model || options.options?.model,
                capability: options.capability || options.options?.capability,
                apiKey: options.apiKey,
                response_format: schema ? { type: 'json_object' } : undefined,
                attempt: currentAttempt
            });

            if (isReasoningOnly(raw, schema, isFinalAttempt)) {
                throw new Error('Pollinations returned reasoning-only or empty data (retryable)');
            }

            console.log(`✅ Pollinations Response Success. Raw length: ${JSON.stringify(raw).length} chars`);
            return validateAndParse(raw, schema, strict);
        }, 2); // 2 retries as requested

        providerMonitor.recordSuccess('pollinations');
        return result;
    } catch (error: any) {
        providerMonitor.recordFailure('pollinations');
        console.error("Pollinations AI Error:", error);
        throw error;
    }
}

/**
 * Normalizes a {name, children} tree format into the expected mind map schema.
 * Some models (gemini-fast) return a generic tree instead of the exact schema.
 * 
 * Tree depth mapping:
 *   Root          → { topic, shortTitle, icon, subTopics }
 *   Level 1       → subTopics: [{ name, icon, categories }]
 *   Level 2       → categories: [{ name, icon, subCategories }]
 *   Level 3+      → subCategories: [{ name, description, icon }]
 */
function normalizeMindMapTree(tree: any): any {
    const rootName = tree.name || tree.title || 'Document Mind Map';
    const rootChildren = tree.children || [];

    // Build subTopics from level 1 children
    const subTopics = rootChildren.map((l1: any) => {
        const l1Children = l1.children || [];

        // Build categories from level 2 children
        const categories = l1Children.map((l2: any) => {
            const l2Children = l2.children || [];

            // Build subCategories from level 3+ children
            const subCategories = l2Children.map((l3: any) => ({
                name: l3.name || l3.title || 'Detail',
                description: l3.description || l3.value || l3.content
                    || (l3.children && l3.children.length > 0
                        ? l3.children.map((c: any) => c.name || c.title || '').join(', ')
                        : `Details about ${l3.name || 'this item'}`),
                icon: l3.icon || 'circle',
                tags: l3.tags || [],
            }));

            return {
                name: l2.name || l2.title || 'Category',
                icon: l2.icon || 'folder',
                subCategories: subCategories.length > 0 ? subCategories : [
                    { name: l2.name || 'Detail', description: l2.description || `About ${l2.name}`, icon: 'circle' }
                ],
            };
        });

        return {
            name: l1.name || l1.title || 'Sub-Topic',
            icon: l1.icon || 'layers',
            categories: categories.length > 0 ? categories : [
                {
                    name: l1.name || 'Overview',
                    icon: 'folder',
                    subCategories: [
                        { name: l1.name || 'Detail', description: l1.description || `About ${l1.name}`, icon: 'circle' }
                    ]
                }
            ],
        };
    });

    const normalized = {
        mode: 'single' as const,
        topic: rootName,
        shortTitle: rootName.split(' ').slice(0, 3).join(' '),
        icon: tree.icon || 'brain',
        subTopics: subTopics.length > 0 ? subTopics : [],
    };

    console.log(`🔄 Normalized: topic="${normalized.topic}", subTopics=${normalized.subTopics.length}`);
    return normalized;
}

/**
 * Validates and parses the AI response text.
 * Handles markdown stripping, robust JSON extraction, and schema validation.
 */
function validateAndParse(raw: any, schema?: any, strict: boolean = false): any {
    if (typeof raw !== 'string') {
        // Debug: log what the AI returned at the top level
        if (typeof raw === 'object' && raw !== null) {
            const keys = Object.keys(raw);
            console.log(`🔍 validateAndParse: raw is object with keys [${keys.slice(0, 10).join(', ')}]`);

            // If top-level keys don't include expected schema fields, check for nested wrappers
            if (!raw.topic && !raw.subTopics && !raw.compareData) {
                // 1. Check for simple wrapper keys like { mindMap: {...} }
                const wrapperKeys = ['mindMap', 'mindmap', 'data', 'result', 'output', 'response', 'mind_map'];
                for (const key of wrapperKeys) {
                    if (raw[key] && typeof raw[key] === 'object') {
                        console.log(`🔍 validateAndParse: Unwrapping nested data from "${key}" key`);
                        raw = raw[key];
                        break;
                    }
                }

                // 2. Normalize {name, children} tree format → expected schema format
                // Some models (gemini-fast) return a generic tree instead of the exact schema
                if (!raw.topic && raw.name && Array.isArray(raw.children)) {
                    console.log(`🔄 validateAndParse: Normalizing {name, children} format → schema format`);
                    raw = normalizeMindMapTree(raw);
                }
            }
        }

        if (schema) {
            const result = schema.safeParse(raw);
            if (!result.success) {
                if (strict) {
                    throw new StructuredOutputError("Schema validation failed", JSON.stringify(raw), result.error);
                } else {
                    console.warn("⚠️ Schema validation failed in loose mode, ensuring minimum structure:", result.error.message);
                    // Ensure at least an empty array for subTopics to prevent runtime crashes
                    if (!raw.subTopics) raw.subTopics = [];
                    return raw;
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
        // If no schema is expected, this is a plain-text response — return it as-is
        if (!schema) return cleaned;

        // 3. Robust Extraction fallback (only for structured/schema responses)
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
        // --- FIX 3: Enhanced Partial Salvage Acceptance ---
        // If schema fails, we still try to salvage as much as possible to prevent UI crashes.
        const partial = parsed as any;

        // Ensure top-level structure
        if (!partial.subTopics || !Array.isArray(partial.subTopics)) {
            partial.subTopics = [];
        }

        // Recursive sanitization to ensure every node has its required child arrays
        // This prevents "cannot read property map of undefined" in the frontend.
        partial.subTopics.forEach((st: any) => {
            if (!st.categories || !Array.isArray(st.categories)) {
                st.categories = [];
            }
            st.categories.forEach((cat: any) => {
                if (!cat.subCategories || !Array.isArray(cat.subCategories)) {
                    cat.subCategories = [];
                }
            });
        });

        // If we have at least 2 subTopics OR we are in loose mode, proceed with the sanitized map.
        if (partial.subTopics.length >= 2 || !strict) {
            console.warn('⚠️ Salvaging partial mind map after schema/truncation mismatch. Zod Error:', result.error.message);
            return partial;
        }

        if (strict) {
            console.error("❌ Schema Validation Error:", result.error);
            throw new StructuredOutputError("AI response did not match the required schema structure.", originalRaw, result.error);
        }
    }
    return result.data;
}

