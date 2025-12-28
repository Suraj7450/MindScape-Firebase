
'use server';

/**
 * @fileOverview Enhances a simple user prompt for better image generation results.
 *
 * - enhanceImagePrompt - A function that takes a basic prompt and returns a detailed, artistic one.
 * - EnhanceImagePromptInput - The input type for the function.
 * - EnhanceImagePromptOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
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
  input: EnhanceImagePromptInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<EnhanceImagePromptOutput> {
  const { provider, apiKey, strict } = input;
  if (provider === 'pollinations' || apiKey || provider === 'gemini') {
    const styleInstruction = input.style
      ? `**Requested Style:**
      "${input.style}"
      
      **Incorporate the Style:** The requested style is "${input.style}". It MUST be the primary focus. If abstract, blend with realistic elements.`
      : `**Incorporate the Style:** No specific style requested. Default to a photorealistic or cinematic style.`;

    const systemPrompt = `You are an expert prompt engineer for a high-end text-to-image AI. Your specialty is translating abstract concepts into **literal, concrete, and hyper-realistic visual scenes**.
    
    **Your Core Objective:**
    Identify the **PHYSICAL OBJECTS** and **REAL-WORLD SETTINGS** implied by the user's prompt. If the prompt is "Home Theater Pairing", do NOT generate abstract art or rocks. Instead, generate a high-end home theater with speakers, a projector, and sleek furniture.
    
    **Rules for Enhancement:**
    1.  **Be Literal:** Always ground the prompt in physical reality. Identify concrete items (e.g., electronic devices, specific plants, architectural elements).
    2.  **Context Aware:** If the input says "X in the context of Y", create a scene where X is the **primary subject** and Y is the **physical environment or atmospheric theme**.
    3.  **Hyper-Realism:** Use high-end photography terms: "8k resolution", "shot on 35mm lens", "f/1.8", "cinematic volumetric lighting", "industrial design", "award-winning photography".
    4.  **No Abstract Fluff:** Remove vague words like "concept", "idea", or "theory". Replace them with physical representations.
    
    **Output Format:**
    You MUST return a valid JSON object with the following structure:
    {
      "enhancedPrompt": "A comma-separated list of powerful, high-resolution visual keywords and descriptive phrases."
    }
    
    IMPORTANT: Return ONLY the raw JSON object. No markdown, no code blocks, no explanations.
    
    ${styleInstruction}`;

    const userPrompt = `Enhance this prompt: "${input.prompt}"`;

    const maxAttempts = 2;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await generateContent({
          provider: provider,
          apiKey: apiKey,
          systemPrompt,
          userPrompt,
          schema: EnhanceImagePromptOutputSchema,
          strict
        });

        return result;
      } catch (e: any) {
        lastError = e;
        console.error(`❌ Image prompt enhancement attempt ${attempt} failed:`, e.message);
        if (attempt === maxAttempts) throw e;
        await new Promise(res => setTimeout(res, 1000));
      }
    }

    throw lastError || new Error('Image prompt enhancement failed');
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
