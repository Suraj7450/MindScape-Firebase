
'use server';
/**
 * @fileOverview A flow to summarize a chat history into a short topic.
 *
 * - summarizeChat - A function that takes chat history and returns a topic.
 */

import { ai } from '@/ai/genkit';
import {
  SummarizeChatInput,
  SummarizeChatInputSchema,
  SummarizeChatOutput,
  SummarizeChatOutputSchema,
} from '@/ai/schemas/summarize-chat-schema';

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

export async function summarizeChat(
  input: SummarizeChatInput & { apiKey?: string; provider?: AIProvider }
): Promise<SummarizeChatOutput> {
  if (input.provider === 'pollinations' || input.apiKey) {
    const historyText = input.history.map(h => `${h.role}: ${h.content}`).join('\n');
    const systemPrompt = `Based on the following conversation history, create a short, descriptive topic title (3-5 words).
  
    Example:
    - History: "User: Tell me about photosynthesis. Model: Photosynthesis is the process..." -> Topic: "The Process of Photosynthesis"
    - History: "User: I need ideas for a fantasy story. Model: How about a dragon..." -> Topic: "Fantasy Story Brainstorming"
  
    Conversation:
    ${historyText}
  
    Generate a concise topic title for this conversation. Return valid JSON { "topic": "Title" }`;

    const userPrompt = "Summarize the chat.";

    return generateContent({
      provider: input.provider,
      apiKey: input.apiKey,
      systemPrompt,
      userPrompt
    });
  }
  return summarizeChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeChatPrompt',
  input: { schema: SummarizeChatInputSchema },
  output: { schema: SummarizeChatOutputSchema },
  prompt: `Based on the following conversation history, create a short, descriptive topic title (3-5 words).

Example:
- History: "User: Tell me about photosynthesis. Model: Photosynthesis is the process..." -> Topic: "The Process of Photosynthesis"
- History: "User: I need ideas for a fantasy story. Model: How about a dragon..." -> Topic: "Fantasy Story Brainstorming"

Conversation:
{{#each history}}
  {{this.role}}: {{this.content}}
{{/each}}

Generate a concise topic title for this conversation.
`,
});

const summarizeChatFlow = ai.defineFlow(
  {
    name: 'summarizeChatFlow',
    inputSchema: SummarizeChatInputSchema,
    outputSchema: SummarizeChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
