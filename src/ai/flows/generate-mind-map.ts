
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

  IMPORTANT RULES:
  - JSON field names MUST be camelCase: topic, subTopics, categories, subCategories, name, description, icon, tags
  - Content values (topic names, descriptions) MUST use proper English with normal capitalization and spaces
  - Example: {"name": "Persian and Greek invasions"} NOT {"name": "persianAndGreekInvasions"}
  - Icons must be valid lucide-react names in kebab-case (e.g., "shield", "sword", "globe")
  - Sub-category descriptions MUST be concise: exactly one sentence maximum.
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

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

export async function generateMindMap(
  input: GenerateMindMapInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<GenerateMindMapOutput> {
  const { topic, parentTopic, targetLang, persona, provider, apiKey, strict } = input;

  let personaInstruction = '';
  if (persona === 'Teacher') {
    personaInstruction = `
    ADOPT PERSONA: "Expert Teacher"
    - Use educational analogies to explain complex concepts.
    - Focus on "How" and "Why" in descriptions.
    - Structure sub-topics like a curriculum, moving from basics to advanced.
    - Descriptions should be encouraging and clear.`;
  } else if (persona === 'Concise') {
    personaInstruction = `
    ADOPT PERSONA: "Efficiency Expert"
    - Keep all text extremely brief and to the point.
    - Use fragments or high-impact keywords instead of long sentences.
    - Focus only on the most critical information.
    - Descriptions should be very short (max 15 words).`;
  } else if (persona === 'Creative') {
    personaInstruction = `
    ADOPT PERSONA: "Creative Visionary"
    - Explore unique, out-of-the-box connections and angles.
    - Use vivid, evocative language in descriptions.
    - Include "Future Trends" or "Innovation" as sub-topics.
    - Make the content feel inspired and non-obvious.`;
  } else {
    personaInstruction = `
    ADOPT PERSONA: "Standard Academic Assistant"
    - Provide a balanced, informative, and well-structured overview.
    - Use clear, professional, yet accessible language.
    - Ensure comprehensive coverage of core concepts.
    - Keep descriptions highly focused and exactly one sentence.`;
  }

  // Construct Prompt
  const prompt = `You are an expert in creating mind maps for students.
  
  ${personaInstruction}

  Given a main topic, you will generate a comprehensive, multi-layered mind map.
  ${parentTopic ? `The mind map for "${topic}" should be created in the context of the parent topic: "${parentTopic}". This is for an in-depth exploration, so the content must be relevant and interconnected with the parent.` : ''}

  ${targetLang ? `The entire mind map, including all topics, categories, and descriptions, MUST be in the following language: ${targetLang}.` : 'The entire mind map MUST be in English.'}

  The mind map must have the following JSON structure:
  {
    "topic": "Your Topic Here",  // Field name in camelCase, value in proper English
    "shortTitle": "Short Title", // A condensed version (max 3-4 words)
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

  IMPORTANT RULES (STRICT ADHERENCE REQUIRED):
  - JSON field names MUST be camelCase: topic, subTopics, categories, subCategories, name, description, icon, tags
  - Content values (topic names, descriptions) MUST use proper English with normal capitalization and spaces
  - Example: {"name": "Persian and Greek invasions"} NOT {"name": "persianAndGreekInvasions"}
  - Icons must be valid lucide-react names in kebab-case (e.g., "shield", "sword", "globe")
  - BE SPECIFIC WITH ICONS: Choose icons that are SEMANTICALLY RELEVANT to the name. If the subtopic is "History", use "scroll" or "landmark".
  - Sub-category descriptions MUST be exactly one sentence and highly informative.
  - STRUCTURE DENSITY: Generate AT LEAST 5 subTopics. Each subTopic MUST have AT LEAST 3 categories. Each category MUST have AT LEAST 4 subCategories.
  - DO NOT return an empty 'subTopics' array. If you are stuck, explore broad sub-categories of the given topic.
  - FAILURE IS NOT AN OPTION: You must return a full, deep hierarchy. "Short" or "shallow" responses are invalid.

  Create an informative and well-structured mind map for the topic: "${topic}".
  
  IMPORTANT: The output MUST be a valid JSON object that strictly adheres to the MindMapSchema. Do NOT include any extra text, explanations, or markdown formatting like \`\`\`json. Your response should start with '{' and end with '}'.`;

  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const rawResult = await generateContent({
        provider: provider,
        apiKey: apiKey,
        systemPrompt: "System: High-density educational mind map generator. JSON ONLY.",
        userPrompt: prompt,
        strict
      });

      // 1. SMART KEY MAPPING (Fix #1 from User)
      console.log('📝 Raw AI text response received, parsing structure...');
      console.log('🎯 Parsed JSON keys:', Object.keys(rawResult || {}));

      const aiSubTopics = (
        rawResult?.subTopics ||
        rawResult?.topics ||
        rawResult?.sections ||
        rawResult?.nodes ||
        []
      );

      console.log(`📊 Raw SubTopics count: ${aiSubTopics.length}`);

      // 2. RECURSIVE DEEP NORMALIZATION
      const normalizeSubTopics = (items: any[]) => {
        return items.map((st: any) => ({
          name: st.name || st.title || st.topic || st.header || "Unnamed Sub-topic",
          icon: st.icon || 'folder',
          categories: (st.categories || st.topics || st.sections || st.items || []).map((cat: any) => ({
            name: cat.name || cat.title || cat.header || "Unnamed Category",
            icon: cat.icon || 'file',
            subCategories: (cat.subCategories || cat.items || cat.details || cat.content || []).map((sub: any) => ({
              name: sub.name || sub.title || "Unnamed Detail",
              description: sub.description || sub.content || sub.text || "",
              icon: sub.icon || 'book-open',
              tags: Array.isArray(sub.tags) ? sub.tags : []
            }))
          }))
        }));
      };

      const normalized = {
        topic: rawResult?.topic || topic,
        shortTitle: rawResult?.shortTitle || rawResult?.topic || topic,
        icon: rawResult?.icon || 'brain-circuit',
        subTopics: normalizeSubTopics(aiSubTopics),
      };

      console.log('✅ Normalized result:', JSON.stringify(normalized, null, 2).substring(0, 200) + '...');

      // 3. STRICT VALIDATION (Fix #2 from User)
      // Check if we actually got subTopics. If not, this is a failure.
      if (!Array.isArray(normalized.subTopics) || normalized.subTopics.length < 3) {
        console.warn(`⚠️ Attempt ${attempt}: AI returned insufficient subTopics (${normalized.subTopics?.length || 0}). Retrying...`);
        throw new Error('AI failed to generate a comprehensive structure (minimum 3 subtopics required).');
      }

      // Ensure each subTopic has categories to prevent "shallow" maps
      const hasCategories = normalized.subTopics.some((st: any) => st.categories && st.categories.length > 0);
      if (!hasCategories) {
        console.warn(`⚠️ Attempt ${attempt}: AI returned subTopics but no categories. Retrying...`);
        throw new Error('AI returned a shallow structure with no categories.');
      }

      // 4. SCHEMA PARSE
      const validatedResult = GenerateMindMapOutputSchema.parse(normalized);

      console.log(`✅ Mind map generated successfully on attempt ${attempt}:`, {
        topic: validatedResult.topic,
        subTopicsCount: validatedResult.subTopics.length
      });

      return validatedResult;
    } catch (e: any) {
      lastError = e;
      console.error(`❌ Generation attempt ${attempt} failed:`, e.message);

      // If we've hit the limit, throw the last error
      if (attempt === maxAttempts) {
        throw new Error(`Failed to generate a valid mind map after ${maxAttempts} attempts: ${e.message}`);
      }

      // Intelligent delay: wait longer for concurrency/rate errors
      const isConcurrency = e.message?.toLowerCase().includes('concurrency') || e.message?.toLowerCase().includes('rate limit');
      const waitTime = isConcurrency ? 2000 + (Math.random() * 2000) : 500;

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError || new Error('Unknown error during mind map generation');
}
