/**
 * AI Client using Pollinations.ai
 * Provides free text and image generation using open source models.
 */

'use server';

export async function generateContentWithPollinations(
    systemPrompt: string,
    userPrompt: string,
    images?: { inlineData: { mimeType: string, data: string } }[]
): Promise<any> {
    // console.log("Using Pollinations.ai..."); 

    try {
        const messages: any[] = [
            { role: 'system', content: systemPrompt + "\n\nIMPORTANT: You must return ONLY valid JSON. No markdown formatting, no code blocks, just the raw JSON object." }
        ];

        // Construct user message with potential images
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
            },
            body: JSON.stringify({
                messages: messages,
                model: 'openai',
                json: true
            }),
        });

        if (!response.ok) {
            throw new Error(`Pollinations API error: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();

        console.log('🌸 Pollinations raw response (first 500 chars):', text.substring(0, 500));

        // The Pollinations API might return a message object {role, content} or direct JSON
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(text);
        } catch (e) {
            // If it's not valid JSON, try cleaning markdown
            const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
            parsedResponse = JSON.parse(cleanedText);
        }

        // Deep extraction utility to find mind map data in potentially nested response wrappers
        const deepExtract = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return null;

            // 1. Direct usable object (generic guard for both Single and Compare modes)
            if (obj.topic || obj.mode === 'compare' || obj.similarities || obj.differences) {
                return obj;
            }

            // 2. Check common content wrappers FIRST (Pollinations/OpenAI friendly)
            const content =
                obj.content ||
                obj.text ||
                obj.reasoning_content ||
                obj.message?.content ||
                (obj.choices && obj.choices[0]?.message?.content);

            if (content) {
                if (typeof content === 'string') {
                    try {
                        const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
                        const parsed = JSON.parse(cleaned);
                        return deepExtract(parsed);
                    } catch {
                        // Not JSON → ignore
                    }
                } else if (typeof content === 'object') {
                    return deepExtract(content);
                }
            }

            // 3. Handle tool_calls ONLY if non-empty
            if (Array.isArray(obj.tool_calls) && obj.tool_calls.length > 0) {
                console.log('🔧 Detected tool_calls format, extracting arguments...');
                const toolCall = obj.tool_calls[0];
                if (toolCall.function?.arguments) {
                    try {
                        const args =
                            typeof toolCall.function.arguments === 'string'
                                ? JSON.parse(toolCall.function.arguments)
                                : toolCall.function.arguments;
                        return deepExtract(args);
                    } catch (e) {
                        console.warn('⚠️ Failed to parse tool_calls arguments:', e);
                    }
                }
            } else if (obj.tool_calls) {
                console.log('⚠️ tool_calls property found but is not a non-empty array:', obj.tool_calls);
            }

            // 4. Deep recursive search
            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    const found = deepExtract(obj[key]);
                    if (found) return found;
                }
            }

            return null;
        };

        const finalResult = deepExtract(parsedResponse) || parsedResponse;

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
