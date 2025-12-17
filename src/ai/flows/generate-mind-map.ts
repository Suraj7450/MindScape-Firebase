
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

  The mind map must have the following JSON structure:
  {
    "topic": "Your Topic Here",  // Field name in camelCase, value in proper English
    "icon": "brain-circuit",
    "subTopics": [
      {
        "name": "Subtopic name here",  // Proper English with spaces and normal capitalization
        "icon": "flag",
        "categories": [
          {
            "name": "Category name here",
            "icon": "folder",
            "subCategories": [
              {
                "name": "Subcategory name",
                "description": "A clear description in proper English.",
                "icon": "book-open",
                "tags": ["tag1", "tag2", "tag3"]
              }
            ]
          }
        ]
      }
    ]
  }

  IMPORTANT RULES:
  - JSON field names MUST be camelCase: topic, subTopics, categories, subCategories, name, description, icon, tags
  - Content values (topic names, descriptions) MUST use proper English with normal capitalization and spaces
  - Example: {"name": "Persian and Greek invasions"} NOT {"name": "persianAndGreekInvasions"}
  - Icons must be valid lucide-react names in kebab-case (e.g., "shield", "sword", "globe")
  - Generate at least 4-5 subTopics, 3-4 categories per subtopic, and 4-5 subCategories per category

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

  The mind map must have the following JSON structure:
  {
    "topic": "Your Topic Here",  // Field name in camelCase, value in proper English
    "icon": "brain-circuit",
    "subTopics": [
      {
        "name": "Subtopic name here",  // Proper English with spaces and normal capitalization
        "icon": "flag",
        "categories": [
          {
            "name": "Category name here",
            "icon": "folder",
            "subCategories": [
              {
                "name": "Subcategory name",
                "description": "A clear description in proper English.",
                "icon": "book-open",
                "tags": ["tag1", "tag2", "tag3"]
              }
            ]
          }
        ]
      }
    ]
  }

  IMPORTANT RULES:
  - JSON field names MUST be camelCase: topic, subTopics, categories, subCategories, name, description, icon, tags
  - Content values (topic names, descriptions) MUST use proper English with normal capitalization and spaces
  - Example: {"name": "Persian and Greek invasions"} NOT {"name": "persianAndGreekInvasions"}
  - Icons must be valid lucide-react names in kebab-case (e.g., "shield", "sword", "globe")
  - Generate at least 4-5 subTopics, 3-4 categories per subtopic, and 4-5 subCategories per category

  Create an informative and well-structured mind map for the topic: "${input.topic}".
  
  IMPORTANT: The output MUST be a valid JSON object that strictly adheres to the MindMapSchema. Do NOT include any extra text, explanations, or markdown formatting like \`\`\`json. Your response should start with '{' and end with '}'.`;

    const rawResult = await generateContentWithCustomKey(input.apiKey, "System: XML Schema compliant JSON generator", manualPrompt);

    // Validate and sanitize the result 
    // Ensure subTopics exists even if the AI omitted it
    if (rawResult && !rawResult.subTopics) {
      rawResult.subTopics = [];
    }

    try {
      const validatedResult = GenerateMindMapOutputSchema.parse(rawResult);
      return validatedResult;
    } catch (e) {
      console.error("Schema validation failed for Pollinations result:", e);
      // Fallback or attempt to fix casing if needed, but for now rethrow or return raw if close enough
      // For robustness, let's return it if it looks like a mind map, otherwise throw
      if (rawResult && rawResult.topic) {
        return rawResult as GenerateMindMapOutput;
      }
      throw new Error("Generated mind map did not match required schema.");
    }
  }

  return generateMindMapFlow(input);
}
