
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

  const rawResult = await generateContent({
    provider,
    apiKey,
    systemPrompt,
    userPrompt
  });

  // Comprehensive Normalization
  let points: string[] = [];

  if (rawResult && Array.isArray(rawResult.explanationPoints)) {
    points = rawResult.explanationPoints;
  } else if (rawResult && typeof rawResult.explanation === 'string') {
    points = [rawResult.explanation];
  } else if (rawResult && typeof rawResult.message === 'string') {
    points = [rawResult.message];
  } else if (typeof rawResult === 'string') {
    // Attempt to split if it's a long string with bullet points
    points = rawResult.split('\n').filter(p => p.trim().length > 10).map(p => p.replace(/^[•\-\*\d\.]+\s*/, '').trim());
  }

  // Final fallback if still empty or too short
  if (points.length <= 1) {
    const fallbackPoints = [
      subCategoryDescription,
      `Understanding ${subCategoryName} is essential to grasping the broader context of ${mainTopic}.`,
      `Key aspects of ${subCategoryName} include its specific implementation details and practical applications in the field.`,
      `Further exploration reveals that ${subCategoryName} often interacts with related concepts to create a complete system.`,
      `For a ${explanationMode} learner, focusing on the core principles of ${subCategoryName} will provide the most value.`
    ];
    points = points.length === 1 ? [points[0], ...fallbackPoints.slice(1)] : fallbackPoints;
  }

  const normalized = {
    explanationPoints: points
  };

  try {
    const validated = ExplainMindMapNodeOutputSchema.parse(normalized);
    return validated;
  } catch (e: any) {
    console.error("Explanation validation failed:", e);
    return normalized as ExplainMindMapNodeOutput;
  }
}
