
'use server';

/**
 * @fileOverview Provides detailed explanations for mind map nodes.
 *
 * - explainMindMapNode - A function that generates a detailed explanation for a mind map node.
 * - ExplainMindMapNodeInput - The input type for the explainMindMapNode function.
 * - ExplainMindMapNodeOutput - The return type for the explainMindMapNode function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExplainMindMapNodeInputSchema = z.object({
  mainTopic: z.string().describe('The main topic of the mind map.'),
  subCategoryName: z.string().describe('The name of the sub-category.'),
  subCategoryDescription: z
    .string()
    .describe('The brief description of the sub-category.'),
  explanationMode: z
    .enum(['Beginner', 'Intermediate', 'Expert'])
    .describe('The desired level of detail for the explanation.'),
  apiKey: z.string().optional().describe('Optional custom API key to use for this request.'),
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

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

// Simplified to always use client-dispatcher
export async function explainMindMapNode(
  input: ExplainMindMapNodeInput & { apiKey?: string; provider?: AIProvider }
): Promise<ExplainMindMapNodeOutput> {
  const { provider, apiKey, mainTopic, subCategoryName, subCategoryDescription, explanationMode } = input;

  const systemPrompt = `You are an expert AI assistant providing detailed information for a mind map.

    The main topic of the mind map is: ${mainTopic}.
    
    The user has clicked on the sub-category: "${subCategoryName}", which has a brief description: "${subCategoryDescription}".
    
    The user has requested the explanation at the "${explanationMode}" level.
    - If the mode is "Beginner", use very simple terms, short sentences, and analogies. Avoid jargon.
    - If the mode is "Intermediate", assume the user has some basic knowledge. Be clear and comprehensive.
    - If the mode is "Expert", provide a technical, in-depth explanation suitable for someone knowledgeable in the field.
    
    Provide a detailed explanation of "${subCategoryName}" with a focus on its relationship to "${mainTopic}", tailored to the requested explanation mode.
    Expand on the provided description and offer any additional context, required knowledge, or interesting facts.
    
    The output MUST be a valid JSON object with the following structure:
    {
      "explanationPoints": ["Point 1", "Point 2", "Point 3"]
    }
    
    IMPORTANT: Return ONLY the raw JSON object, no other text or explanation.`;

  const userPrompt = "Generate the explanation.";

  const rawResult = await generateContent({
    provider,
    apiKey,
    systemPrompt,
    userPrompt
  });

  try {
    const validated = ExplainMindMapNodeOutputSchema.parse(rawResult);
    return validated;
  } catch (e: any) {
    if (rawResult && rawResult.explanationPoints) return rawResult as ExplainMindMapNodeOutput;
    throw new Error(`Explanation generation failed validation: ${e.message}`);
  }
}
