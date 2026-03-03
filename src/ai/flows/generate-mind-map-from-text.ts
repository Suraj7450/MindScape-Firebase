
'use server';

/**
 * @fileOverview Generates a mind map from a block of text.
 *
 * - generateMindMapFromText - A function that generates the mind map from text.
 */

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
  const { provider, apiKey, context, targetLang, text, persona, strict, depth = 'low' } = input;

  // Map depth to structural density
  let densityInstruction = '';
  if (depth === 'medium') {
    densityInstruction = 'STRUCTURE DENSITY: Generate AT LEAST 6 subTopics. Each subTopic MUST have AT LEAST 4 categories. Each category MUST have AT LEAST 6 subCategories.';
  } else if (depth === 'deep') {
    densityInstruction = 'STRUCTURE DENSITY: Generate AT LEAST 8 subTopics. Each subTopic MUST have AT LEAST 6 categories. Each category MUST have AT LEAST 9 subCategories.';
  } else {
    densityInstruction = 'STRUCTURE DENSITY: Generate AT LEAST 4 subTopics. Each subTopic MUST have AT LEAST 2 categories. Each category MUST have AT LEAST 3 subCategories.';
  }

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
    - Keep descriptions highly focused and exactly one sentence.`;
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
    
    **CRITICAL ENTITY EXTRACTION RULE**: 
    If the text appears to be from a highly structured document (like an ID card, Aadhar card, passport, invoice, receipt, or resume), your PRIMARY GOAL is exact data extraction. 
    1. DO NOT create generic, conceptual categories like "Personal Information" -> "Name" -> "The name of the document holder".
    2. YOU MUST USE THE ACTUAL DATA. Instead of generic labels, your nodes should be the actual data itself: "Personal Profile" -> "Name: Megha" -> "DOB: 01/01/1990".
    3. Never output a field name (like "Address") without its corresponding value if it exists in the text.
    4. Fill the structure with the **actual, literal data, numbers, dates, and entity names** found in the text. Do not just summarize the themes.

    **FOR ALL OTHER TEXTS (Reports, Stories, General PDFs)**:
    - Prioritize information density. 
    - You MUST generate a comprehensive mind map that covers the ENTIRE provided text.
    - DO NOT return an empty or near-empty mind map.
    - If the text is short, expand on the concepts logically while remaining faithful to the source.
    - **MANDATORY**: The \`subTopics\` array MUST NOT BE EMPTY. Aim for a rich, multi-level hierarchy.

    ${densityInstruction}
  
    ${contextInstruction}
  
    ${targetLangInstruction}
  
    The mind map must have the following structure:
    - Topic: The main topic identified from the text. If the user provided context, use it to refine the topic.
    - ShortTitle: A condensed, catchy, and smart version (max 2-4 words) for focused display.
    - Icon: A relevant icon name from the lucide-react library, in kebab-case (e.g., "file-text").
    - Sub-Topics: A list of at least 4-5 main sub-topics.
      - Icon: A relevant lucide-react icon for each sub-topic.
    - Categories: For each sub-topic, a list of 3-4 categories.
      - Icon: A relevant lucide-react icon for each category.
    - Sub-Categories: For each category, a list of at least 4-5 detailed sub-categories.
      - Description: A concise statement (exactly one sentence) of each sub-category, using data from the text.
      - Icon: A relevant lucide-react icon for each sub-category.
      - Tags: A list of 2-3 relevant keywords or tags for the sub-category.
  
    The output must be a valid JSON object that strictly adheres to the provided output schema. Do not include any extra text or explanations outside the JSON structure.`;

  const userPrompt = `Text to analyze:\n---\n${text}\n---`;


  const maxAttempts = 1;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await generateContent({
        provider,
        apiKey,
        systemPrompt,
        userPrompt,
        schema: GenerateMindMapFromTextOutputSchema,
        strict
      });

      return result;
    } catch (e: any) {
      lastError = e;
      console.error(`❌ Text-to-map generation attempt ${attempt} failed:`, e.message);
      if (attempt === maxAttempts) throw e;
      await new Promise(res => setTimeout(res, 1000));
    }
  }

  throw lastError || new Error('Text-to-map generation failed');
}
