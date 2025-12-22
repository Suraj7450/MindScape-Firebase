
'use server';

/**
 * @fileOverview Provides real-life examples for mind map nodes.
 *
 * - explainWithExample - A function that generates a real-life example for a topic.
 * - ExplainWithExampleInput - The input type for the explainWithExample function.
 * - ExplainWithExampleOutput - The return type for the explainWithExample function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExplainWithExampleInputSchema = z.object({
  mainTopic: z.string().describe('The main topic of the mind map.'),
  topicName: z.string().describe('The name of the node to explain.'),
  explanationMode: z
    .enum(['Beginner', 'Intermediate', 'Expert'])
    .describe('The desired level of detail for the example.'),
});
export type ExplainWithExampleInput = z.infer<
  typeof ExplainWithExampleInputSchema
>;

const ExplainWithExampleOutputSchema = z.object({
  example: z
    .string()
    .describe('A short, relatable, real-life example for the topic.'),
});
export type ExplainWithExampleOutput = z.infer<
  typeof ExplainWithExampleOutputSchema
>;

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

export async function explainWithExample(
  input: ExplainWithExampleInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<ExplainWithExampleOutput> {
  const { provider, apiKey, mainTopic, topicName, explanationMode, strict } = input;

  const systemPrompt = `You are an expert at explaining complex topics with simple, relatable, real-life examples.

    The main topic is "${mainTopic}". The user wants an example for the concept: "${topicName}".
    
    The user has requested the example at the "${explanationMode}" level.
    - For "Beginner", use a very simple, everyday analogy.
    - For "Intermediate", use a more detailed but still accessible example.
    - For "Expert", use a specific, technical, or industry-related example.
    
    Your goal is to provide a single, concise, and easy-to-understand analogy or example tailored to the requested mode.
    
    The output MUST be a valid JSON object with the following structure:
    {
      "example": "Your example text here"
    }

    IMPORTANT: Return ONLY the raw JSON object, no other text or explanation.`;

  const userPrompt = "Generate the example.";

  const rawResult = await generateContent({
    provider,
    apiKey,
    systemPrompt,
    userPrompt,
    strict
  });

  try {
    const validated = ExplainWithExampleOutputSchema.parse(rawResult);
    return validated;
  } catch (e: any) {
    if (rawResult && typeof rawResult.example === 'string') return rawResult as ExplainWithExampleOutput;
    throw new Error(`Example generation failed validation: ${e.message}`);
  }
}

const prompt = ai.definePrompt({
  name: 'explainWithExamplePrompt',
  input: { schema: ExplainWithExampleInputSchema },
  output: { schema: ExplainWithExampleOutputSchema },
  prompt: `You are an expert at explaining complex topics with simple, relatable, real-life examples.

The main topic is "{{mainTopic}}". The user wants an example for the concept: "{{topicName}}".

The user has requested the example at the "{{explanationMode}}" level.
- For "Beginner", use a very simple, everyday analogy.
- For "Intermediate", use a more detailed but still accessible example.
- For "Expert", use a specific, technical, or industry-related example.

Your goal is to provide a single, concise, and easy-to-understand analogy or example tailored to the requested mode.

**Example Format:**
- For "API" (Beginner): "It's like a restaurant menu. You can order without knowing how the kitchen works."
- For "API" (Intermediate): "It's like a contract between two software applications, defining how they'll communicate and exchange data to perform a specific function."
- For "API" (Expert): "It's like a GraphQL endpoint that allows a client to request specific data fields from a server, reducing over-fetching compared to a traditional RESTful approach."

Provide a similar real-life example for "{{topicName}}".
`,
});

const explainWithExampleFlow = ai.defineFlow(
  {
    name: 'explainWithExampleFlow',
    inputSchema: ExplainWithExampleInputSchema,
    outputSchema: ExplainWithExampleOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
