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
 * Helper to retry a function with exponential backoff
 */
async function retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 800): Promise<T> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            lastError = err;
            // Immediate retry for 502/503/504
            const isNetworkError = err.message && (
                err.message.includes('502') ||
                err.message.includes('503') ||
                err.message.includes('504') ||
                err.message.includes('fetch failed')
            );

            if (i < retries - 1) {
                const waitTime = delayMs * Math.pow(2, i);
                console.warn(`Attempt ${i + 1} failed, retrying in ${waitTime}ms...`, err.message);
                await new Promise(res => setTimeout(res, waitTime));
            }
        }
    }
    throw lastError;
}

// Simple in-memory circuit breaker
let pollinationsDisabledUntil = 0;

function isPollinationsAvailable() {
    return Date.now() > pollinationsDisabledUntil;
}

function disablePollinations(minutes = 10) {
    pollinationsDisabledUntil = Date.now() + minutes * 60 * 1000;
    console.warn(`🚫 Pollinations disabled for ${minutes} minutes due to repeated failures.`);
}

/**
 * Unified AI Client Dispatcher
 * Routes requests to the appropriate provider (Gemini or Pollinations)
 * based on the user's configuration.
 */
export async function generateContent(options: GenerateContentOptions): Promise<any> {
    let { provider = 'pollinations' } = options;
    const { apiKey, systemPrompt, userPrompt, images } = options;

    // 1. Try Pollinations (if selected AND available)
    if (provider === 'pollinations') {
        if (isPollinationsAvailable()) {
            try {
                return await retry(() => generateContentWithPollinations(systemPrompt, userPrompt, images));
            } catch (error: any) {
                console.warn("⚠️ Pollinations failed, automatically falling back to Gemini.", error);

                // Trip circuit breaker if it's a 500-level error
                if (error.message && (error.message.includes('502') || error.message.includes('503') || error.message.includes('504'))) {
                    disablePollinations(5); // Disable for 5 mins
                }

                // Fallthrough to Gemini
                provider = 'gemini';
            }
        } else {
            console.warn("⚠️ Pollinations is temporarily disabled due to recent failures. Using Gemini instead.");
            provider = 'gemini';
        }
    }

    // 2. Gemini (Selected OR Fallback)
    if (provider === 'gemini') {
        // Resolve API key: provided key > environment key
        const effectiveApiKey = apiKey || process.env.GOOGLE_GENAI_API_KEY;

        if (!effectiveApiKey) {
            throw new Error("Gemini provider requires an API Key. Please configure GOOGLE_GENAI_API_KEY or provide a custom key.");
        }

        try {
            const genAI = new GoogleGenerativeAI(effectiveApiKey);
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

