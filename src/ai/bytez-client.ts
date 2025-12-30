
'use server';

import Bytez from "bytez.js";

/**
 * AI Client using Bytez API
 * Provides access to various open source models.
 */
export async function generateContentWithBytez(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    modelId: string = "Qwen/Qwen3-4B-Thinking-2507" // Switching to Thinking model for better reasoning and structure
): Promise<any> {
    try {
        const sdk = new Bytez(apiKey);
        const model = sdk.model(modelId);

        const promptContent = `${systemPrompt}\n\nIMPORTANT: You must return ONLY valid JSON. No markdown formatting, no code blocks, just the raw JSON object.\n\nUser Question/Request: ${userPrompt}`;

        const { error, output } = await model.run([
            {
                "role": "user",
                "content": promptContent
            }
        ]);

        if (error) {
            throw new Error(`Bytez API error: ${JSON.stringify(error)}`);
        }

        if (!output) {
            throw new Error("No output received from Bytez");
        }

        // Handle string output or object output based on what Bytez returns
        let text = typeof output === 'string' ? output : JSON.stringify(output);

        console.log('📦 Bytez raw output snippet:', text.substring(0, 300));

        let parsedResponse;
        try {
            parsedResponse = JSON.parse(text);
        } catch (e) {
            const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
            parsedResponse = JSON.parse(cleanedText);
        }

        // Deep extraction utility to find mind map data in potentially nested response wrappers
        const deepExtract = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return null;

            // 1. Check if it's already a mind map
            if (obj.topic && (obj.subTopics || obj.subTopicsCount !== undefined)) {
                return obj;
            }

            // 2. Check known wrapper keys
            const content = obj.content || obj.text || obj.message?.content || obj.message || (obj.choices && obj.choices[0]?.message?.content);

            if (content) {
                if (typeof content === 'string') {
                    try {
                        const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
                        const parsed = JSON.parse(cleaned);
                        return deepExtract(parsed); // Recurse in case it's double-wrapped
                    } catch (e) {
                        // Not JSON, return as is if it's the last hope, but we prefer finding an object
                    }
                } else if (typeof content === 'object') {
                    return deepExtract(content);
                }
            }

            // 3. Fallback: search all values for something that looks like mind map data
            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    const found = deepExtract(obj[key]);
                    if (found) return found;
                }
            }

            return null;
        };

        const finalResult = deepExtract(parsedResponse) || parsedResponse;
        console.log('✨ Extraction complete. Final result keys:', Object.keys(finalResult || {}));

        return finalResult;
    } catch (error: any) {
        console.error("Bytez AI Generation Failed:", error);
        if (error.message && error.message.includes("upgrade your account")) {
            throw new Error("Bytez account upgrade required for this model. Try a different provider or subcribe at bytez.com.");
        }
        throw new Error(`Bytez API failed: ${error.message}`);
    }
}

/**
 * Image Generation Client using Bytez REST API v2
 * Uses dreamlike-photoreal-2.0 model for high-quality photorealistic images
 */
export async function generateImageWithBytez(
    prompt: string,
    apiKey: string,
    model: string = "dreamlike-art/dreamlike-photoreal-2.0"
): Promise<string> {
    try {
        console.log('🎨 Bytez Image API: Generating with model:', model);

        // Bytez REST API v2 endpoint
        const apiUrl = `https://api.bytez.com/models/v2/${model}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: prompt
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Bytez API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(`Bytez Image API error: ${data.error}`);
        }

        if (!data.output) {
            throw new Error("No image URL received from Bytez");
        }

        // Bytez v2 returns an image URL, fetch it and convert to base64
        console.log('🖼️ Bytez Image URL:', data.output);

        const imageResponse = await fetch(data.output);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64 = Buffer.from(imageBuffer).toString('base64');

        // Determine content type from response or default to PNG
        const contentType = imageResponse.headers.get('content-type') || 'image/png';

        return `data:${contentType};base64,${base64}`;
    } catch (error: any) {
        console.error("Bytez Image Generation Failed:", error);
        throw new Error(`Bytez Image API failed: ${error.message}`);
    }
}
