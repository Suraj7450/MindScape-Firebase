
'use server';

/**
 * @fileOverview A conversational AI assistant for answering user questions.
 *
 * - chatWithAssistant - A function that handles the chat conversation.
 * - ChatWithAssistantInput - The input type for the chatWithAssistant function.
 * - ChatWithAssistantOutput - The return type for the chatWithAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatWithAssistantInputSchema = z.object({
  question: z.string().describe("The user's question."),
  topic: z
    .string()
    .describe(
      'The current mind map topic, providing context for the conversation.'
    ),
});
export type ChatWithAssistantInput = z.infer<
  typeof ChatWithAssistantInputSchema
>;

const ChatWithAssistantOutputSchema = z.object({
  answer: z.string().describe("The AI assistant's response."),
});
export type ChatWithAssistantOutput = z.infer<
  typeof ChatWithAssistantOutputSchema
>;

export async function chatWithAssistant(
  input: ChatWithAssistantInput
): Promise<ChatWithAssistantOutput> {
  return chatWithAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithAssistantPrompt',
  input: { schema: ChatWithAssistantInputSchema },
  output: { schema: ChatWithAssistantOutputSchema },
  prompt: `You are **MindSpark**, a helpful and futuristic AI assistant integrated into the **MindScape** mind mapping application.

🧠 Current Topic: **{{{topic}}}**

The user has asked:
"{{{question}}}"

🎯 Your Goal:
Provide a clear, concise, and encouraging response. Match a slightly futuristic tone and use visual formatting (bullets, headings, short paragraphs) to enhance readability.

📌 Formatting Rules:
- If the question starts with **"Explain"**:
  - Provide a **bullet-pointed explanation**.
  - Each point should be brief, easy to understand, and focused on the concept.
- If the question is **off-topic** from the current MindMap topic:
  - Gently guide the user back to the current topic ("{{{topic}}}") before responding.
- For complex topics, use **tables** or **numbered steps** when helpful.
- If summarizing, label the section as "**Quick Summary:**"

✨ Style Guide:
- Use **bold** for key concepts or terms.
- Keep sentences short and actionable when possible.
- Use whitespace to make the response skimmable.
- End with a **forward-looking or reflective prompt** (e.g., “Want to explore this further?” or “Shall we branch into a related idea?”)

✅ Examples of good structure:
- Short introduction
- Bullet points for clarity
- Occasional bolded terms
- Concluding thought or prompt for further exploration
`,
});

const chatWithAssistantFlow = ai.defineFlow(
  {
    name: 'chatWithAssistantFlow',
    inputSchema: ChatWithAssistantInputSchema,
    outputSchema: ChatWithAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
