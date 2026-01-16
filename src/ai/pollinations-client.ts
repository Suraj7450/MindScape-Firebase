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
        model = 'gemini'; // Force vision model for multimodal (Officially supported)
    } else if (systemPrompt.toLowerCase().includes('json') || systemPrompt.toLowerCase().includes('schema')) {
        model = 'qwen-coder'; // Optimized for structured outputs and logic
    } else if (systemPrompt.toLowerCase().includes('advanced') || systemPrompt.toLowerCase().includes('expert')) {
        model = 'openai'; // OpenAI for deep reasoning
    }

    console.log(`🤖 Pollinations Expert Selector: Mode=${hasImages ? 'Vision' : 'Text'}, Model=${model}`);

    try {
        const messages: any[] = [
            {
                role: 'system',
                content: systemPrompt + "\n\nCRITICAL: Your entire response MUST be a single JSON object. Do not include any reasoning, pre-amble, or explanations. Start your response with '{' and end with '}'."
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
            body.max_tokens = 4096;
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
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error?.message || JSON.stringify(errorData);
            } catch (e) {
                // If it's not JSON, try to get raw text
                try {
                    const text = await response.text();
                    if (text && text.length < 200) errorMessage = text;
                } catch { /* ignore */ }
            }
            throw new Error(`Pollinations API error: ${response.status} ${errorMessage}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "";

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
                // If no JSON found, return the raw text (might be intentional for some flows)
                console.warn("Response contained no valid JSON object, returning raw text.");
                return text;
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

