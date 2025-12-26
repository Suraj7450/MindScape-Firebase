
'use server';

/**
 * @fileOverview Generates a quiz based on a mind map.
 *
 * - generateQuiz - A function that generates the quiz.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateQuizInputSchema = z.object({
  mindMapData: z.any().describe('The JSON object of the mind map.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question.'),
  options: z.array(z.string()).describe('A list of 4 possible answers.'),
  correctAnswerIndex: z
    .number()
    .min(0)
    .max(3)
    .describe('The index of the correct answer in the options array.'),
  explanation: z
    .string()
    .describe('A brief explanation for why the answer is correct.'),
});

const GenerateQuizOutputSchema = z.object({
  questions: z
    .array(QuizQuestionSchema)
    .describe('An array of 5-10 quiz questions.'),
});

export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

// Simplified to always use client-dispatcher
export async function generateQuiz(
  input: GenerateQuizInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<GenerateQuizOutput> {
  const { provider, apiKey, mindMapData, strict } = input;
  const mindMapDataString = JSON.stringify(mindMapData, null, 2);
  const systemPrompt = `You are an expert in creating educational quizzes.
  
    Based on the provided mind map data, generate a challenging and informative multiple-choice quiz with 5 to 10 questions.
    Each question should have exactly 4 options.
    For each question, provide the correct answer's index and a brief explanation for why it's correct.
  
    The output MUST be a valid JSON object with the following structure:
    {
      "questions": [
        {
          "question": "The question text",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswerIndex": 0,
          "explanation": "Why this is correct"
        }
      ]
    }
  
    Mind Map Data:
    ${mindMapDataString}`;

  const userPrompt = "Generate the quiz JSON.";

  const rawResult = await generateContent({
    provider,
    apiKey,
    systemPrompt,
    userPrompt,
    strict
  });

  // Normalize
  const normalized = {
    questions: Array.isArray(rawResult?.questions) ? rawResult.questions : []
  };

  try {
    const validated = GenerateQuizOutputSchema.parse(normalized);
    return validated;
  } catch (e: any) {
    console.error("Quiz schema validation failed:", e);
    return normalized as GenerateQuizOutput;
  }
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: { schema: z.object({ mindMapDataString: z.string() }) },
  output: { schema: GenerateQuizOutputSchema },
  prompt: `You are an expert in creating educational quizzes.

  Based on the provided mind map data, generate a challenging and informative multiple-choice quiz with 5 to 10 questions.
  Each question should have exactly 4 options.
  For each question, provide the correct answer's index and a brief explanation for why it's correct.

  Mind Map Data:
  {{{mindMapDataString}}}
  `,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async ({ mindMapData }) => {
    const { output } = await prompt({
      mindMapDataString: JSON.stringify(mindMapData, null, 2),
    });
    return output!;
  }
);
