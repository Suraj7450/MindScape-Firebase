
/**
 * @fileOverview Zod schemas and TypeScript types for the conversational mind map flow.
 */

import { z } from 'zod';
import { MindMapSchema } from '../mind-map-schema';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const ConversationalMindMapInputSchema = z.object({
  history: z
    .array(ChatMessageSchema)
    .describe('The history of the conversation so far.'),
  message: z.string().describe("The user's latest message."),
  apiKey: z.string().optional().describe('Optional custom API key to use for this request.'),
});
export type ConversationalMindMapInput = z.infer<
  typeof ConversationalMindMapInputSchema
>;

export const ConversationalMindMapOutputSchema = z.object({
  response: z.string().describe("The AI's conversational response."),
  suggestions: z
    .array(z.string())
    .optional()
    .describe('A list of 2-4 suggested replies for the user.'),
  isFinal: z
    .boolean()
    .optional()
    .describe('Set to true only when the mind map is complete.'),
  mindMap: MindMapSchema.optional().describe(
    'The final mind map JSON object, provided only when isFinal is true.'
  ),
});
export type ConversationalMindMapOutput = z.infer<
  typeof ConversationalMindMapOutputSchema
>;
