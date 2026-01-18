/**
 * AI Client using Pollinations.ai
 * Provides free text and image generation using open source models.
 */

'use server';

export async function generateContentWithPollinations(
    systemPrompt: string,
    userPrompt: string,
    images?: { inlineData: { mimeType: string, data: string } }[],
    options: { model?: string, response_format?: any } = {}
): Promise<any> {
    // Expert Model Selection Logic
    const hasImages = images && images.length > 0;
    let model = 'mistral'; // Default stable foundation

    if (hasImages) {
        model = 'openai'; // Vision support
    } else if (userPrompt.toLowerCase().includes('deep') || userPrompt.toLowerCase().includes('108 items')) {
        model = 'openai'; // Heavy lifting for complex structures
    } else if (systemPrompt.toLowerCase().includes('json') || systemPrompt.toLowerCase().includes('schema')) {
        model = 'mistral'; // Stable for standard JSON
    } else if (systemPrompt.toLowerCase().includes('advanced') || systemPrompt.toLowerCase().includes('expert') || systemPrompt.toLowerCase().includes('reasoning')) {
        model = 'openai'; // Strong reasoning
    } else if (systemPrompt.toLowerCase().includes('search')) {
        model = 'openai'; // Search/Execution
    }

    console.log(`🤖 Pollinations Expert Selector: Mode=${hasImages ? 'Vision' : 'Text'}, Model=${model}`);

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
        // Some Pollinations models fail if they see response_format or max_tokens in a strict way
        if (options.response_format) {
            body.response_format = options.response_format;
        }

        // Increase max_tokens for models that support it to accommodate deep mind maps
        const modelsWithLargeContext = ['openai', 'gpt-4o', 'gemini', 'qwen', 'mistral', 'qwen-coder', 'mistral-nemo'];
        if (modelsWithLargeContext.includes(model)) {
            body.max_tokens = 8192; // Increased for deep mode mind maps
        }

        const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(process.env.POLLINATIONS_API_KEY ? { 'Authorization': `Bearer ${process.env.POLLINATIONS_API_KEY}` } : {})
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            let errorMessage = response.statusText;
            const status = response.status;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error?.message || JSON.stringify(errorData);
            } catch (e) {
                try {
                    const text = await response.text();
                    if (text) errorMessage = text.substring(0, 500);
                } catch { /* ignore */ }
            }
            console.error(`❌ Pollinations API Error [Model: ${model}, Status: ${status}]:`, errorMessage);
            throw new Error(`Pollinations API error: ${status} ${errorMessage}`);
        }

        const data = await response.json();
        console.log(`✅ Pollinations Response Success [Model: ${model}]`);
        console.log('📦 Response data:', JSON.stringify(data, null, 2).substring(0, 500));

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

