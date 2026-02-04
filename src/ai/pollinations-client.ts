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
    // Reasoning / Coding (High Intelligence, JSON Structure)
    { id: 'qwen-coder', feature: 'coding', description: 'Qwen 2.5 Coder 32B', context: 32000, isFree: true },
    { id: 'deepseek', feature: 'reasoning', description: 'DeepSeek V3', context: 64000, isFree: true },
    { id: 'mistral-nemo', feature: 'coding', description: 'Mistral Nemo 12B', context: 16000, isFree: true },

    // Fast / Economy (High Speed, Lower Cost)
    { id: 'nova-fast', feature: 'fast', description: 'Amazon Nova Micro', context: 32000, isFree: true },
    { id: 'gemini-fast', feature: 'fast', description: 'Gemini 2.5 Flash Lite', context: 32000, isFree: true },
    { id: 'openai-fast', feature: 'fast', description: 'GPT-4o Mini', context: 8192, isFree: true },

    // Creative / General (Balanced)
    { id: 'openai', feature: 'creative', description: 'GPT-4o', context: 8192, isFree: false },
    { id: 'mistral', feature: 'creative', description: 'Mistral Small', context: 8192, isFree: true },
    { id: 'qwen', feature: 'creative', description: 'Qwen 2.5 72B', context: 16000, isFree: true },
];

/**
 * Selects the best available model based on requested capability.
 * Handles fallbacks based on attempt count.
 */
function selectModel(capability: ModelCapability = 'creative', attempt: number = 0): string {
    // 1. Filter models matching capability
    const validModels = AVAILABLE_MODELS.filter(m => m.feature === capability);

    // 2. If models found, rotate through them
    if (validModels.length > 0) {
        return validModels[attempt % validModels.length].id;
    }

    // 3. Fallback: Try 'fast' models if original capability exhausted
    if (capability !== 'fast') {
        const fastModels = AVAILABLE_MODELS.filter(m => m.feature === 'fast');
        if (fastModels.length > 0) {
            return fastModels[attempt % fastModels.length].id;
        }
    }

    // 4. Final Fallback: Qwen Coder (reliable workhorse)
    return 'qwen-coder';
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
        _stripParameters?: boolean
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
CRITICAL:
- Do NOT include reasoning, planning, analysis, or internal thoughts.
- Think minimally.
- Output ONLY the final JSON object.
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
        if (options.response_format) {
            body.response_format = options.response_format;
        }

        // Increase max_tokens for models that support it to accommodate deep mind maps
        const targetModelDef = AVAILABLE_MODELS.find(m => m.id === model);
        if (targetModelDef && targetModelDef.context >= 16000 && !(options as any)._stripParameters) {
            // High token limit is essential for deep mode mind maps (120+ items)
            // Reduced Mistral limit to 8192 to prevent 400 Bad Request errors
            body.max_tokens = (model === 'qwen-coder') ? 16384 : 8192;
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

            // Handle invalid API key or exhausted balance
            if (status === 401 || status === 403) {
                // Determine if we are currently using a client-provided key
                const isUsingClientKey = clientKey && effectiveApiKey === clientKey;

                // Case 1: Client key failed - Fallback to Server key (if different)
                if (isUsingClientKey && serverKey && serverKey !== clientKey && !isFailover) {
                    console.warn(`⚠️ Client API Key failed (${status}). Falling back to Server API Key...`);
                    return generateContentWithPollinations(systemPrompt, userPrompt, images, {
                        ...options,
                        _isFailover: true as any
                    } as any);
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
                    _isFailover: false as any // Reset failover state for free retry
                });
            }

            // Handle 400 Bad Request (likely due to unsupported parameters or model limitations)
            if (status === 400) {
                const alreadyStripped = (options as any)._stripParameters;
                const hasExtraParams = options.response_format || body.max_tokens;

                if (!alreadyStripped && hasExtraParams) {
                    console.warn(`⚠️ Pollinations 400 Bad Request [Model: ${model}]. Retrying without advanced parameters (response_format/max_tokens)...`);
                    return generateContentWithPollinations(systemPrompt, userPrompt, images, {
                        ...options,
                        _stripParameters: true // Internal flag to prevent re-adding params
                    } as any);
                } else if (attempt < 3) {
                    // If stripping parameters didn't help or we already tried, rotate to next model
                    console.warn(`⚠️ Pollinations 400 persistent error [Model: ${model}]. Rotating to next model (Attempt ${attempt + 1})...`);
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
            throw new Error('Pollinations returned empty content');
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

                // Remove any trailing incomplete content (after last comma or opening bracket/brace)
                // We want to stop at the last point where a "value" was completed.
                const lastComma = extracted.lastIndexOf(',');
                const lastOpenBracket = extracted.lastIndexOf('[');
                const lastOpenBrace = extracted.lastIndexOf('{');
                const lastCloseBracket = extracted.lastIndexOf(']');
                const lastCloseBrace = extracted.lastIndexOf('}');

                // We find the safest cut point
                const cutPoint = Math.max(lastComma, lastCloseBracket, lastCloseBrace);

                if (cutPoint > 0 && cutPoint < extracted.length - 1) {
                    extracted = extracted.substring(0, cutPoint);
                }

                // Add missing closing brackets and braces
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
                    for (let i = 1; i < 5; i++) {
                        try {
                            salvageRetry += '}';
                            parsedResponse = JSON.parse(salvageRetry);
                            success = true;
                            break;
                        } catch {
                            try {
                                salvageRetry = salvageRetry.substring(0, salvageRetry.length - 1) + ']';
                                parsedResponse = JSON.parse(salvageRetry);
                                success = true;
                                break;
                            } catch { /* continue */ }
                        }
                    }
                    if (!success) {
                        throw new Error(`Failed to parse or repair JSON: ${repairError}`);
                    }
                }
            } else {
                // Found valid closing brace
                try {
                    parsedResponse = JSON.parse(text.substring(firstBrace, lastValidBrace + 1));
                } catch (innerE) {
                    throw new Error(`Failed to parse extracted JSON: ${innerE}`);
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
