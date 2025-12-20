
'use server';

/**
 * @fileOverview Translates a mind map to a target language.
 *
 * - translateMindMap - A function that handles the translation.
 * - TranslateMindMapInput - The input type for the translateMindMap function.
 * - TranslateMindMapOutput - The return type for the translateMindMap function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { MindMapSchema } from '@/ai/mind-map-schema';

const TranslateMindMapInputSchema = z.object({
  mindMapData: MindMapSchema.describe(
    'The mind map object to be translated.'
  ),
  targetLang: z.string().describe('The target language code (e.g., "es").'),
});
export type TranslateMindMapInput = z.infer<typeof TranslateMindMapInputSchema>;

const TranslateMindMapOutputSchema = MindMapSchema;

export type TranslateMindMapOutput = z.infer<
  typeof TranslateMindMapOutputSchema
>;

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

export async function translateMindMap(
  input: TranslateMindMapInput & { apiKey?: string; provider?: AIProvider }
): Promise<TranslateMindMapOutput> {
  if (input.provider === 'pollinations' || input.apiKey) {
    const mindMapDataString = JSON.stringify(input.mindMapData, null, 2);
    const systemPrompt = `You are an expert translator. Translate the provided mind map JSON data into the target language: ${input.targetLang}.
  
    - Translate all user-facing strings: 'topic', 'name', and 'description'.
    - Do NOT translate the 'icon' fields. Keep them as they are.
    - Ensure the output is a valid JSON object with the same structure as the input.
  
    Original Mind Map Data:
    ${mindMapDataString}
  
    Translate this into ${input.targetLang} and return only the translated JSON object.`;

    const userPrompt = "Generate the translated JSON.";

    return generateContent({
      provider: input.provider,
      apiKey: input.apiKey,
      systemPrompt,
      userPrompt
    });
  }
  return translateMindMapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateMindMapPrompt',
  input: {
    schema: z.object({
      mindMapDataString: z.string(),
      targetLang: z.string(),
    }),
  },
  output: { schema: TranslateMindMapOutputSchema },
  prompt: `You are an expert translator. Translate the provided mind map JSON data into the target language: {{{targetLang}}}.

  - Translate all user-facing strings: 'topic', 'name', and 'description'.
  - Do NOT translate the 'icon' fields. Keep them as they are.
  - Ensure the output is a valid JSON object with the same structure as the input.

  Original Mind Map Data:
  {{{mindMapDataString}}}

  Translate this into {{{targetLang}}} and return only the translated JSON object.
  `,
});

const translateMindMapFlow = ai.defineFlow(
  {
    name: 'translateMindMapFlow',
    inputSchema: TranslateMindMapInputSchema,
    outputSchema: TranslateMindMapOutputSchema,
  },
  async ({ mindMapData, targetLang }) => {
    const { output } = await prompt({
      mindMapDataString: JSON.stringify(mindMapData, null, 2),
      targetLang,
    });
    return output!;
  }
);
