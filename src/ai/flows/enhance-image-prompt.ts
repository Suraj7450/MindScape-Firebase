
'use server';

/**
 * @fileOverview Enhances a simple user prompt for better image generation results.
 *
 * - enhanceImagePrompt - A function that takes a basic prompt and returns a detailed, artistic one.
 * - EnhanceImagePromptInput - The input type for the function.
 * - EnhanceImagePromptOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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

import { generateContentWithCustomKey } from '@/ai/custom-client';

export async function enhanceImagePrompt(
  input: EnhanceImagePromptInput & { apiKey?: string }
): Promise<EnhanceImagePromptOutput> {
  if (input.apiKey) {
    const styleInstruction = input.style
      ? `**Requested Style:**
      "${input.style}"
      
      **Incorporate the Style:** The requested style is "${input.style}". It MUST be the primary focus. If abstract, blend with realistic elements.`
      : `**Incorporate the Style:** No specific style requested. Default to a photorealistic or cinematic style.`;

    const systemPrompt = `You are an expert prompt engineer for a text-to-image AI model, specializing in creating photorealistic images. Your task is to take a user's simple prompt and enhance it into a rich, detailed, and artistic prompt that will generate a high-quality, visually appealing, and realistic image.
    
    **Your Enhancement Rules:**
    1.  **Prioritize Photorealism:** The primary goal is a realistic, real-life image. Use keywords that emphasize this, such as "photorealistic," "sharp focus," "8k," "cinematic lighting," "shot on DSLR," "high detail."
    2.  **Add Rich Detail:** Include specific details about the subject, setting, lighting, and mood. Be descriptive.
    3.  **Avoid Abstract Terms:** Avoid vague, abstract, or cartoonish terms unless the style explicitly calls for them.
    4.  **Keep it Concise:** The final prompt should be a comma-separated list of powerful keywords and descriptive phrases. Do not add any extra explanations.
    
    ${styleInstruction}`;

    const userPrompt = `Enhance this prompt: "${input.prompt}"`;

    return generateContentWithCustomKey(input.apiKey, systemPrompt, userPrompt);
  }
  return enhanceImagePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceImagePrompt',
  input: { schema: EnhanceImagePromptInputSchema },
  output: { schema: EnhanceImagePromptOutputSchema },
  prompt: `You are an expert prompt engineer for a text-to-image AI model, specializing in creating photorealistic images. Your task is to take a user's simple prompt and enhance it into a rich, detailed, and artistic prompt that will generate a high-quality, visually appealing, and realistic image.

  **User's Prompt:**
  "{{{prompt}}}"

  {{#if style}}
  **Requested Style:**
  "{{{style}}}"
  {{/if}}

  **Your Enhancement Rules:**
  1.  **Prioritize Photorealism:** The primary goal is a realistic, real-life image. Use keywords that emphasize this, such as "photorealistic," "sharp focus," "8k," "cinematic lighting," "shot on DSLR," "high detail."
  2.  **Add Rich Detail:** Include specific details about the subject, setting, lighting, and mood. Be descriptive.
  3.  **Incorporate the Style:** If a style is provided (e.g., "Cinematic"), it MUST be the primary focus. If the style is more abstract (e.g., "Oil Painting"), blend it with realistic elements. If no style is provided, default to a photorealistic or cinematic style.
  4.  **Avoid Abstract Terms:** Avoid vague, abstract, or cartoonish terms unless the style explicitly calls for them.
  5.  **Keep it Concise:** The final prompt should be a comma-separated list of powerful keywords and descriptive phrases. Do not add any extra explanations.
  `,
});

const enhanceImagePromptFlow = ai.defineFlow(
  {
    name: 'enhanceImagePromptFlow',
    inputSchema: EnhanceImagePromptInputSchema,
    outputSchema: EnhanceImagePromptOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
