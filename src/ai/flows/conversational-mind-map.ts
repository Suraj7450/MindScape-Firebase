
'use server';
/**
 * @fileOverview A conversational AI flow for building a mind map step-by-step.
 *
 * - conversationalMindMap - A function that handles the conversational turns.
 */

import {
  ConversationalMindMapInput,
  ConversationalMindMapInputSchema,
  ConversationalMindMapOutput,
  ConversationalMindMapOutputSchema,
} from '@/ai/schemas/conversational-mind-map-schema';

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

export async function conversationalMindMap(
  input: ConversationalMindMapInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<ConversationalMindMapOutput> {
  const { provider, apiKey, strict } = input;

  const historyText = input.history?.map(h => `- ${h.role}: ${h.content}`).join('\n') || '';

  const systemPrompt = `You are MindSpark, a friendly and brilliant AI assistant helping a user build a mind map.

  Your Goal: Guide the user through a conversation to define a mind map topic and its structure. Ask clarifying questions one at a time. When the user is ready, generate the final mind map JSON.
  
  Current Conversation History:
  ${historyText}
  
  User's Latest Message: "${input.message}"
  
  ---
  **RULES:**
  
  1.  **Initial Turn**: If the history is empty or the user just said hello, start by asking for the main topic. Provide 3 creative suggestions.
  
  2.  **Conversational Turns**:
      - Ask **one** clear question at a time.
      - Always provide 2-4 short, clickable suggestions.
      - Keep response concise.
      - Do NOT set "isFinal" to true yet.
  
  3.  **Finalization Step**:
      - Triggered ONLY if the user's message is exactly "FINALIZE_MIND_MAP".
      - When received:
          - Set "isFinal" to true.
          - "response" should be a confirmation message.
          - Populate "mindMap" with a comprehensive, multi-layered JSON structure (4-5 sub-topics, etc.).
          - Ensure "tags" are present.
          - Do not provide suggestions.
          
  Return valid JSON adhering to the schema.`;

  const userPrompt = input.message === "FINALIZE_MIND_MAP" ? "FINALIZE_MIND_MAP" : "Reply to the user.";

  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await generateContent({
        provider: provider,
        apiKey: apiKey,
        systemPrompt,
        userPrompt,
        schema: ConversationalMindMapOutputSchema,
        strict
      });

      return result;
    } catch (e: any) {
      lastError = e;
      console.error(`❌ Conversational turn attempt ${attempt} failed:`, e.message);
      if (attempt === maxAttempts) throw e;
      await new Promise(res => setTimeout(res, 1000));
    }
  }

  throw lastError || new Error('Conversational turn failed');
}
