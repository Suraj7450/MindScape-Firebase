/**
 * AI Client using Pollinations.ai
 * Provides free text and image generation using open source models.
 */

'use server';

export async function generateContentWithPollinations(
    systemPrompt: string,
    userPrompt: string,
    images?: { inlineData: { mimeType: string, data: string } }[],
    options: { model?: string } = {}
): Promise<any> {
    // Auto-select model based on content if not specified
    // 'openai' (openai-fast) is great for text but doesn't support vision
    // 'gemini' (gemini-2.5-flash-lite) supports vision and tools
    const hasImages = images && images.length > 0;
    // 'mistral' is more reliable for strict JSON than 'openai' (reasoning model)
    const model = options.model || (hasImages ? 'gemini' : 'mistral');

    try {
        const messages: any[] = [
            {
                role: 'system',
                content: systemPrompt + "\n\nCRITICAL: Your entire response MUST be a single JSON object. Do not include any reasoning, pre-amble, or explanations. Start your response with '{' and end with '}'."
            }
        ];

        // ... (messages construction remains same) ...
        const userContent: any[] = [{ type: 'text', text: userPrompt }];

        if (images && images.length > 0) {
            images.forEach(img => {
                userContent.push({
                    type: 'image_url',
                    image_url: {
                        url: `data:${img.inlineData.mimeType};base64,${img.inlineData.data}`
                    }
                });
            });
        }

        messages.push({ role: 'user', content: userContent });

        // Pollinations.ai text generation endpoint
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(process.env.POLLINATIONS_API_KEY ? { 'Authorization': `Bearer ${process.env.POLLINATIONS_API_KEY}` } : {})
            },
            body: JSON.stringify({
                messages: messages,
                model: model,
                json: true
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Pollinations API error: ${response.status} ${errorText || response.statusText}`);
        }

        const text = await response.text();
        // console.log('🌸 Pollinations raw response:', text.substring(0, 500));

        let parsedResponse;
        try {
            parsedResponse = JSON.parse(text);
        } catch (e) {
            // If it's not valid JSON, try to extract the first JSON object
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                try {
                    parsedResponse = JSON.parse(text.substring(firstBrace, lastBrace + 1));
                } catch (innerE) {
                    throw new Error(`Failed to parse extracted JSON: ${innerE}`);
                }
            } else {
                throw new Error("Response contained no valid JSON object.");
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

        if (!finalResult) {
            console.warn('⚠️ Deep extraction failed to find a usable object in the AI response.');
        } else {
            console.log('✨ Extraction complete. Final result keys:', Object.keys(finalResult));
        }

        return finalResult;
    } catch (error: any) {
        console.error("Pollinations AI Generation Failed:", error);
        throw new Error(`Pollinations API failed: ${error.message}`);
    }
}
