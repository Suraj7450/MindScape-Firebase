import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generates content using a custom API key via the Google Generative AI SDK.
 * This is used when a user provides their own API key in settings.
 */
export async function generateContentWithCustomKey(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string,
    responseSchema?: any // We'll assume JSON output if schema is provided or just raw text
): Promise<any> {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });

        const finalPrompt = `${systemPrompt}\n\nUser Input: ${userPrompt}`;

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();

        if (!text) throw new Error("Empty response from AI");

        return JSON.parse(text);
    } catch (error: any) {
        console.error("Custom Client AI Error:", error);
        throw new Error(`Custom API Key Generation Failed: ${error.message}`);
    }
}
