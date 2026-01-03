import { z } from 'zod';

export const QuizQuestionSchema = z.object({
    id: z.string().describe('Unique identifier for the question'),
    question: z.string().describe('The question text'),
    options: z.array(z.string()).min(4).max(4).describe('Four possible answers'),
    correctAnswer: z.string().describe('The exact string of the correct answer'),
    explanation: z.string().describe('A brief explanation of why this answer is correct'),
});

export const QuizSchema = z.object({
    topic: z.string().describe('The topic of the quiz'),
    questions: z.array(QuizQuestionSchema).min(5).max(10).describe('A list of 5-10 multiple choice questions'),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
