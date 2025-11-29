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

export async function summarizeMindMap(
  input: SummarizeMindMapInput
): Promise<SummarizeMindMapOutput> {
  return summarizeMindMapFlow(input);
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
