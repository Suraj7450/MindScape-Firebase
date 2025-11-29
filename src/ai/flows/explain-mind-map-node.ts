
'use server';

/**
 * @fileOverview Provides detailed explanations for mind map nodes.
 *
 * - explainMindMapNode - A function that generates a detailed explanation for a mind map node.
 * - ExplainMindMapNodeInput - The input type for the explainMindMapNode function.
 * - ExplainMindMapNodeOutput - The return type for the explainMindMapNode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainMindMapNodeInputSchema = z.object({
  mainTopic: z.string().describe('The main topic of the mind map.'),
  subCategoryName: z.string().describe('The name of the sub-category.'),
  subCategoryDescription: z
    .string()
    .describe('The brief description of the sub-category.'),
  explanationMode: z
    .enum(['Beginner', 'Intermediate', 'Expert'])
    .describe('The desired level of detail for the explanation.'),
});
export type ExplainMindMapNodeInput = z.infer<
  typeof ExplainMindMapNodeInputSchema
>;

const ExplainMindMapNodeOutputSchema = z.object({
  explanationPoints: z
    .array(z.string())
    .describe(
      'A list of small, focused bullet points explaining the sub-category.'
    ),
});
export type ExplainMindMapNodeOutput = z.infer<
  typeof ExplainMindMapNodeOutputSchema
>;

export async function explainMindMapNode(
  input: ExplainMindMapNodeInput
): Promise<ExplainMindMapNodeOutput> {
  return explainMindMapNodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainMindMapNodePrompt',
  input: {schema: ExplainMindMapNodeInputSchema},
  output: {schema: ExplainMindMapNodeOutputSchema},
  prompt: `You are an expert AI assistant providing detailed information for a mind map.

The main topic of the mind map is: {{{mainTopic}}}.

The user has clicked on the sub-category: "{{subCategoryName}}", which has a brief description: "{{subCategoryDescription}}".

The user has requested the explanation at the "{{{explanationMode}}}" level.
- If the mode is "Beginner", use very simple terms, short sentences, and analogies. Avoid jargon.
- If the mode is "Intermediate", assume the user has some basic knowledge. Be clear and comprehensive.
- If the mode is "Expert", provide a technical, in-depth explanation suitable for someone knowledgeable in the field.

Provide a detailed explanation of "{{subCategoryName}}" with a focus on its relationship to "{{mainTopic}}", tailored to the requested explanation mode.
Expand on the provided description and offer any additional context, required knowledge, or interesting facts.

Present the information as a list of small and focused bullet points.
`,
});

const explainMindMapNodeFlow = ai.defineFlow(
  {
    name: 'explainMindMapNodeFlow',
    inputSchema: ExplainMindMapNodeInputSchema,
    outputSchema: ExplainMindMapNodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
