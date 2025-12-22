
'use server';

/**
 * @fileOverview Generates a comparison mind map between two topics.
 *
 * - generateComparisonMap - A function that generates the comparison mind map.
 * - GenerateComparisonMapInput - The input type for the generateComparisonMap function.
 * - GenerateComparisonMapOutput - The return type for the generateComparisonMap function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { MindMapSchema } from '@/ai/mind-map-schema';

const GenerateComparisonMapInputSchema = z.object({
  topic1: z.string().describe('The first topic for comparison.'),
  topic2: z.string().describe('The second topic for comparison.'),
  targetLang: z
    .string()
    .optional()
    .describe('The target language for the mind map content (e.g., "es").'),
  persona: z
    .string()
    .optional()
    .describe('The AI persona / style to use (e.g., "Teacher", "Concise", "Creative").'),
  apiKey: z.string().optional().describe('Optional custom API key to use for this request.'),
});
export type GenerateComparisonMapInput = z.infer<
  typeof GenerateComparisonMapInputSchema
>;

const GenerateComparisonMapOutputSchema = MindMapSchema;
export type GenerateComparisonMapOutput = z.infer<
  typeof GenerateComparisonMapOutputSchema
>;

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

export async function generateComparisonMap(
  input: GenerateComparisonMapInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<GenerateComparisonMapOutput> {
  const { provider, apiKey, strict } = input;
  if (provider === 'pollinations' || apiKey || provider === 'gemini') {
    const targetLangInstruction = input.targetLang
      ? `The entire mind map, including all topics, categories, and descriptions, MUST be in the following language: ${input.targetLang}.`
      : `The entire mind map MUST be in English.`;

    let personaInstruction = '';
    if (input.persona === 'Teacher') {
      personaInstruction = `
      ADOPT PERSONA: "Expert Teacher"
      - Use educational analogies to compare complex concepts.
      - Focus on learning points and "Knowledge Gaps" between the topics.
      - Structure the comparison like a lesson plan.
      - Descriptions should be encouraging and clear.`;
    } else if (input.persona === 'Concise') {
      personaInstruction = `
      ADOPT PERSONA: "Efficiency Expert"
      - Keep all comparison points extremely brief.
      - Use bullet points or fragments for similarities and differences.
      - Highlight only the most critical contrasting features.
      - Descriptions should be very short (max 15 words).`;
    } else if (input.persona === 'Creative') {
      personaInstruction = `
      ADOPT PERSONA: "Creative Visionary"
      - Explore unique, unexpected parallels and contrasts.
      - Use vivid, evocative language in the comparison.
      - Include a "Synthetic Conclusion" or "Future Evolution" for both topics.
      - Make the comparison feel inspired and non-obvious.`;
    } else {
      personaInstruction = `
      ADOPT PERSONA: "Standard Academic Assistant"
      - Provide a balanced and well-structured comparison.
      - Use clear, professional, yet accessible language.
      - Ensure comprehensive coverage of all major comparison points.
      - Keep descriptions highly focused and under 2 sentences.`;
    }

    const systemPrompt = `You are an expert in creating detailed and comprehensive comparative mind maps.
    
    ${personaInstruction}
    
    ${targetLangInstruction}
    
    The mind map must have the following structure:
      - Topic: A main topic like "${input.topic1} vs. ${input.topic2}".
      - ShortTitle: A condensed version like "${input.topic1} vs ${input.topic2}" (max 4 words).
      - Icon: A relevant lucide-react icon for comparison, such as "scale".
      - Sub-Topics: The map must include at least two sub-topics:
        1.  **"Similarities"**:
            - Categories should represent 4-5 shared concepts, features, or principles.
            - Sub-categories under each should provide specific examples or details of these similarities. Each sub-category's description MUST be concise and consist of exactly 1-2 sentences.
        2.  **"Differences"**:
            - This sub-topic should contain exactly two categories: one for "${input.topic1}" and one for "${input.topic2}".
            - The sub-categories under each of these two should be PARALLEL. For each point of comparison, you must create one sub-category under "${input.topic1}" and a corresponding sub-category under "${input.topic2}". 
            - For example, if comparing "Dogs" and "Cats", a point of comparison could be "Social Behavior". The sub-category under "Dogs" would be named "Social Behavior" and describe dogs, and the sub-category under "Cats" would also be named "Social Behavior" and describe cats.
            - Create 4-5 of these parallel comparison points.
            - Each description MUST be concise and clearly explain the distinction in exactly 1-2 sentences.
        3.  **"Contextual Links / Overlap"**:
            - Categories should represent 3-4 areas where the topics intersect, relate, or influence each other (e.g., "Historical Context", "Practical Applications", "Shared Technology").
            - Sub-categories should provide specific examples or explanations of these connections. The description for each MUST be concise and limited to 1-2 sentences.
    
      Ensure every sub-topic, category, and sub-category has a relevant lucide-react icon name in kebab-case.
      Every sub-category MUST have a 'tags' array containing 2-3 relevant keywords.
      The output must be a valid JSON object that strictly adheres to the provided output schema. Do not include any extra text or explanations outside the JSON structure.`;

    const userPrompt = `Generate a structured mind map comparing and contrasting "${input.topic1}" and "${input.topic2}".`;

    return generateContent({
      provider: provider,
      apiKey: apiKey,
      systemPrompt,
      userPrompt,
      strict
    });
  }
  return generateComparisonMapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateComparisonMapPrompt',
  input: { schema: GenerateComparisonMapInputSchema },
  output: { schema: GenerateComparisonMapOutputSchema },
  prompt: `You are an expert in creating detailed and comprehensive comparative mind maps.

  Your task is to generate a structured mind map comparing and contrasting "{{{topic1}}}" and "{{{topic2}}}".

  {{#if targetLang}}
  The entire mind map, including all topics, categories, and descriptions, MUST be in the following language: {{{targetLang}}}.
  {{else}}
  The entire mind map MUST be in English.
  {{/if}}

  The mind map must have the following structure:
  - Topic: A main topic like "{{{topic1}}} vs. {{{topic2}}}".
  - Icon: A relevant lucide-react icon for comparison, such as "git-compare-arrows" or "scale".
  - Sub-Topics: The map must include at least two sub-topics:
    1.  **"Similarities"**:
        - Categories should represent 4-5 shared concepts, features, or principles.
        - Sub-categories under each should provide specific examples or details of these similarities. Each sub-category's description MUST be concise and consist of exactly 1-2 sentences.
    2.  **"Differences"**:
        - This sub-topic should contain exactly two categories: one for "{{{topic1}}}" and one for "{{{topic2}}}".
        - The sub-categories under each of these two should be PARALLEL. For each point of comparison, you must create one sub-category under "{{{topic1}}}" and a corresponding sub-category under "{{{topic2}}}". 
        - For example, if comparing "Dogs" and "Cats", a point of comparison could be "Social Behavior". The sub-category under "Dogs" would be named "Social Behavior" and describe dogs, and the sub-category under "Cats" would also be named "Social Behavior" and describe cats.
        - Create 4-5 of these parallel comparison points.
        - Each description MUST be concise and clearly explain the distinction in exactly 1-2 sentences.
    3.  **"Contextual Links / Overlap"**:
        - Categories should represent 3-4 areas where the topics intersect, relate, or influence each other (e.g., "Historical Context", "Practical Applications", "Shared Technology").
        - Sub-categories should provide specific examples or explanations of these connections. The description for each MUST be concise and limited to 1-2 sentences.


  Ensure every sub-topic, category, and sub-category has a relevant lucide-react icon name in kebab-case.
  Every sub-category MUST have a 'tags' array containing 2-3 relevant keywords.
  The output must be a valid JSON object that strictly adheres to the provided output schema. Do not include any extra text or explanations outside the JSON structure.
  `,
});

const generateComparisonMapFlow = ai.defineFlow(
  {
    name: 'generateComparisonMapFlow',
    inputSchema: GenerateComparisonMapInputSchema,
    outputSchema: GenerateComparisonMapOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
