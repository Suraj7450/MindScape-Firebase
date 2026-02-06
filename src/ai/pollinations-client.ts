/**
 * AI Client using Pollinations.ai
 * Provides free text and image generation using open source models.
 */

'use server';

// ----------------------------------------------------------------------
// Types & Constants
// ----------------------------------------------------------------------

export type ModelCapability = 'reasoning' | 'coding' | 'fast' | 'creative';

interface ModelDef {
    id: string;
    feature: ModelCapability;
    description: string;
    context: number; // max context
    isFree: boolean;
}

// Registry of available models
const AVAILABLE_MODELS: ModelDef[] = [
    // Primary / Stable (Optimized for Mind Map generation)
    { id: 'gemini-fast', feature: 'fast', description: 'Gemini 2.0 Flash Lite', context: 32000, isFree: true },
    { id: 'openai', feature: 'creative', description: 'GPT-4o', context: 128000, isFree: false },
    { id: 'deepseek', feature: 'reasoning', description: 'DeepSeek V3', context: 64000, isFree: true },

    // Reasoning / Coding
    { id: 'deepseek-chat', feature: 'reasoning', description: 'DeepSeek Chat', context: 64000, isFree: true },

    // Fallbacks / Niche
    { id: 'sur', feature: 'creative', description: 'Sur (Claude 3.5 Sonnet)', context: 16000, isFree: true },
    { id: 'mistral-nemo', feature: 'creative', description: 'Mistral Nemo', context: 16000, isFree: true },
    { id: 'nova-fast', feature: 'fast', description: 'Amazon Nova Micro', context: 32000, isFree: true },
    { id: 'qwen-coder', feature: 'coding', description: 'Qwen 2.5 Coder 32B', context: 32000, isFree: true },
    { id: 'mistral', feature: 'coding', description: 'Mistral Large', context: 32000, isFree: true },

    // Demoted (Reasoning-heavy, unstable for long JSON)
    { id: 'openai-fast', feature: 'fast', description: 'GPT-4o Mini', context: 128000, isFree: true },
];

/**
 * Selects the best available model based on requested capability.
 * Handles fallbacks based on attempt count.
 */
function selectModel(capability: ModelCapability = 'creative', attempt: number = 0): string {
    // 1. Filter models matching capability
    const validModels = AVAILABLE_MODELS.filter(m => m.feature === capability);

    // 2. If models found and we are on an early attempt, stay within capability
    if (validModels.length > 0 && attempt < validModels.length) {
        return validModels[attempt].id;
    }

    // 3. Fallback: Rotate through ALL models to find something that works
    // This handles cases where entire capabilities (like 'coding') might be having issues
    return AVAILABLE_MODELS[attempt % AVAILABLE_MODELS.length].id;
}

