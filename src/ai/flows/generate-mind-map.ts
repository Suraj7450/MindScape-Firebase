
'use server';

/**
 * @fileOverview Generates a multi-layered mind map from a given topic.
 *
 * - generateMindMap - A function that generates the mind map.
 * - GenerateMindMapInput - The input type for the generateMindMap function.
 * - GenerateMindMapOutput - The return type for the generateMindMap function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { MindMapSchema } from '@/ai/mind-map-schema';

const GenerateMindMapInputSchema = z.object({
  topic: z.string().describe('The main topic for the mind map.'),
  parentTopic: z
    .string()
    .optional()
    .describe(
      'The parent topic, if this mind map is being generated from an existing one.'
    ),
  targetLang: z
    .string()
    .optional()
    .describe('The target language for the mind map content (e.g., "es").'),
});
export type GenerateMindMapInput = z.infer<typeof GenerateMindMapInputSchema>;

const GenerateMindMapOutputSchema = MindMapSchema;

export type GenerateMindMapOutput = z.infer<typeof GenerateMindMapOutputSchema>;

const MIND_MAP_PROMPT = `You are an expert in creating mind maps for students.

  Given a main topic, you will generate a comprehensive, multi-layered mind map.
  {{#if parentTopic}}
  The mind map for "{{{topic}}}" should be created in the context of the parent topic: "{{{parentTopic}}}". This is for an in-depth exploration, so the content must be relevant and interconnected with the parent.
  {{/if}}

  {{#if targetLang}}
  The entire mind map, including all topics, categories, and descriptions, MUST be in the following language: {{{targetLang}}}.
  {{else}}
  The entire mind map MUST be in English.
  {{/if}}

  The mind map must have the following structure and constraints:
  - Topic: The main topic for this specific map.
  - Icon: A relevant icon name from the lucide-react library, in kebab-case (e.g., "brain-circuit").
  - Sub-Topics: A list of at least 4-5 main sub-topics.
    - Icon: A relevant lucide-react icon for each sub-topic.
  - Categories: For each sub-topic, a list of 3-4 categories.
    - Icon: A relevant lucide-react icon for each category.
  - Sub-Categories: For each category, a list of at least 4-5 detailed sub-categories.
    - Description: A brief but thorough description of each sub-category.
    - Icon: A relevant lucide-react icon for each sub-category.
    - Tags: A list of 2-3 relevant keywords or tags for the sub-category.

  Create an informative and well-structured mind map for the topic: "{{{topic}}}".
  
  IMPORTANT: The output MUST be a valid JSON object that strictly adheres to the MindMapSchema. Do NOT include any extra text, explanations, or markdown formatting like \`\`\`json. Your response should start with '{' and end with '}'.
`;

const prompt = ai.definePrompt({
  name: 'generateMindMapPrompt',
  input: { schema: GenerateMindMapInputSchema },
  output: { schema: GenerateMindMapOutputSchema },
  prompt: MIND_MAP_PROMPT,
});

const generateMindMapFlow = ai.defineFlow(
  {
    name: 'generateMindMapFlow',
    inputSchema: GenerateMindMapInputSchema,
    outputSchema: GenerateMindMapOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

import { generateContentWithCustomKey } from '@/ai/custom-client';

export async function generateMindMap(
  input: GenerateMindMapInput & { apiKey?: string }
): Promise<GenerateMindMapOutput> {
  if (input.apiKey) {
    // Simple template replacement (handlebars-style light)
    let processedPrompt = MIND_MAP_PROMPT
      .replace('{{{topic}}}', input.topic)
      .replace('{{{topic}}}', input.topic) // Request twice
      .replace('{{#if parentTopic}}', input.parentTopic ? '' : '<!--')
      .replace('{{/if}}', input.parentTopic ? '' : '-->')
      .replace('{{{parentTopic}}}', input.parentTopic || '')
      .replace('{{{parentTopic}}}', input.parentTopic || '')
      .replace('{{#if targetLang}}', input.targetLang ? '' : '<!--')
      .replace('{{else}}', input.targetLang ? '-->' : '')
      .replace('{{/if}}', input.targetLang ? '<!--' : '') // Close else block if lang exists, else close if if lang doesn't exist
    // Simplified approach: Construct prompt manually for custom client to avoid fragile regex replace on handlebars template

    const manualPrompt = `You are an expert in creating mind maps for students.

  Given a main topic, you will generate a comprehensive, multi-layered mind map.
  ${input.parentTopic ? `The mind map for "${input.topic}" should be created in the context of the parent topic: "${input.parentTopic}". This is for an in-depth exploration, so the content must be relevant and interconnected with the parent.` : ''}

  ${input.targetLang ? `The entire mind map, including all topics, categories, and descriptions, MUST be in the following language: ${input.targetLang}.` : 'The entire mind map MUST be in English.'}

  The mind map must have the following structure and constraints:
  - Topic: The main topic for this specific map.
  - Icon: A relevant icon name from the lucide-react library, in kebab-case (e.g., "brain-circuit").
  - Sub-Topics: A list of at least 4-5 main sub-topics.
    - Icon: A relevant lucide-react icon for each sub-topic.
  - Categories: For each sub-topic, a list of 3-4 categories.
    - Icon: A relevant lucide-react icon for each category.
  - Sub-Categories: For each category, a list of at least 4-5 detailed sub-categories.
    - Description: A brief but thorough description of each sub-category.
    - Icon: A relevant lucide-react icon for each sub-category.
    - Tags: A list of 2-3 relevant keywords or tags for the sub-category.

  Create an informative and well-structured mind map for the topic: "${input.topic}".
  
  IMPORTANT: The output MUST be a valid JSON object that strictly adheres to the MindMapSchema. Do NOT include any extra text, explanations, or markdown formatting like \`\`\`json. Your response should start with '{' and end with '}'.`;

    return generateContentWithCustomKey(input.apiKey, "System: XML Schema compliant JSON generator", manualPrompt);
  }

  return generateMindMapFlow(input);
}
