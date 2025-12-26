
'use server';

/**
 * @fileOverview Generates a mind map from an image.
 *
 * - generateMindMapFromImage - A function that generates the mind map from an image.
 * - GenerateMindMapFromImageInput - The input type for the function.
 * - GenerateMindMapFromImageOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { MindMapSchema } from '@/ai/mind-map-schema';

const GenerateMindMapFromImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image of a diagram, chart, or concept, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
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
type GenerateMindMapFromImageInput = z.infer<
  typeof GenerateMindMapFromImageInputSchema
>;

const GenerateMindMapFromImageOutputSchema = MindMapSchema;

export type GenerateMindMapFromImageOutput = z.infer<
  typeof GenerateMindMapFromImageOutputSchema
>;

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

export async function generateMindMapFromImage(
  input: GenerateMindMapFromImageInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<GenerateMindMapFromImageOutput> {
  const { provider, apiKey, strict } = input;
  if (provider === 'pollinations' || apiKey || provider === 'gemini') {
    const targetLangInstruction = input.targetLang
      ? `The entire mind map, including all topics, categories, and descriptions, MUST be in the following language: ${input.targetLang}.`
      : `The entire mind map MUST be in English.`;

    let personaInstruction = '';
    if (input.persona === 'Teacher') {
      personaInstruction = `
      ADOPT PERSONA: "Expert Teacher"
      - Use educational analogies to explain concepts found in the image.
      - Focus on tutorial-style descriptions.
      - Structure the map like a syllabus.
      - Descriptions should be encouraging and clear.`;
    } else if (input.persona === 'Concise') {
      personaInstruction = `
      ADOPT PERSONA: "Efficiency Expert"
      - Keep all analyzed content extremely brief.
      - Use high-impact keywords for topics and categories.
      - Descriptions should be very short pointers (max 15 words).`;
    } else if (input.persona === 'Creative') {
      personaInstruction = `
      ADOPT PERSONA: "Creative Visionary"
      - Find imaginative interpretations of the visual data.
      - Use vivid, descriptive language.
      - Imagine future or alternate versions of the concepts in the image.
      - Make the result feel inspired and non-obvious.`;
    } else {
      personaInstruction = `
      ADOPT PERSONA: "Standard Academic Assistant"
      - Provide a balanced and well-structured analysis of the image.
      - Use clear, professional, yet accessible language.
      - Ensure comprehensive coverage of all visible details.
      - Keep descriptions highly focused and exactly one sentence.`;
    }

    const systemPrompt = `You are an expert in analyzing images and creating structured, comprehensive mind maps from them.
    
    ${personaInstruction}
    
    Analyze the provided image and generate a detailed, multi-layered mind map based on its content.
    
    **CRITICAL INSTRUCTION**: You must extract the **specific information, names, values, and key entities** from the image. Use this **actual, literal data** to populate the mind map's topic, sub-topics, categories, and sub-categories.
    
    ${targetLangInstruction}
    
    The mind map must have the following structure:
      - Topic: The main topic identified from the image.
      - ShortTitle: A condensed version of the topic (max 3-4 words).
      - Icon: A relevant icon name from the lucide-react library, in kebab-case.
      - Sub-Topics: A list of at least 4-5 main sub-topics.
        - Icon: A relevant lucide-react icon.
      - Categories: For each sub-topic, a list of 3-4 categories.
        - Icon: A relevant lucide-react icon.
      - Sub-Categories: For each category, a list of at least 4-5 detailed sub-categories.
        - Description: A concise description (max 1-2 sentences), using data from the image.
        - Icon: A relevant lucide-react icon.
        - Tags: A list of 2-3 relevant keywords.
    
    The output must be a valid JSON object that adheres to the schema: { topic: string, shortTitle: string, icon: string, subTopics: [...] }`;

    const userPrompt = "Analyze this image and generate the mind map JSON.";

    // Parse Data URI
    const matches = input.imageDataUri.match(/^data:(.+);base64,(.+)$/);
    let images: { inlineData: { mimeType: string, data: string } }[] | undefined;

    if (matches) {
      images = [{ inlineData: { mimeType: matches[1], data: matches[2] } }];
    }

    return generateContent({
      provider: provider,
      apiKey: apiKey,
      systemPrompt,
      userPrompt,
      images,
      strict
    });
  }
  return generateMindMapFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMindMapFromImagePrompt',
  input: { schema: GenerateMindMapFromImageInputSchema },
  output: { schema: GenerateMindMapFromImageOutputSchema },
  prompt: `You are an expert in analyzing images and creating structured, comprehensive mind maps from them.

  Analyze the following image and generate a detailed, multi-layered mind map based on its content. The image could be a diagram, a screenshot of notes, a chart, or a photo of a concept. 
  
  **CRITICAL INSTRUCTION**: You must extract the **specific information, names, values, and key entities** from the image. Use this **actual, literal data** to populate the mind map's topic, sub-topics, categories, and sub-categories. Do not just describe the structure; fill the structure with the data found in the image.

  {{#if targetLang}}
  The entire mind map, including all topics, categories, and descriptions, MUST be in the following language: {{{targetLang}}}.
  {{else}}
  The entire mind map MUST be in English.
  {{/if}}

  The mind map must have the following structure:
  - Topic: The main topic identified from the image.
  - Icon: A relevant icon name from the lucide-react library, in kebab-case (e.g., "brain-circuit").
  - Sub-Topics: A list of at least 4-5 main sub-topics.
    - Icon: A relevant lucide-react icon for each sub-topic.
  - Categories: For each sub-topic, a list of 3-4 categories.
    - Icon: A relevant lucide-react icon for each category.
  - Sub-Categories: For each category, a list of at least 4-5 detailed sub-categories.
    - Description: A concise statement (exactly one sentence) of each sub-category, derived from the image or its context.
    - Icon: A relevant lucide-react icon for each sub-category.
    - Tags: A list of 2-3 relevant keywords or tags for the sub-category.

  Image to analyze: {{media url=imageDataUri}}

  The output must be a JSON object that adheres to the GenerateMindMapFromImageOutputSchema.
  `,
});

const generateMindMapFromImageFlow = ai.defineFlow(
  {
    name: 'generateMindMapFromImageFlow',
    inputSchema: GenerateMindMapFromImageInputSchema,
    outputSchema: GenerateMindMapFromImageOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
