
'use server';
/**
 * @fileOverview A flow to expand an existing mind map with more AI-generated detail.
 *
 * - expandMindMap - A function that takes a mind map and returns an expanded version.
 */
import { MindMapSchema } from '@/ai/mind-map-schema';
import { z } from 'zod';

const ExpandMindMapInputSchema = z.object({
  mindMap: MindMapSchema.describe('The existing mind map data to be expanded.'),
});
export type ExpandMindMapInput = z.infer<typeof ExpandMindMapInputSchema>;

const ExpandMindMapOutputSchema = MindMapSchema;
export type ExpandMindMapOutput = z.infer<typeof ExpandMindMapOutputSchema>;

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

export async function expandMindMap(
  input: ExpandMindMapInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<ExpandMindMapOutput> {
  const { provider, apiKey, mindMap, strict } = input;

  const mindMapString = JSON.stringify(mindMap, null, 2);
  const systemPrompt = `You are an expert educator and content synthesizer. Your task is to expand an existing mind map by adding 5-10 deeper, more insightful branches.
  
  Return a SINGLE valid JSON object adhering to the MindMapSchema. Do not remove existing content; add new sub-topics, categories, or sub-categories.`;

  const userPrompt = `Existing Mind Map Data:\n${mindMapString}`;

  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await generateContent({
        provider,
        apiKey,
        systemPrompt,
        userPrompt,
        schema: ExpandMindMapOutputSchema,
        strict
      });

      return result;
    } catch (e: any) {
      lastError = e;
      console.error(`❌ Mind map expansion attempt ${attempt} failed:`, e.message);
      if (attempt === maxAttempts) throw e;
      await new Promise(res => setTimeout(res, 1000));
    }
  }

  throw lastError || new Error('Mind map expansion failed');
}
