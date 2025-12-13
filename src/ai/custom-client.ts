import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateContentWithBackup } from './backup-client';

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
    // Check for explicit provider override
    if (apiKey === 'provider:pollinations') {
        return await generateContentWithBackup(systemPrompt, userPrompt);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
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
        throw error; // Propagate error directly, do not fall back
    }
}
