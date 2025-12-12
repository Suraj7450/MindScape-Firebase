import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generates content using a custom API key via the Google Generative AI SDK.
 * This is used when a user provides their own API key in settings.
 */
export async function generateContentWithCustomKey(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string,
    images?: { inlineData: { mimeType: string, data: string } }[]
): Promise<any> {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp', // Using the experimental version which is free-to-use currently
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });

        const parts: any[] = [{ text: `${systemPrompt}\n\n${userPrompt}` }];

        if (images && images.length > 0) {
            parts.push(...images);
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        if (!text) throw new Error("Empty response from AI");

        return JSON.parse(text);
    } catch (error: any) {
        console.error("Custom Client AI Error:", error);
        throw new Error(`Custom API Key Generation Failed: ${error.message}`);
    }
}
