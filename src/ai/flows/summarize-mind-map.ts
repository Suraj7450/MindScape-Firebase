'use server';

/**
 * @fileOverview Summarizes a mind map into a short description.
 *
 * - summarizeMindMap - A function that generates a short summary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { MindMapSchema } from '../mind-map-schema';

const SummarizeMindMapInputSchema = z.object({
  mindMapData: MindMapSchema.describe('The JSON object of the mind map.'),
});
export type SummarizeMindMapInput = z.infer<typeof SummarizeMindMapInputSchema>;

const SummarizeMindMapOutputSchema = z.object({
  summary: z
    .string()
    .describe('A short, 1-2 sentence summary of the mind map.'),
});
export type SummarizeMindMapOutput = z.infer<typeof SummarizeMindMapOutputSchema>;

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

export async function summarizeMindMap(
  input: SummarizeMindMapInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<SummarizeMindMapOutput> {
  const { provider, apiKey, mindMapData, strict } = input;
  const mindMapDataString = JSON.stringify(mindMapData, null, 2);

  const systemPrompt = `You are an expert in synthesizing information.
    Based on the provided mind map data, generate a concise and compelling 1-2 sentence summary.
    The summary should capture the main topic and key sub-topics to give a potential viewer a clear idea of what the map contains.
  
    The output MUST be a valid JSON object with the following structure:
    {
      "summary": "Your summary text here"
    }

    IMPORTANT: Return ONLY the raw JSON object, no other text or explanation.
  
    Mind Map Data:
    ${mindMapDataString}`;

  const userPrompt = "Summarize the mind map.";

  const rawResult = await generateContent({
    provider,
    apiKey,
    systemPrompt,
    userPrompt
  });

  try {
    const validated = SummarizeMindMapOutputSchema.parse(rawResult);
    return validated;
  } catch (e: any) {
    if (rawResult && typeof rawResult.summary === 'string') return rawResult as SummarizeMindMapOutput;
    throw new Error(`Summary generation failed validation: ${e.message}`);
  }
}

const prompt = ai.definePrompt({
  name: 'summarizeMindMapPrompt',
  input: { schema: z.object({ mindMapDataString: z.string() }) },
  output: { schema: SummarizeMindMapOutputSchema },
  prompt: `You are an expert in synthesizing information.
  Based on the provided mind map data, generate a concise and compelling 1-2 sentence summary.
  The summary should capture the main topic and key sub-topics to give a potential viewer a clear idea of what the map contains.

  Mind Map Data:
  {{{mindMapDataString}}}

  Return only the summary.
  `,
});

const summarizeMindMapFlow = ai.defineFlow(
  {
    name: 'summarizeMindMapFlow',
    inputSchema: SummarizeMindMapInputSchema,
    outputSchema: SummarizeMindMapOutputSchema,
  },
  async ({ mindMapData }) => {
    const { output } = await prompt({
      mindMapDataString: JSON.stringify(mindMapData, null, 2),
    });
    return output!;
  }
);
