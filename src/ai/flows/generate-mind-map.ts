
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
  persona: z
    .string()
    .optional()
    .describe('The AI persona / style to use (e.g., "Teacher", "Concise", "Creative").'),
  depth: z
    .enum(['low', 'medium', 'deep'])
    .default('low')
    .describe('The level of detail/depth for the mind map structure.'),
});
export type GenerateMindMapInput = z.infer<typeof GenerateMindMapInputSchema>;

const GenerateMindMapOutputSchema = MindMapSchema;

export type GenerateMindMapOutput = z.infer<typeof GenerateMindMapOutputSchema>;



// Note: We use manual dispatcher for multi-provider support and retries.
// The Genkit definitions below are removed to avoid confusion with the actual runtime logic.

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

export async function generateMindMap(
  input: GenerateMindMapInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<GenerateMindMapOutput> {
  const { topic, parentTopic, targetLang, persona, depth = 'low', provider, apiKey, strict } = input;

  // Map depth to structural density
  let densityInstruction = '';
  if (depth === 'medium') {
    densityInstruction = 'STRUCTURE DENSITY: Generate AT LEAST 6 subTopics. Each subTopic MUST have AT LEAST 4 categories. Each category MUST have AT LEAST 6 subCategories.';
  } else if (depth === 'deep') {
    densityInstruction = 'STRUCTURE DENSITY: Generate AT LEAST 8 subTopics. Each subTopic MUST have AT LEAST 6 categories. Each category MUST have AT LEAST 9 subCategories. This is a DEEP DIVE, provide maximum detail.';
  } else {
    densityInstruction = 'STRUCTURE DENSITY: Generate AT LEAST 4 subTopics. Each subTopic MUST have AT LEAST 2 categories. Each category MUST have AT LEAST 3 subCategories.';
  }

  let personaInstruction = '';
  if (persona === 'Teacher') {
    personaInstruction = `
    ADOPT PERSONA: "Expert Teacher"
  - Use educational analogies to explain complex concepts.
    - Focus on "How" and "Why" in descriptions.
    - Structure sub - topics like a curriculum, moving from basics to advanced.
    - Descriptions should be encouraging and clear.`;
  } else if (persona === 'Concise') {
    personaInstruction = `
    ADOPT PERSONA: "Efficiency Expert"
  - Keep all text extremely brief and to the point.
    - Use fragments or high - impact keywords instead of long sentences.
    - Focus only on the most critical information.
    - Descriptions should be concise and focused.`;
  } else if (persona === 'Creative') {
    personaInstruction = `
    ADOPT PERSONA: "Creative Visionary"
  - Explore unique, out - of - the - box connections and angles.
    - Use vivid, evocative language in descriptions.
    - Include "Future Trends" or "Innovation" as sub - topics.
    - Make the content feel inspired and non - obvious.`;
  } else {
    personaInstruction = `
    ADOPT PERSONA: "Cognitive Sage"
    - Provide a profound, intellectually deep, and highly structured overview.
    - Use sophisticated, precise, and insightful language.
    - CORE PHILOSOPHY: "A wise man possesses the ability to break down complex information into smaller, manageable parts for thorough examination."
    - Every major node (Sub-Topic and Category) MUST include an 'insight' property that briefly captures this wisdom.`;
  }

  // Construct Prompt
  const prompt = `You are an expert in creating mind maps for students.

  ${personaInstruction}

  Given a main topic, you will generate a comprehensive, multi - layered mind map.
  ${parentTopic ? `The mind map for "${topic}" should be created in the context of the parent topic: "${parentTopic}". This is for an in-depth exploration, so the content must be relevant and interconnected with the parent.` : ''}

  ${targetLang ? `The entire mind map, including all topics, categories, and descriptions, MUST be in the following language: ${targetLang}.` : 'The entire mind map MUST be in English.'}

  The mind map must have the following JSON structure:
{
    "topic": "Your Topic Here",  // Field name in camelCase, value in proper English
    "shortTitle": "Short Title", // CRITICAL: A condensed, catchy, and 'smart' version (max 2-4 words). Avoid filler words like 'A guide to...' or 'Introduction to...'. Make it impactful.
      "icon": "brain-circuit",
        "subTopics": [
          {
            "name": "Subtopic name here",
            "icon": "flag",
            "insight": "A profound, wise observation about this sub-topic and its place in the grander scheme of the main topic.",
            "categories": [
              {
                "name": "Category name here",
                "icon": "folder",
                "insight": "An analytical breakdown or 'wise man' perspective on why this specific category is vital.",
                "subCategories": [
                  {
                    "name": "Subcategory name",
                    "description": "A concise statement (exactly one sentence) in proper English.",
                    "icon": "book-open",
                    "tags": ["tag1", "tag2", "tag3"]
                  }
                ]
              }
            ]
          }
        ]
}

  IMPORTANT RULES(STRICT ADHERENCE REQUIRED):
- JSON field names MUST be camelCase: topic, subTopics, categories, subCategories, name, description, icon, tags
  - Content values(topic names, descriptions) MUST use proper English with normal capitalization and spaces
    - Example: { "name": "Persian and Greek invasions" } NOT { "name": "persianAndGreekInvasions" }
- Icons must be valid lucide - react names in kebab -case (e.g., "shield", "sword", "globe")
  - BE SPECIFIC WITH ICONS: Choose icons that are SEMANTICALLY RELEVANT to the name.If the subtopic is "History", use "scroll" or "landmark".
  - Sub - category descriptions MUST be exactly one sentence and highly informative.
  - ${densityInstruction}
  - DO NOT return an empty 'subTopics' array.If you are stuck, explore broad sub - categories of the given topic.
  - SMART TITLES: The 'shortTitle' must be the "Hero" title of the map. It should be punchy and professional.
  - FAILURE IS NOT AN OPTION: You must return a full, deep hierarchy. "Short" or "shallow" responses are invalid.

  Create an informative and well - structured mind map for the topic: "${topic}".

  IMPORTANT: The output MUST be a valid JSON object that strictly adheres to the MindMapSchema.Do NOT include any extra text, explanations, or markdown formatting like \`\`\`json. Your response should start with '{' and end with '}'.`;

  const result = await generateContent({
    provider: provider,
    apiKey: apiKey,
    systemPrompt: "System: High-density educational mind map generator. Output MUST be strictly valid JSON.",
    userPrompt: prompt,
    schema: MindMapSchema,
    strict
  });

  console.log(`✅ Mind map generated successfully:`, {
    topic: result.topic,
    subTopicsCount: result.subTopics.length
  });

  return result;
}
