import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateContentWithPollinations } from './pollinations-client';

export type AIProvider = 'gemini' | 'pollinations';

interface GenerateContentOptions {
    provider?: AIProvider;
    apiKey?: string;
    systemPrompt: string;
    userPrompt: string;
    images?: { inlineData: { mimeType: string, data: string } }[];
}

/**
 * Unified AI Client Dispatcher
 * Routes requests to the appropriate provider (Gemini or Pollinations)
 * based on the user's configuration.
 */
export async function generateContent(options: GenerateContentOptions): Promise<any> {
    const { provider = 'pollinations', apiKey, systemPrompt, userPrompt, images } = options;

    if (provider === 'pollinations') {
        return await generateContentWithPollinations(systemPrompt, userPrompt, images);
    }

    if (provider === 'gemini') {
        if (!apiKey) {
            throw new Error("Gemini provider requires an API Key.");
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

            if (!text) throw new Error("Empty response from Gemini");

            return JSON.parse(text);
        } catch (error: any) {
            console.error("Gemini AI Error:", error);
            throw error;
        }
    }

    throw new Error(`Unsupported AI Provider: ${provider}`);
}