export async function generateContentWithPollinations(
    systemPrompt: string,
    userPrompt: string,
    images?: { inlineData: { mimeType: string, data: string } }[],
    options: {
        model?: string,
        capability?: ModelCapability, // New: Request specific capability
        response_format?: any,
        apiKey?: string,
        skipApiKey?: boolean,
        attempt?: number,
        _stripParameters?: boolean,
        _isFailover?: boolean
    } = {}
): Promise<any> {
    const hasImages = images && images.length > 0;
    const attempt = options.attempt || 0;

    // Use specific model if provided, OR select based on capability, OR default to creative
    let model = options.model || (hasImages ? 'openai' : selectModel(options.capability || 'creative', attempt));

    // Override if specific capabilities are needed
    if (hasImages) {
        model = 'openai'; // Vision support
    } else if (systemPrompt.toLowerCase().includes('search')) {
        // Keep search model if explicitly requested or implied
        model = options.model || 'perplexity-fast';
    }

    console.log(`🤖 Pollinations Expert Selector: Mode=${hasImages ? 'Vision' : 'Text'}, Model=${model}, Attempt=${attempt}`);

    try {
        const messages: any[] = [
            {
                role: 'system',
                content: systemPrompt + `
                
CRITICAL SAFETY & OUTPUT RULES:
- You must return ONLY the final structured JSON answer.
- Do NOT include internal reasoning, analysis, planning, or hidden thoughts.
- If you cannot complete the task, return a minimal valid JSON response instead of an empty output.
- Keep the response concise, factual, and strictly schema-compliant.
- Think minimally. Output ONLY the raw JSON string.
- Start with '{' and end with '}'.
`
            }
        ];

        let userContent: any;
        if (images && images.length > 0) {
            userContent = [{ type: 'text', text: userPrompt }];
            images.forEach(img => {
                userContent.push({
                    type: 'image_url',
                    image_url: {
                        url: `data:${img.inlineData.mimeType};base64,${img.inlineData.data}`
                    }
                });
            });
        } else {
            userContent = userPrompt;
        }

        messages.push({ role: 'user', content: userContent });

        // Construct request body carefully to avoid 400 validation errors
        const body: any = {
            messages: messages,
            model: model,
            stream: false,
        };

        // Only add response_format if a schema/format is requested AND model likely supports it
        if (options.response_format && !(options as any)._stripParameters) {
            body.response_format = options.response_format;
        }

        // Increase max_tokens for models that support it to accommodate deep mind maps
        const targetModelDef = AVAILABLE_MODELS.find(m => m.id === model);

        // If it's a known model or a model with high context potential
        if (targetModelDef && targetModelDef.context >= 16000 && !(options as any)._stripParameters) {
            // High token limit is essential for deep mode mind maps (120+ items)
            // Using 12k for models that support high context (DeepSeek/Qwen/Gemini)
            // Capped at 12k specifically for DeepSeek to avoid 16k stream=true requirement
            if (model === 'qwen-coder' || model?.includes('deepseek') || model === 'gemini-fast') {
                body.max_tokens = 12024;
            } else if (model === 'openai' || model === 'sur' || model === 'openai-fast' || model === 'mistral-nemo' || model === 'mistral') {
                body.max_tokens = 8192; // Safely below context limits
            } else {
                body.max_tokens = 8192;
            }
        } else if (!targetModelDef && !(options as any)._stripParameters) {
            // Unknown model? Default to a safe limit
            body.max_tokens = 8192;
        }

        // Robust API Key selection
        // 1. First preference: Client Key
        // 2. Second preference: Server Key (if failover)
        const clientKey = (options.apiKey && options.apiKey.trim() !== "") ? options.apiKey : null;
        const serverKey = process.env.POLLINATIONS_API_KEY;
        const isFailover = (options as any)._isFailover;

        const effectiveApiKey = options.skipApiKey
            ? null
            : (clientKey && !isFailover)
                ? clientKey
                : serverKey;

        if (effectiveApiKey) {
            const keySource = (effectiveApiKey === clientKey) ? 'Client' : 'Server Env';
            console.log(`🔑 Using Pollinations Key: ${effectiveApiKey.substring(0, 7)}... (from ${keySource})`);
        }

        const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(effectiveApiKey ? { 'Authorization': `Bearer ${effectiveApiKey}` } : {})
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            let errorMessage = response.statusText;
            const status = response.status;
            let errorBody: any = null;

            try {
                errorBody = await response.json();
                if (errorBody && errorBody.error && typeof errorBody.error === 'object') {
                    errorMessage = errorBody.error.message || JSON.stringify(errorBody.error);
                } else if (errorBody && typeof errorBody === 'object') {
                    errorMessage = JSON.stringify(errorBody);
                }
            } catch (e) {
                // Fallback to text if JSON parse fails
                try {
                    errorMessage = await response.text() || response.statusText;
                } catch {
                    errorMessage = response.statusText;
                }
            }

            // Handle invalid API key or exhausted balance
            if (status === 401 || status === 403) {
                // Determine if we are currently using a client-provided key
                const isUsingClientKey = clientKey && effectiveApiKey === clientKey;

                // Case 1: Client key failed - Fallback to Server key (if different)
                if (isUsingClientKey && serverKey && serverKey !== clientKey && !isFailover) {
                    console.warn(`⚠️ Client API Key failed (${status}). Falling back to Server API Key...`);
                    return generateContentWithPollinations(systemPrompt, userPrompt, images, {
                        ...options,
                        _isFailover: true
                    });
                }

                // Case 2: Server key also failed (or we were already on it) 
                // OR no keys worked - Fallback to free-tier (mistral or selectModel('fast'))
                console.warn(`⚠️ API Key failed (${status}) for ${effectiveApiKey === serverKey ? 'Server' : 'Client'} key. Checking balance or forcing free fallback...`);

                let balanceExhausted = false;
                if (effectiveApiKey) {
                    const balanceInfo = await checkPollinationsBalance(effectiveApiKey);
                    if (balanceInfo !== null && balanceInfo <= 0) {
                        balanceExhausted = true;
                        console.error(`❌ Pollinations Balance Exhausted (0 pollen remaining).`);
                    }
                }

                console.warn(`⚠️ Forcing free-tier retry (Model: mistral, No API Key)...`);
                return generateContentWithPollinations(systemPrompt, userPrompt, images, {
                    ...options,
                    model: 'mistral',
                    apiKey: undefined,
                    skipApiKey: true,
                    _isFailover: false // Reset failover state for free retry
                });
            }

            // Handle 400 Bad Request (likely due to unsupported parameters or model limitations)
            if (status === 400) {
                const alreadyStripped = (options as any)._stripParameters;
                const hasExtraParams = options.response_format || body.max_tokens;

                if (!alreadyStripped && hasExtraParams) {
                    console.warn(`⚠️ Pollinations 400 Bad Request [Model: ${model}]: ${errorMessage}. Retrying without advanced parameters (response_format/max_tokens)...`);
                    return generateContentWithPollinations(systemPrompt, userPrompt, images, {
                        ...options,
                        _stripParameters: true // Internal flag to prevent re-adding params
                    });
                } else if (attempt < 3) {
                    // If stripping parameters didn't help or we already tried, rotate to next model
                    console.warn(`⚠️ Pollinations 400 persistent error [Model: ${model}]: ${errorMessage}. Rotating to next model (Attempt ${attempt + 1})...`);
                    return generateContentWithPollinations(systemPrompt, userPrompt, images, {
                        ...options,
                        attempt: attempt + 1, // This will select the NEXT model in selectModel()
                        _stripParameters: false // Try next model WITH parameters first
                    });
                }
            }

            // Handle service errors (Bad Gateway, Service Unavailable, etc.) with model re-selection
            const isServiceError = status >= 500 && status <= 599;
            // Allow up to 3 retries
            if (isServiceError && attempt < 3) {
                console.warn(`⚠️ Pollinations Service Error (${status}): ${errorMessage}. Rotating to next model...`);
                return generateContentWithPollinations(systemPrompt, userPrompt, images, {
                    ...options,
                    attempt: attempt + 1
                });
            }

            console.error(`❌ Pollinations API Error [Model: ${model}, Status: ${status}]:`, errorMessage);
            throw new Error(`Pollinations API error: ${status} ${errorMessage}`);
        }
        const data = await response.json();
        console.log(`✅ Pollinations Response Success [Model: ${model}]`);
        console.log('📦 Response data length:', JSON.stringify(data).length);

        const text = data.choices?.[0]?.message?.content || "";

        if (!text || text.trim() === '') {
            console.error('❌ Pollinations returned empty content. Full response:', JSON.stringify(data, null, 2));
            throw new Error('Pollinations returned empty content (reasoning-heavy or token-limited)');
        }

        let parsedResponse;
        try {
            parsedResponse = JSON.parse(text);
        } catch (e) {
            // If it's not valid JSON, try to extract and repair
            const firstBrace = text.indexOf('{');
            if (firstBrace === -1) {
                console.warn("Response contained no JSON object, returning raw text.");
                return text;
            }

            // Try to find the last valid closing brace by counting braces
            let braceCount = 0;
            let lastValidBrace = -1;
            for (let i = firstBrace; i < text.length; i++) {
                if (text[i] === '{') braceCount++;
                if (text[i] === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        lastValidBrace = i;
                        break;
                    }
                }
            }

            if (lastValidBrace === -1) {
                // JSON is incomplete - try to close it
                console.warn('⚠️ Incomplete JSON detected, attempting to repair...');
                let extracted = text.substring(firstBrace);

                // Check if we are inside an unfinished string
                const lastQuote = extracted.lastIndexOf('"');
                const prevChar = lastQuote > 0 ? extracted[lastQuote - 1] : '';
                // If the last quote isn't escaped and there's an odd number of quotes in the last level, we might be inside a string
                const quoteCount = (extracted.match(/"/g) || []).length;
                if (quoteCount % 2 !== 0) {
                    extracted += '"';
                }

                // --- ROBUST REPAIR LOGIC ---
                // 1. Close unterminated strings first
                let totalQuotes = 0;
                for (let i = 0; i < extracted.length; i++) {
                    if (extracted[i] === '"' && (i === 0 || extracted[i - 1] !== '\\')) {
                        totalQuotes++;
                    }
                }

                if (totalQuotes % 2 !== 0) {
                    // Unterminated string detected - close it
                    extracted += '"';
                }

                // 2. Remove any trailing incomplete content (after last comma or opening bracket/brace)
                const lastComma = extracted.lastIndexOf(',');
                const lastOpenBracket = extracted.lastIndexOf('[');
                const lastOpenBrace = extracted.lastIndexOf('{');
                const lastCloseBracket = extracted.lastIndexOf(']');
                const lastCloseBrace = extracted.lastIndexOf('}');

                // We find the safest cut point
                const cutPoint = Math.max(lastComma, lastCloseBracket, lastCloseBrace);

                if (cutPoint > 0 && cutPoint < extracted.length - 1) {
                    // Only cut if we are not immediately after a closing character
                    const lastChar = extracted[extracted.length - 1];
                    if (lastChar !== '}' && lastChar !== ']' && lastChar !== '"') {
                        extracted = extracted.substring(0, cutPoint);
                    }
                }

                // 3. Add missing closing brackets and braces
                let openBraces = (extracted.match(/{/g) || []).length;
                let closeBraces = (extracted.match(/}/g) || []).length;
                let openBrackets = (extracted.match(/\[/g) || []).length;
                let closeBrackets = (extracted.match(/]/g) || []).length;

                extracted += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
                extracted += '}'.repeat(Math.max(0, openBraces - closeBraces));

                try {
                    parsedResponse = JSON.parse(extracted);
                    console.log('✅ Successfully repaired incomplete JSON');
                } catch (repairError) {
                    // One final attempt: just keep adding brackets until it works or we hit a limit
                    let salvageRetry = extracted;
                    let success = false;
                    for (let i = 1; i < 10; i++) {
                        try {
                            salvageRetry += '}';
                            parsedResponse = JSON.parse(salvageRetry);
                            success = true;
                            break;
                        } catch {
                            try {
                                // Try closing bracket instead
                                let bracketRetry = salvageRetry.substring(0, salvageRetry.length - 1) + ']';
                                parsedResponse = JSON.parse(bracketRetry);
                                success = true;
                                break;
                            } catch { /* continue */ }
                        }
                    }
                    if (!success) {
                        const { StructuredOutputError } = await import('./client-dispatcher');
                        throw new StructuredOutputError(`Failed to parse or repair JSON (retryable): ${repairError}`, salvageRetry);
                    }
                }
            } else {
                // Found valid closing brace
                try {
                    parsedResponse = JSON.parse(text.substring(firstBrace, lastValidBrace + 1));
                } catch (innerE) {
                    const { StructuredOutputError } = await import('./client-dispatcher');
                    throw new StructuredOutputError(`Failed to parse extracted JSON (retryable): ${innerE}`, text.substring(firstBrace, lastValidBrace + 1));
                }
            }
        }

        // Deep extraction utility to find mind map data in potentially nested response wrappers
        const deepExtract = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return null;

            // 1. Direct usable object
            if (obj.topic || (obj.mode === 'compare' && obj.compareData)) return obj;
            if (obj.similarities || obj.differences) return obj; // Partial compare data

            // 2. Check common content wrappers
            const content =
                obj.content ||
                obj.text ||
                obj.message?.content ||
                (obj.choices && obj.choices[0]?.message?.content);

            if (content) {
                if (typeof content === 'string') {
                    try {
                        const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
                        // Try to find JSON inside the string if it's not pure JSON
                        const first = cleaned.indexOf('{');
                        const last = cleaned.lastIndexOf('}');
                        if (first !== -1 && last !== -1) {
                            return deepExtract(JSON.parse(cleaned.substring(first, last + 1)));
                        }
                        return deepExtract(JSON.parse(cleaned));
                    } catch { /* Not JSON */ }
                } else if (typeof content === 'object') {
                    return deepExtract(content);
                }
            }

            // 3. Handle tool_calls
            if (Array.isArray(obj.tool_calls) && obj.tool_calls.length > 0) {
                const toolCall = obj.tool_calls[0];
                if (toolCall.function?.arguments) {
                    try {
                        const args = typeof toolCall.function.arguments === 'string'
                            ? JSON.parse(toolCall.function.arguments)
                            : toolCall.function.arguments;
                        return deepExtract(args);
                    } catch { /* ignore */ }
                }
            }

            // 4. Recursive search
            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    const found = deepExtract(obj[key]);
                    if (found) return found;
                }
            }

            return null;
        };

        const finalResult = deepExtract(parsedResponse) || parsedResponse;
        return finalResult;
    } catch (error: any) {
        console.error("Pollinations AI Generation Failed:", error);
        throw new Error(`Pollinations API failed: ${error.message}`);
    }
}


/**
 * Checks the current pollen balance for a given API key.
 * @returns The balance as a number, or null if the check fails.
 */
export async function checkPollinationsBalance(apiKey: string): Promise<number | null> {
    try {
        const response = await fetch('https://gen.pollinations.ai/account/balance', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return typeof data.balance === 'number' ? data.balance : null;
        }
        return null;
    } catch (e) {
        console.error('⚠️ Failed to check Pollinations balance:', e);
        return null;
    }
}
