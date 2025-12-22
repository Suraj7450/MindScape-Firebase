
'use server';

/**
 * @fileOverview Generates a mind map from a block of text.
 *
 * - generateMindMapFromText - A function that generates the mind map from text.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateMindMapFromTextInput,
  GenerateMindMapFromTextInputSchema,
  GenerateMindMapFromTextOutput,
  GenerateMindMapFromTextOutputSchema,
} from '@/ai/schemas/generate-mind-map-from-text-schema';

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

// Simplified to always use client-dispatcher
export async function generateMindMapFromText(
  input: GenerateMindMapFromTextInput & { apiKey?: string; provider?: AIProvider }
): Promise<GenerateMindMapFromTextOutput> {
  const { provider, apiKey, context, targetLang, text } = input;

  const contextInstruction = context
    ? `The user has provided the following additional context or instructions, which you should prioritize: "${context}"`
    : '';

  const targetLangInstruction = targetLang
    ? `The entire mind map, including all topics, categories, and descriptions, MUST be in the following language: ${targetLang}.`
    : `The entire mind map MUST be in English.`;

  const systemPrompt = `You are an expert in analyzing text and creating structured, comprehensive mind maps from it.
  
    Analyze the provided text and generate a detailed, multi-layered mind map based on its content. 
    
    **CRITICAL INSTRUCTION**: You must extract the **specific information, names, values, and key entities** from the text. Use this **actual, literal data** to populate the mind map's topic, sub-topics, categories, and sub-categories. Do not just summarize the themes; fill the structure with the actual data found in the text.
  
    ${contextInstruction}
  
    ${targetLangInstruction}
  
    The mind map must have the following structure:
    - Topic: The main topic identified from the text. If the user provided context, use it to refine the topic.
    - Icon: A relevant icon name from the lucide-react library, in kebab-case (e.g., "file-text").
    - Sub-Topics: A list of at least 4-5 main sub-topics.
      - Icon: A relevant lucide-react icon for each sub-topic.
    - Categories: For each sub-topic, a list of 3-4 categories.
      - Icon: A relevant lucide-react icon for each category.
    - Sub-Categories: For each category, a list of at least 4-5 detailed sub-categories.
      - Description: A brief but thorough description of each sub-category, using data from the text.
      - Icon: A relevant lucide-react icon for each sub-category.
      - Tags: A list of 2-3 relevant keywords or tags for the sub-category.
  
    The output must be a valid JSON object that strictly adheres to the provided output schema. Do not include any extra text or explanations outside the JSON structure.`;

  const userPrompt = `Text to analyze:\n---\n${text}\n---`;

  const rawResult = await generateContent({
    provider,
    apiKey,
    systemPrompt,
    userPrompt
  });

  try {
    const validated = GenerateMindMapFromTextOutputSchema.parse(rawResult);
    return validated;
  } catch (e: any) {
    console.error("Schema validation failed:", e);
    if (rawResult && rawResult.topic) return rawResult as GenerateMindMapFromTextOutput;
    throw new Error(`Generated mind map from text was invalid: ${e.message}`);
  }
}
