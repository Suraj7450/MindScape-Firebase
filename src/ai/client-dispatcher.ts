import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateContentWithPollinations } from './pollinations-client';
import { generateContentWithBytez } from './bytez-client';

export type AIProvider = 'gemini' | 'pollinations' | 'bytez';

interface GenerateContentOptions {
    provider?: AIProvider;
    apiKey?: string;
    systemPrompt: string;
    userPrompt: string;
    images?: { inlineData: { mimeType: string, data: string } }[];
    strict?: boolean; // If true, do not fall back to other providers
}

/**
 * Helper to retry a function with exponential backoff
 */
async function retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            lastError = err;

            const errorMessage = err.message || "";
            const isConcurrencyError = errorMessage.toLowerCase().includes('concurrency') ||
                errorMessage.toLowerCase().includes('rate limit');

            if (i < retries - 1) {
                // For concurrency errors, we wait much longer and add significant jitter
                const jitter = Math.random() * 2000;
                const waitTime = isConcurrencyError
                    ? (3000 * (i + 1)) + jitter  // Wait 3s, 6s, 9s... + jitter
                    : delayMs * Math.pow(2, i) + jitter;

                console.warn(`Attempt ${i + 1} failed (${isConcurrencyError ? 'Concurrency/Rate' : 'Error'}), retrying in ${Math.round(waitTime)}ms...`, errorMessage);
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
    const { apiKey, systemPrompt, userPrompt, images, strict } = options;

    console.log('🔌 AI Provider selected:', provider);

    // 1. Try Pollinations (if selected AND available)
    if (provider === 'pollinations') {
        if (isPollinationsAvailable()) {
            try {
                return await retry(() => generateContentWithPollinations(systemPrompt, userPrompt, images));
            } catch (error: any) {
                console.warn("⚠️ Pollinations failed.", error.message);

                if (strict) {
                    throw new Error(`Pollinations failed and strict mode is enabled: ${error.message}`);
                }

                // Trip circuit breaker if it's a 500-level error
                if (error.message && (error.message.includes('502') || error.message.includes('503') || error.message.includes('504'))) {
                    disablePollinations(5); // Disable for 5 mins
                }

                provider = 'gemini';
            }
        } else {
            if (strict) {
                throw new Error("Pollinations is temporarily disabled and strict mode is enabled.");
            }
            console.warn("⚠️ Pollinations is temporarily disabled. Falling back to Gemini.");
            provider = 'gemini';
        }
    }

    // 2. Bytez (if selected)
    if (provider === 'bytez') {
        const effectiveApiKey = apiKey || process.env.BYTEZ_API_KEY || "d5caaa723585c02422e1b4990d15e6e0";
        if (!effectiveApiKey) {
            throw new Error("Bytez provider requires an API Key.");
        }
        try {
            return await retry(() => generateContentWithBytez(systemPrompt, userPrompt, effectiveApiKey));
        } catch (error: any) {
            console.warn("⚠️ Bytez failed.", error.message);
            if (strict) {
                throw new Error(`Bytez failed and strict mode is enabled: ${error.message}`);
            }
            provider = 'gemini'; // Fallback to Gemini
        }
    }

    // 3. Gemini (Selected OR Fallback)
    if (provider === 'gemini') {
        // Resolve API key: provided key > environment key
        const effectiveApiKey = apiKey || process.env.GOOGLE_GENAI_API_KEY;

        if (!effectiveApiKey) {
            throw new Error("Gemini provider requires an API Key. Please configure GOOGLE_GENAI_API_KEY or provide a custom key.");
        }

        try {
            const genAI = new GoogleGenerativeAI(effectiveApiKey);
            // Using gemini-1.5-flash-latest for better resilience against 404s on specific API versions
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash-latest',
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

            if (!response) throw new Error("No response received from Gemini");

            const text = response.text();
            if (!text) {
                // Check for safety ratings or other reasons for no text
                const safety = response.promptFeedback?.blockReason;
                throw new Error(safety ? `Gemini blocked content: ${safety}` : "Empty response from Gemini");
            }

            console.log(`📝 Raw AI text response: ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`);
            const parsed = JSON.parse(text);
            console.log('🎯 Parsed JSON keys:', Object.keys(parsed));

            return parsed;
        } catch (error: any) {
            console.error("Gemini AI Error:", error);
            throw error;
        }
    }

    throw new Error(`Unsupported AI Provider: ${provider}`);
}

