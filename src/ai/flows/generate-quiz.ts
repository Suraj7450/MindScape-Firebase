'use server';

import { z } from 'zod';
import { QuizSchema } from '@/ai/schemas/quiz-schema';
import { generateContent, AIProvider } from '@/ai/client-dispatcher';

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The main topic for the quiz.'),
  mindMapData: z.any().optional().describe('Optional mind map data to provide more context for the quiz.'),
  targetLang: z.string().optional().describe('The target language for the quiz content (e.g., "es").'),
  count: z.number().optional().default(5).describe('Number of questions to generate.'),
});

export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

export async function generateQuiz(
  input: GenerateQuizInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<z.infer<typeof QuizSchema>> {
  const { topic, mindMapData, targetLang, count, provider, apiKey, strict } = input;

  const prompt = `You are an expert educator creating a quiz to test a student's knowledge on a specific topic.

  TOPIC: "${topic}"
  ${mindMapData ? `CONTEXT DATA (Mind Map Summary): 
  - Topic: ${mindMapData.topic}
  - Summary: ${mindMapData.summary || 'N/A'}
  - Sub-topics: ${mindMapData.subTopics?.map((st: any) => `${st.name} (${st.categories?.map((c: any) => c.name).join(', ')})`).join('; ')}` : ''}

  TASK:
  Generate a high-quality, challenging but fair multiple-choice quiz with exactly ${count} questions.
  Each question must have 4 options, one correct answer, and a clear explanation for the correct answer.

  ${targetLang ? `The entire quiz content MUST be in the following language: ${targetLang}.` : 'The entire quiz content MUST be in English.'}

  RULES:
  1. Questions should cover different aspects of the topic.
  2. Options should be plausible but distinct.
  3. The explanation should be informative and help the student learn.
  4. Ensure the output is a valid JSON object matching the QuizSchema.
  5. Do NOT include markdown formatting.

  OUTPUT STRUCTURE:
  {
    "topic": "${topic}",
    "questions": [
      {
        "id": "q1",
        "question": "...",
        "options": ["...", "...", "...", "..."],
        "correctAnswer": "...",
        "explanation": "..."
      },
      ...
    ]
  }

  Generate the quiz now.`;

  const result = await generateContent({
    provider,
    apiKey,
    systemPrompt: "System: High-quality educational quiz generator. Output MUST be strictly valid JSON.",
    userPrompt: prompt,
    schema: QuizSchema,
    strict
  });

  return result;
}
