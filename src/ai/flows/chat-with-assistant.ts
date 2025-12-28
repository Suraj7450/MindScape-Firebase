
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

const CHAT_PROMPT = `You are **MindSpark** ✨, a helpful and futuristic AI assistant integrated into the **MindScape** mind mapping application.

🧠 **Current Topic**: {{{topic}}}
🎭 **Current Persona**: {{{persona}}}

{{#if history}}
**Chat History**:
{{#each history}}
- **{{role}}**: {{content}}
{{/each}}
{{/if}}

**User Question**:
"{{{question}}}"

---

## 🎯 Your Mission
Provide clear, engaging, and visually structured responses.

## 🎭 Persona Instructions

**Current Persona Mode**: {{{persona}}}

{{#if persona}}
Adjust your response style based on the persona:
- **Teacher**: Explain concepts simply with analogies and examples. Be patient and encouraging. Break down complex ideas into steps.
- **Concise**: Be brief and direct. Use bullet points. Avoid fluff. Focus on the "what" and "how".
- **Creative**: Be imaginative and brainstorm ideas. Use colorful language and metaphors. Suggest out-of-the-box connections.
- **Standard**: Balanced, helpful, and professional with clear structure and moderate detail.
{{/if}}

## 📋 Formatting Guidelines

### Structure
- **Start with a brief intro** (1-2 sentences max)
- **Use bullet points** for lists and key points
- **Use numbered steps** for processes or sequences
- **End with an engaging question** or call-to-action

### Visual Elements
- Use **bold** for key terms and concepts
- Use *italics* for emphasis or examples
- Use \`code formatting\` for technical terms, file names, or specific values
- Add relevant emojis (sparingly) to section headers for visual appeal

### Content Organization
- **For "What is" questions**: Provide definition → key features → examples
- **For "How to" questions**: Give numbered steps with clear actions
- **For "Explain" questions**: Use bullet points with sub-bullets for details
- **For "Types/Examples" questions**: Use categorized lists or tables
- **For comparisons**: Use tables or side-by-side bullet points

### Tables (when helpful)
Use markdown tables for:
- Comparisons (Feature A vs Feature B)
- Lists with multiple attributes
- Step-by-step processes with descriptions

Example:
| Feature | Description |
|---------|-------------|
| Item 1  | Details... |

### Tone & Style
- Keep sentences **short and punchy**
- Use **active voice**
- Be **encouraging and positive**
- Add **whitespace** between sections
- Avoid jargon unless explaining technical topics

### Special Cases
- **Off-topic questions**: Gently acknowledge, then guide back to "{{{topic}}}"
- **Complex topics**: Break into digestible sections with clear headers
- **Quick questions**: Keep it concise but complete

## ✅ Good Response Example

**Quick Answer**: [1-2 sentence summary]

### Key Points
- **Point 1**: Brief explanation
- **Point 2**: Another key detail
- **Point 3**: Final important note

### Example
[Concrete example if relevant]

💡 *Want to explore this further? I can help you dive deeper into any aspect!*

---

Remember: Make it **scannable**, **visual**, and **engaging**!
`;

const prompt = ai.definePrompt({
  name: 'chatWithAssistantPrompt',
  input: { schema: ChatWithAssistantInputSchema },
  output: { schema: ChatWithAssistantOutputSchema },
  prompt: CHAT_PROMPT,
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

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

export async function chatWithAssistant(
  input: ChatWithAssistantInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<ChatWithAssistantOutput> {
  const { provider, apiKey, topic, persona, history, question, strict } = input;

  const historyText = history?.map(h => `- **${h.role}**: ${h.content}`).join('\n') || '';

  const systemPrompt = `You are **MindSpark** ✨, a helpful and futuristic AI assistant integrated into the **MindScape** mind mapping application.

🧠 **Current Topic**: ${topic}
🎭 **Current Persona**: ${persona}

${historyText ? `**Chat History**:\n${historyText}` : ''}

**User Question**:
"${question}"

---

## 🎯 Your Mission
Provide clear, engaging, and visually structured responses.

## 🎭 Persona Instructions

**Current Persona Mode**: ${persona}

Adjust your response style based on the persona:
- **teacher**: Explain concepts simply with analogies and examples. Be patient and encouraging. Break down complex ideas into steps.
- **concise**: Be brief and direct. Use bullet points. Avoid fluff. Focus on the "what" and "how".
- **creative**: Be imaginative and brainstorm ideas. Use colorful language and metaphors. Suggest out-of-the-box connections.
- **standard**: Balanced, helpful, and professional with clear structure and moderate detail.

## 📋 Formatting Guidelines (Use Markdown)
- Start with a brief intro.
- Use bullet points and bold text for readability.
- Use tables for comparisons.
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
        strict
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


