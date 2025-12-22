
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
  input: GenerateMindMapFromTextInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<GenerateMindMapFromTextOutput> {
  const { provider, apiKey, context, targetLang, text, persona, strict } = input;

  let personaInstruction = '';
  if (persona === 'Teacher') {
    personaInstruction = `
    ADOPT PERSONA: "Expert Teacher"
    - Use educational analogies to explain complex concepts found in the text.
    - Focus on "How" and "Why" in descriptions.
    - Structure sub-topics like a curriculum or learning path.
    - Descriptions should be encouraging and clear.`;
  } else if (persona === 'Concise') {
    personaInstruction = `
    ADOPT PERSONA: "Efficiency Expert"
    - Keep all text extracted from the source extremely brief.
    - Use fragments or high-impact keywords instead of long sentences.
    - Focus only on the most critical information from the text.
    - Descriptions should be very short (max 15 words).`;
  } else if (persona === 'Creative') {
    personaInstruction = `
    ADOPT PERSONA: "Creative Visionary"
    - Explore unique connections and innovative angles within the text.
    - Use vivid, evocative language in descriptions.
    - Highlight theoretical or "Innovation" aspects found in the content.
    - Make the content feel inspired and non-obvious.`;
  } else {
    personaInstruction = `
    ADOPT PERSONA: "Standard Academic Assistant"
    - Provide a balanced and well-structured overview of the provided text.
    - Use clear, professional, yet accessible language.
    - Ensure comprehensive coverage of all key points in the text.
    - Keep descriptions highly focused and under 2 sentences.`;
  }

  const contextInstruction = context
    ? `The user has provided the following additional context or instructions, which you should prioritize: "${context}"`
    : '';

  const targetLangInstruction = targetLang
    ? `The entire mind map, including all topics, categories, and descriptions, MUST be in the following language: ${targetLang}.`
    : `The entire mind map MUST be in English.`;

  const systemPrompt = `You are an expert in analyzing text and creating structured, comprehensive mind maps from it.
  
    ${personaInstruction}
  
    Analyze the provided text and generate a detailed, multi-layered mind map based on its content. 
    
    **CRITICAL INSTRUCTION**: You must extract the **specific information, names, values, and key entities** from the text. Use this **actual, literal data** to populate the mind map's topic, sub-topics, categories, and sub-categories. Do not just summarize the themes; fill the structure with the actual data found in the text.
  
    ${contextInstruction}
  
    ${targetLangInstruction}
  
    The mind map must have the following structure:
    - Topic: The main topic identified from the text. If the user provided context, use it to refine the topic.
    - ShortTitle: A condensed version of the topic (max 3-4 words) for focused display.
    - Icon: A relevant icon name from the lucide-react library, in kebab-case (e.g., "file-text").
    - Sub-Topics: A list of at least 4-5 main sub-topics.
      - Icon: A relevant lucide-react icon for each sub-topic.
    - Categories: For each sub-topic, a list of 3-4 categories.
      - Icon: A relevant lucide-react icon for each category.
    - Sub-Categories: For each category, a list of at least 4-5 detailed sub-categories.
      - Description: A concise description (max 1-2 sentences) of each sub-category, using data from the text.
      - Icon: A relevant lucide-react icon for each sub-category.
      - Tags: A list of 2-3 relevant keywords or tags for the sub-category.
  
    The output must be a valid JSON object that strictly adheres to the provided output schema. Do not include any extra text or explanations outside the JSON structure.`;

  const userPrompt = `Text to analyze:\n---\n${text}\n---`;

  const rawResult = await generateContent({
    provider,
    apiKey,
    systemPrompt,
    userPrompt,
    strict
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
