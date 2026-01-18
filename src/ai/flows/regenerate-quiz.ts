import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { QuizSchema } from '../schemas/quiz-schema';

export const RegenerateQuizInputSchema = z.object({
    topic: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    weakAreas: z.array(z.string()).describe('List of conceptTags where the user struggled'),
    otherAreas: z.array(z.string()).optional().describe('Other conceptTags from the original quiz'),
    previousQuestions: z.array(z.string()).optional().describe('List of question texts to avoid repetitions'),
});

export type RegenerateQuizInput = z.infer<typeof RegenerateQuizInputSchema>;

export const regenerateQuizFlow = ai.defineFlow(
    {
        name: 'regenerateQuizFlow',
        inputSchema: RegenerateQuizInputSchema,
        outputSchema: QuizSchema,
    },
    async (input) => {
        const { topic, difficulty, weakAreas, otherAreas, previousQuestions } = input;

        const systemPrompt = `You are generating an ADAPTIVE follow-up quiz for MindScape.
    Special Instructions:
    - Focus heavily (approx 70%) on reinforcing the user's weak areas: ${weakAreas.join(', ')}.
    - Include some mixed content (approx 30%) from other related areas: ${otherAreas?.join(', ') || 'General aspect of the topic'}.
    - Do NOT repeat any of these previous questions: ${previousQuestions?.join(' | ') || 'None'}.
    - Ensure the quiz is focused on learning reinforcement and clarification of misconceptions.
    - Return ONLY valid JSON matching the schema.`;

        const userPrompt = `Topic: "${topic}"
    Difficulty: ${difficulty}
    Primary Focus (Weak Areas): ${weakAreas.join(', ')}
    
    Generate a new, unique follow-up quiz now.`;

        const { output } = await ai.generate({
            system: systemPrompt,
            prompt: userPrompt,
            output: { schema: QuizSchema },
        });

        if (!output) {
            throw new Error('AI failed to generate an adaptive quiz.');
        }

        return output;
    }
);
