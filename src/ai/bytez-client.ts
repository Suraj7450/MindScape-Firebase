
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
 * Image Generation Client using Bytez API
 */
export async function generateImageWithBytez(
    prompt: string,
    apiKey: string,
    modelId: string = "stable-diffusion-v1-5/stable-diffusion-v1-5"
): Promise<string> {
    try {
        const sdk = new Bytez(apiKey);
        const model = sdk.model(modelId);

        const { error, output } = await model.run(prompt);

        if (error) {
            throw new Error(`Bytez Image API error: ${JSON.stringify(error)}`);
        }

        if (!output) {
            throw new Error("No image data received from Bytez");
        }

        // Convert the binary output to a base64 data URI
        const buffer = Buffer.from(output as any);
        const base64 = buffer.toString('base64');
        return `data:image/png;base64,${base64}`;
    } catch (error: any) {
        console.error("Bytez Image Generation Failed:", error);
        throw new Error(`Bytez Image API failed: ${error.message}`);
    }
}
