
'use server';

/**
 * @fileOverview Generates a multi-layered mind map from a given topic.
 *
 * - generateMindMap - A function that generates the mind map.
 * - GenerateMindMapInput - The input type for the generateMindMap function.
 * - GenerateMindMapOutput - The return type for the generateMindMap function.
 */

import { z } from 'zod';
import { AIGeneratedMindMapSchema } from '@/ai/mind-map-schema';
import { SearchContext } from '@/ai/search/search-schema';

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

const GenerateMindMapOutputSchema = AIGeneratedMindMapSchema;

export type GenerateMindMapOutput = z.infer<typeof GenerateMindMapOutputSchema>;



// Note: We use manual dispatcher for multi-provider support and retries.

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

export async function generateMindMap(
  input: GenerateMindMapInput & { apiKey?: string; provider?: AIProvider; searchContext?: SearchContext | null }
): Promise<GenerateMindMapOutput> {
  const { topic, parentTopic, targetLang, persona, depth = 'low', provider, apiKey, searchContext } = input;

  // Map depth to structural density with STRICT enforcement
  let densityInstruction = '';
  if (depth === 'medium') {
    // Medium mode: 5×3×5 = 75 items
    densityInstruction = `STRUCTURE DENSITY (STRICT REQUIREMENTS):
    - Generate EXACTLY 5 subTopics (no more, no less)
    - EACH subTopic MUST have EXACTLY 3 categories
    - EACH category MUST have EXACTLY 5 subCategories
    - Total items: 5 × 3 × 5 = 75 items
    - QUALITY CHECK: Every node must have a full name and description.
    - CRITICAL: Ensure ALL JSON is properly closed with matching braces and brackets`;
  } else if (depth === 'deep') {
    // Deep mode: 5×4×6 = 120 items
    densityInstruction = `STRUCTURE DENSITY (STRICT REQUIREMENTS):
    - Generate EXACTLY 5 subTopics (no more, no less)
    - EACH subTopic MUST have EXACTLY 4 categories
    - EACH category MUST have EXACTLY 6 subCategories
    - Total items: 5 × 4 × 6 = 120 items
    - QUALITY CHECK: Every single sub-category MUST have a substantial name AND a descriptive description.
    - DO NOT generate empty or placeholder objects.
    - CRITICAL: Ensure ALL JSON is properly closed with matching braces and brackets
    - If approaching token limit, prioritize closing JSON structures over adding more content.`;
  } else {
    // Basic mode: 24-40 items
    densityInstruction = `STRUCTURE DENSITY (FLEXIBLE):
    - Generate 4-5 subTopics
    - EACH subTopic should have 2-3 categories
    - EACH category should have 3-4 subCategories
    - Target range: 24 - 40 total items.
    - Focus on a high-level but substantial overview.`;
  }

  let personaInstruction = '';
  // Normalized persona selection (handle both casing styles)
  const selectedPersona = persona?.toLowerCase() || 'teacher';

  if (selectedPersona === 'teacher') {
    personaInstruction = `
    ADOPT PERSONA: "Expert Teacher"
    - Explanations should be educational, clear, and encouraging.
    - Use analogies to explain complex concepts.
    - Structure content like a curriculum, moving from basics to advanced.`;
  } else if (selectedPersona === 'concise') {
    personaInstruction = `
    ADOPT PERSONA: "Efficiency Expert"
    - Text must be extremely brief and to the point.
    - Use powerful keywords and short fragments instead of full sentences.
    - Eliminate all filler words.`;
  } else if (selectedPersona === 'creative') {
    personaInstruction = `
    ADOPT PERSONA: "Creative Visionary"
    - Explore non-obvious, imaginative, and out-of-the-box connections.
    - Use vivid, evocative, and metaphorical language.
    - Focus on innovation, future trends, and artistic angles.`;
  } else if (selectedPersona === 'sage') {
    personaInstruction = `
    ADOPT PERSONA: "Cognitive Sage"
    - Provide a profound, intellectually deep, and highly structured overview.
    - Use sophisticated, precise, and insightful language.
    - Every major node MUST include a high-level 'insight' property capturing deep wisdom.`;
  } else {
    // Default safe persona
    personaInstruction = `ADOPT PERSONA: "Balanced Assistant" - Provide clear, factual, and well-structured information.`;
  }

  // Search grounding instruction
  let searchGroundingPrompt = '';
  let searchContextSection = '';

  if (searchContext && searchContext.sources.length > 0) {
    searchGroundingPrompt = `
REAL-TIME SEARCH CONTEXT:
You have been provided with current Google search results for this topic.
Use these results as factual grounding for your mind map.
DO NOT fabricate information beyond these search results.
Prefer recent and authoritative sources.
Incorporate current facts, recent developments, and up-to-date information from the search results.
`;

    searchContextSection = `

CURRENT WEB INFORMATION:
${searchContext.summary}

SOURCES:
${searchContext.sources.slice(0, 5).map((s, i) => `${i + 1}. ${s.title} - ${s.url}`).join('\n')}

Based on this current information from ${new Date(searchContext.timestamp).toLocaleDateString()}, create a mind map that reflects the latest facts and developments.
`;
  }

  // Construct Prompt
  const prompt = `You are an expert in creating mind maps for students.

  ${personaInstruction}
  ${searchGroundingPrompt}

  Given a main topic, you will generate a comprehensive, multi - layered mind map.
  ${parentTopic ? `The mind map for "${topic}" should be created in the context of the parent topic: "${parentTopic}". This is for an in-depth exploration, so the content must be relevant and interconnected with the parent.` : ''}

  ${targetLang ? `The entire mind map, including all topics, categories, and descriptions, MUST be in the following language: ${targetLang}.` : 'The entire mind map MUST be in English.'}
  ${searchContextSection}

  The mind map must have the FOLLOWING JSON structure (MANDATORY):
{
  "mode": "single",
  "topic": "${topic}",
  "shortTitle": "Impactful Short Title",
  "icon": "brain-circuit",
  "subTopics": [
    {
      "name": "Subtopic Name",
      "icon": "flag",
      "insight": "Wisdom about subtopic",
      "categories": [
        {
          "name": "Category Name",
          "icon": "folder",
          "insight": "Wisdom about category",
          "subCategories": [
            {
              "name": "Subcategory Name",
              "description": "One sentence explanation.",
              "icon": "book-open"
            }
          ]
        }
      ]
    }
  ]
}

  IMPORTANT RULES:
  - YOU MUST include "mode": "single" in the root object.
  - JSON field names MUST be EXACTLY: mode, topic, shortTitle, icon, subTopics, categories, subCategories, name, description, insight.
  - Icons must be valid lucide-react names in kebab-case (e.g., "scroll", "landmark", "shield").
  - Sub-category descriptions MUST be exactly one sentence.
  - ${densityInstruction}
  - Ensure ALL JSON is properly closed.
  - DO NOT TRUNCATE. If you must stop, close all open [ and { structures.
  ${searchContext ? '- Ground all information in the provided search results. Use current facts and recent developments.' : ''}

  Create an informative and well-structured mind map for the topic: "${topic}".

  CRITICAL: Return ONLY valid JSON. No markdown formatting, no backticks, no extra text.`;

  const result = await generateContent({
    provider: provider,
    apiKey: apiKey,
    systemPrompt: "You are a mind map generator. Output MUST be strictly valid JSON according to the requested structure.",
    userPrompt: prompt,
    schema: AIGeneratedMindMapSchema,
  });

  console.log(`✅ Mind map generated successfully:`, {
    topic: result.topic,
    subTopicsCount: result.subTopics.length
  });

  return result;
}
