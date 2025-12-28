
'use server';

/**
 * @fileOverview Provides detailed explanations for mind map nodes.
 *
 * - explainMindMapNode - A function that generates a detailed explanation for a mind map node.
 * - ExplainMindMapNodeInput - The input type for the explainMindMapNode function.
 * - ExplainMindMapNodeOutput - The return type for the explainMindMapNode function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

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
  input: ExplainMindMapNodeInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<ExplainMindMapNodeOutput> {
  const { provider, apiKey, mainTopic, subCategoryName, subCategoryDescription, explanationMode, strict } = input;

  const systemPrompt = `You are an expert AI assistant providing detailed, multi-faceted explanations for mind map concepts.
    
    The main topic of the mind map is: "${mainTopic}".
    The specific concept to explain is: "${subCategoryName}".
    Current brief description: "${subCategoryDescription}".
    
    The user has requested a "${explanationMode}" level explanation.
    - Beginner: Simple terms, daily analogies, no jargon.
    - Intermediate: Conceptual depth, professional tone, practical context.
    - Expert: Technical details, nuance, advanced terminology.
    
    Your task is to generate 5-7 distinct, high-quality explanation points for "${subCategoryName}". 
    Each point should:
    1. Focus on a specific aspect (e.g., definition, use case, historical context, key feature, or relationship to "${mainTopic}").
    2. Be informative and provide knowledge beyond the current brief description.
    3. Be formatted as a single, clear sentence or short paragraph.
    
    The output MUST be a valid JSON object with the following structure:
    {
      "explanationPoints": [
        "First detailed point about the concept...",
        "Second detailed point focusing on a different aspect...",
        "Third point providing context or an example...",
        "Fourth point explaining a technical detail...",
        "Fifth point linking it back to the main topic..."
      ]
    }
    
    IMPORTANT: Provide MINIMUM 5 points. Return ONLY the raw JSON object. No extra text.`;

  const userPrompt = "Generate the explanation JSON with 5-7 detailed points.";

  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await generateContent({
        provider,
        apiKey,
        systemPrompt,
        userPrompt,
        schema: ExplainMindMapNodeOutputSchema,
        strict
      });

      return result;
    } catch (e: any) {
      lastError = e;
      console.error(`❌ Explanation attempt ${attempt} failed:`, e.message);
      if (attempt === maxAttempts) throw e;
      await new Promise(res => setTimeout(res, 1000));
    }
  }

  throw lastError || new Error('Explanation generation failed');
}
