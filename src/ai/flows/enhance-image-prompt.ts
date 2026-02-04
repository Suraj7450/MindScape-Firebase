
'use server';

/**
 * @fileOverview Enhances a simple user prompt for better image generation results.
 *
 * - enhanceImagePrompt - A function that takes a basic prompt and returns a detailed, artistic one.
 * - EnhanceImagePromptInput - The input type for the function.
 * - EnhanceImagePromptOutput - The return type for the function.
 */

import { z } from 'zod';

const EnhanceImagePromptInputSchema = z.object({
    prompt: z.string().describe('The user-provided prompt to be enhanced.'),
    style: z.string().optional().describe('An optional artistic style to apply.'),
});
export type EnhanceImagePromptInput = z.infer<
    typeof EnhanceImagePromptInputSchema
>;

const EnhanceImagePromptOutputSchema = z.object({
    enhancedPrompt: z
        .string()
        .describe('The detailed, artistic prompt for the image generation model.'),
});
export type EnhanceImagePromptOutput = z.infer<
    typeof EnhanceImagePromptOutputSchema
>;

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

export async function enhanceImagePrompt(
    input: EnhanceImagePromptInput & { apiKey?: string; provider?: AIProvider; strict?: boolean; model?: string }
): Promise<EnhanceImagePromptOutput> {
    // Image generation disabled - return original prompt
    console.log('ℹ️ Image prompt enhancement disabled, returning original prompt');
    return { enhancedPrompt: input.prompt };
}
