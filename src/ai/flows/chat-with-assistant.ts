
'use server';

/**
 * @fileOverview A conversational AI assistant for answering user questions.
 *
 * - chatWithAssistant - A function that handles the chat conversation.
 * - ChatWithAssistantInput - The input type for the chatWithAssistant function.
 * - ChatWithAssistantOutput - The return type for the chatWithAssistant function.
 */

import { z } from 'zod';
import { generateSearchContext } from '@/app/actions/generateSearchContext';

const ChatWithAssistantInputSchema = z.object({
  question: z.string().describe("The user's question."),
  topic: z
    .string()
    .describe(
      'The current mind map topic, providing context for the conversation.'
    ),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional()
    .describe('Previous chat history to provide context.'),
  persona: z
    .enum(['Standard', 'Teacher', 'Concise', 'Creative'])
    .optional()
    .default('Standard')
    .describe('The personality/style of the AI assistant.'),
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

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

export async function chatWithAssistant(
  input: ChatWithAssistantInput & { apiKey?: string; provider?: AIProvider }
): Promise<ChatWithAssistantOutput> {
  const { provider, apiKey, topic, persona, history, question } = input;

  // Generate search context for real-time information
  // ALWAYS inject current date, search sources are optional
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let searchSection = `

📅 **Current Date**: ${currentDate}
`;

  try {
    console.log('🔍 Generating search context for chat question...');
    const searchResult = await generateSearchContext({
      query: question,
      depth: 'basic',
      apiKey,
      provider,
    });

    if (searchResult.data && searchResult.data.sources.length > 0) {
      const searchContext = searchResult.data;

      searchSection += `

🌐 **Real-Time Web Information**:
${searchContext.summary}

IMPORTANT: Use this current information to ground your response. Prefer facts from these search results over your training data.
`;
      console.log(`✅ Search context added to chat with ${searchContext.sources.length} sources`);
    } else {
      console.log(`ℹ️ No search sources found, but current date injected`);
    }
  } catch (error) {
    console.warn('⚠️ Search failed for chat, continuing with current date only:', error);
  }

  const historyText = history?.map(h => `- **${h.role}**: ${h.content}`).join('\n') || '';

  const systemPrompt = `You are **MindSpark** ✨, a helpful and futuristic AI assistant integrated into the **MindScape** mind mapping application.

🚀 **LIVE ACCESS ENABLED**: You have active access to real-time Google Search results and current date information. Never claim you cannot access current events or real-time data.

🧠 **Current Topic**: ${topic}
🎭 **Current Persona**: ${persona}
${searchSection}

${historyText ? `**Chat History**:\n${historyText}` : ''}

**User Question**:
"${question}"

---

## 🎯 Your Mission
Provide clear, engaging, and visually structured responses based on the MOST RECENT information available in the search results above.

## 🎭 Persona Instructions

**Current Persona Mode**: ${persona}

Adjust your response style based on the persona (BE CAREFUL with casing):
- **Teacher**: Explain concepts simply with analogies and examples. Be patient and encouraging. Break down complex ideas into steps.
- **Concise**: Be brief and direct. Use bullet points. Avoid fluff. Focus on the "what" and "how".
- **Creative**: Be imaginative and brainstorm ideas. Use colorful language and metaphors. Suggest out-of-the-box connections.
- **Standard**: Balanced, helpful, and professional with clear structure and moderate detail.

## 📋 Formatting Guidelines (Use Markdown)
- Start with a brief intro.
- Use bullet points and bold text for readability.
- Use tables for comparisons.
- **CRITICAL**: DO NOT include any URLs, links, or web addresses (e.g., [link](url)) in your response.
- Be encouraging and positive.

The output MUST be a valid JSON object with the following structure:
{
  "answer": "Your formatted markdown response here"
}

IMPORTANT: Return ONLY the raw JSON object, no other text or explanation.`;

  const userPrompt = "Provide your response.";

  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await generateContent({
        provider,
        apiKey,
        systemPrompt,
        userPrompt,
        schema: ChatWithAssistantOutputSchema,
      });

      return result;
    } catch (e: any) {
      lastError = e;
      console.error(`❌ Chat attempt ${attempt} failed:`, e.message);
      if (attempt === maxAttempts) throw e;
      await new Promise(res => setTimeout(res, 1000));
    }
  }

  throw lastError || new Error('Chat generation failed');
}


