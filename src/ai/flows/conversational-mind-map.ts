
'use server';
/**
 * @fileOverview A conversational AI flow for building a mind map step-by-step.
 *
 * - conversationalMindMap - A function that handles the conversational turns.
 */

import { ai } from '@/ai/genkit';
import {
  ConversationalMindMapInput,
  ConversationalMindMapInputSchema,
  ConversationalMindMapOutput,
  ConversationalMindMapOutputSchema,
} from '@/ai/schemas/conversational-mind-map-schema';

import { generateContentWithCustomKey } from '@/ai/custom-client';

export async function conversationalMindMap(
  input: ConversationalMindMapInput
): Promise<ConversationalMindMapOutput> {
  if (input.apiKey) {
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

    return generateContentWithCustomKey(input.apiKey, systemPrompt, userPrompt);
  }
  return conversationalMindMapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'conversationalMindMapPrompt',
  input: { schema: ConversationalMindMapInputSchema },
  output: { schema: ConversationalMindMapOutputSchema },
  prompt: `You are MindSpark, a friendly and brilliant AI assistant helping a user build a mind map.

Your Goal: Guide the user through a conversation to define a mind map topic and its structure. Ask clarifying questions one at a time. When the user is ready, generate the final mind map JSON.

Current Conversation History (for context):
{{#each history}}
  - {{this.role}}: {{this.content}}
{{/each}}

User's Latest Message: "{{message}}"

---
**RULES:**

1.  **Initial Turn**: If the history is empty or the user just said hello, you must start by asking for the main topic.
    - Your response should be welcoming (e.g., "Of course! What main topic are you interested in exploring?").
    - You **MUST** provide 3 creative, diverse, and interesting suggestions for a mind map topic. Ensure these suggestions are different each time this prompt is called. Examples could include "The History of Jazz," "The Science of Sleep," or "Beginner's Guide to Investing."

2.  **Conversational Turns**:
    - Ask **one** clear question at a time to build upon the topic. (e.g., "Great! What are some key sub-topics you'd like to include under 'Artificial Intelligence'?")
    - Always provide 2-4 short, clickable suggestions to guide the user.
    - Keep your response concise and encouraging.
    - **Do NOT** set \`isFinal\` to \`true\` during the conversation.

3.  **Finalization Step**:
    - This step is triggered only if the user's message is exactly "FINALIZE_MIND_MAP".
    - When you receive "FINALIZE_MIND_MAP":
        - You **MUST** set \`isFinal\` to \`true\`.
        - The \`response\` field should be a simple confirmation message (e.g., "Great! I've created your mind map. Redirecting you now...").
        - **IMPORTANT**: Act as an expert on the identified topic. Use the conversation to understand the user's core interests, but do not be limited by them. Your goal is to create a rich, comprehensive, and insightful mind map.
        - The generated \`mindMap\` **MUST** be well-structured and multi-layered. It should include the key points from the conversation, but also expand upon them with other relevant content.
        - The final \`mindMap\` must be comprehensive, including at least 4-5 sub-topics. Each sub-topic should contain 3-4 categories, and each category should have 4-5 sub-categories.
        - Every sub-category **MUST** have a 'tags' array containing 2-3 relevant keywords.
        - The final \`mindMap\` field **MUST** be populated with a valid JSON object matching the MindMapSchema.
        - Do not provide suggestions in the final step.
`,
});

const conversationalMindMapFlow = ai.defineFlow(
  {
    name: 'conversationalMindMapFlow',
    inputSchema: ConversationalMindMapInputSchema,
    outputSchema: ConversationalMindMapOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
