
'use server';
/**
 * @fileOverview A flow to expand an existing mind map with more AI-generated detail.
 *
 * - expandMindMap - A function that takes a mind map and returns an expanded version.
 */
import { ai } from '@/ai/genkit';
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

  if (provider === 'pollinations' || apiKey || provider === 'gemini') {
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

  return expandMindMapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'expandMindMapPrompt',
  input: { schema: z.object({ mindMapString: z.string() }) },
  output: { schema: ExpandMindMapOutputSchema },
  prompt: `You are an expert educator and content synthesizer. Your task is to expand an existing mind map by adding 5-10 deeper, more insightful branches.

  Analyze the provided mind map structure and content. Identify areas that could be explored in more detail. Add new sub-topics, categories, or sub-categories that provide additional facts, insights, comparisons, or related concepts.

  **RULES:**
  1.  **Preserve Structure:** Do not remove or fundamentally alter the existing topics and categories. Your goal is to ADD to the map, not replace it.
  2.  **Add Depth:** The new nodes should represent a deeper dive into the existing content. Avoid adding superficial or redundant information.
  3.  **Maintain Schema:** The final output MUST be a valid JSON object that strictly adheres to the MindMapSchema, including 'name', 'description', 'icon', and 'tags' for all sub-categories.
  4.  **Be Creative:** Add interesting connections, historical context, practical applications, or counter-arguments where appropriate.
  5.  **Icon and Tags:** Ensure all new sub-categories have a relevant lucide-react icon and 2-3 relevant tags.

  **Existing Mind Map Data:**
  \`\`\`json
  {{{mindMapString}}}
  \`\`\`

  Now, return the expanded mind map as a single, valid JSON object.
  `,
});

const expandMindMapFlow = ai.defineFlow(
  {
    name: 'expandMindMapFlow',
    inputSchema: ExpandMindMapInputSchema,
    outputSchema: ExpandMindMapOutputSchema,
  },
  async ({ mindMap }) => {
    const { output } = await prompt({
      mindMapString: JSON.stringify(mindMap, null, 2),
    });
    return output!;
  }
);
