
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
      - Keep descriptions highly focused and exactly one sentence.`;
    }

    const systemPrompt = `You are an elite intelligence architect specialized in deep comparative analysis. Your goal is to reveal non-obvious connections and sharp, meaningful contrasts between two topics using a modular, dimension-first approach.
    
    ${personaInstruction}
    
    ${targetLangInstruction}
    
    The mind map must have the following structure (use exact field names):
      - mode: Must be exactly "compare".
      - topic: A main topic like "${input.topic1} vs. ${input.topic2}".
      - shortTitle: A condensed version like "${input.topic1} vs ${input.topic2}" (max 4 words).
      - icon: A relevant lucide-react icon for comparison, such as "scale" or "git-compare-arrows".
      - compareData:
        1. **"unityNexus"**: 
           - Identify 4-5 shared fundamental principles, structural core values, or historical commonalities.
           - Provide these as a list of nodes (id, title, description, icon).
           - Description must be one evocative sentence.
        2. **"dimensions"**:
           - This is the "Dimensional Battleground" - the core Bento grid.
           - Identify 5-7 major categories of comparison (e.g., Performance, Philosophy, Scalability, Ecosystem).
           - For EACH dimension, provide:
             - name: The dimension title.
             - icon: A relevant icon (lucide-react kebab-case).
             - topicAInsight: How "${input.topic1}" handles this dimension (Exactly one sharp sentence).
             - topicBInsight: How "${input.topic2}" handles this dimension (Exactly one sharp sentence).
             - neutralSynthesis: A bridge that explains how they interact or the "middle ground".
        3. **"synthesisHorizon"**:
           - Provide a high-level experts' verdict and future convergence path.
           - expertVerdict: A professional judgment on when to use which or their current standing.
           - futureEvolution: How these two topics might integrate, compete, or evolve together in the next 5-10 years.
        4. **"relevantLinks"**: 3-4 authoritative resources related to the comparison.
    `;

    const userPrompt = `Generate a structured mind map comparing and contrasting "${input.topic1}" and "${input.topic2}".`;

    const maxAttempts = 2;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await generateContent({
          provider,
          apiKey,
          systemPrompt,
          userPrompt,
          schema: GenerateComparisonMapOutputSchema,
          strict
        });

        return result;
      } catch (e: any) {
        lastError = e;
        console.error(`❌ Comparison map generation attempt ${attempt} failed: `, e.message);
        if (attempt === maxAttempts) throw e;
        await new Promise(res => setTimeout(res, 1000));
      }
    }

    throw lastError || new Error('Comparison map generation failed');
  }
  return generateComparisonMapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateComparisonMapPrompt',
  input: { schema: GenerateComparisonMapInputSchema },
  output: { schema: GenerateComparisonMapOutputSchema },
  prompt: `You are an elite intelligence architect specialized in deep comparative analysis. Your goal is to reveal non-obvious connections and sharp, meaningful contrasts between two topics using a modular, dimension-first approach.

  Your task is to generate a structured mind map comparing and contrasting "{{{topic1}}}" and "{{{topic2}}}".

  {{#if targetLang}}
  The entire mind map, including all topics, categories, and descriptions, MUST be in the following language: {{{targetLang}}}.
  {{else}}
  The entire mind map MUST be in English.
  {{/if}}

  The mind map must have the following structure:
    - mode: Must be exactly "compare".
    - topic: A main topic like "{{{topic1}}} vs. {{{topic2}}}".
    - shortTitle: A condensed version like "{{{topic1}}} vs {{{topic2}}}" (max 4 words).
    - icon: A relevant lucide-react icon for comparison, such as "scale" or "git-compare-arrows".
    - compareData:
      1. **"unityNexus"**: 
         - Identify 4-5 shared fundamental principles, structural core values, or historical commonalities.
         - Provide these as a list of nodes (id, title, description, icon).
      2. **"dimensions"**:
         - Identify 5-7 major categories of comparison.
         - For EACH dimension, provide:
           - name: The dimension title.
           - icon: A relevant icon name.
           - topicAInsight: How "{{{topic1}}}" handles this dimension.
           - topicBInsight: How "{{{topic2}}}" handles this dimension.
           - neutralSynthesis: A bridge explaining their interaction.
      3. **"synthesisHorizon"**:
         - expertVerdict: A professional judgment.
         - futureEvolution: Future convergence or competition path.
      4. **"relevantLinks"**: authoritative resources.
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
