
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
  const { provider = 'gemini', apiKey, strict } = input;
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
    1.  **Authentic Brand Identity:** If the subject is a known company or brand (e.g., Ferrari, Apple, Coca-Cola), you MUST include keywords for their official logo, trademark colors, and real-world branding. For example, if the prompt is "Ferrari", mention "official Ferrari logo", "Rosso Corsa red", and "sleek Italian automotive design".
    2.  **Be Literal & Realistic:** Identify the **PHYSICAL OBJECTS** and **REAL-WORLD SETTINGS**. Ground every scene in physical reality. No abstract shapes, no floating 3D blocks, and no "digital mind map" art unless specifically requested.
    3.  **Hyper-Realism:** Use high-end photography terms: "8k resolution", "shot on 35mm lens", "f/1.8", "cinematic volumetric lighting", "industrial design", "award-winning photography", "unreal engine 5 render style" (for products).
    4.  **No Abstract Fluff:** Remove vague words like "concept", "idea", "theory", or "universe". Replace them with physical representations in a real environment.
    5.  **Balanced Comparisons:** If the prompt involves a comparison (e.g., "X vs Y" or "Comparing X and Y"), you MUST ensure the output describes a balanced visual composition that includes both subjects equally, such as a side-by-side, split-screen, or integrated dual-subject scene.
    
    **Output Format:**
    You MUST return a valid JSON object with the following structure:
    {
      "enhancedPrompt": "A concise comma-separated list of 15-20 powerful visual keywords."
    }
    
    IMPORTANT: Be extremely concise. Do NOT generate long lists of every possible activity. Focus on ONE cohesive visual scene.
    
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
  5.  **Balanced Comparisons:** If the prompt involves a comparison (e.g., "X vs Y" or "Comparing X and Y"), you MUST ensure the output describes a balanced visual composition that includes both subjects equally, such as a side-by-side, split-screen, or integrated dual-subject scene.
  6.  **Keep it Concise:** The final prompt should be a comma-separated list of powerful keywords and descriptive phrases. Do not add any extra explanations.
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
