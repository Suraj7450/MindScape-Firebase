import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { QuizSchema } from '../schemas/quiz-schema';

export const GenerateQuizInputSchema = z.object({
    topic: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    mindMapContext: z.string().optional().describe('Text representation of the mind map nodes and structure'),
});

export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

export const generateQuizFlow = ai.defineFlow(
    {
        name: 'generateQuizFlow',
        inputSchema: GenerateQuizInputSchema,
        outputSchema: QuizSchema,
    },
    async (input) => {
        const { topic, difficulty, mindMapContext } = input;

        const systemPrompt = `You are an educational assessment generator for MindScape, an adaptive learning platform.
    Your goal is to generate a high-quality, multiple-choice quiz that helps users master a topic.
    
    Rules:
    - Generate strictly 5-10 questions.
    - Each question MUST have exactly 4 options (A, B, C, D).
    - Provide a "conceptTag" for each question that identifies the specific sub-topic or skill (e.g., "Auto Layout", "Hooks").
    - If mindMapContext is provided, ground the questions in that specific hierarchy.
    - Ensure difficulty level "${difficulty}" is strictly followed.
    - Return ONLY valid JSON matching the schema.`;

        const userPrompt = `Generate a ${difficulty} quiz for the topic: "${topic}".
    ${mindMapContext ? `Use the following mind map structure for context:\n${mindMapContext}` : ''}
    
    Make sure the conceptTags are concise and consistent so we can track performance across those tags.`;

        const { output } = await ai.generate({
            system: systemPrompt,
            prompt: userPrompt,
            output: { schema: QuizSchema },
        });

        if (!output) {
            throw new Error('AI failed to generate a valid quiz.');
        }

        return output;
    }
);
