import { z } from 'zod';
import { QuizSchema } from '../schemas/quiz-schema';
import { generateContent } from '../client-dispatcher';

export const RegenerateQuizInputSchema = z.object({
    topic: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    weakAreas: z.array(z.string()).describe('List of conceptTags where the user struggled'),
    otherAreas: z.array(z.string()).optional().describe('Other conceptTags from the original quiz'),
    previousQuestions: z.array(z.string()).optional().describe('List of question texts to avoid repetitions'),
});

export type RegenerateQuizInput = z.infer<typeof RegenerateQuizInputSchema>;

// Plain async function bypassing Genkit
export async function regenerateQuizFlow(input: RegenerateQuizInput): Promise<any> {
    console.log('🔄 regenerateQuizFlow called with:', input);
    const { topic, difficulty, weakAreas, otherAreas, previousQuestions } = input;

    const systemPrompt = `You are generating an ADAPTIVE follow-up quiz for MindScape.
    
    CRITICAL: You MUST return a JSON object with this EXACT structure:
    {
      "topic": "${topic}",
      "difficulty": "${difficulty}",
      "questions": [
        {
          "id": "unique-id",
          "question": "question text",
          "options": [
            {"id": "A", "text": "option text"},
            {"id": "B", "text": "option text"},
            {"id": "C", "text": "option text"},
            {"id": "D", "text": "option text"}
          ],
          "correctOptionId": "A" | "B" | "C" | "D",
          "conceptTag": "specific sub-topic",
          "explanation": "why the answer is correct"
        }
      ]
    }
    
    Special Instructions:
    - Focus heavily (approx 70%) on reinforcing the user's weak areas: ${weakAreas.join(', ')}.
    - Include some mixed content (approx 30%) from other related areas: ${otherAreas?.join(', ') || 'General aspects of the topic'}.
    - Do NOT repeat any of these previous questions: ${previousQuestions?.join(' | ') || 'None'}.
    - Ensure the quiz is focused on learning reinforcement and clarification of misconceptions.
    - Generate 5-10 questions.
    - Return ONLY the JSON object, no wrapper, no extra fields.`;

    const userPrompt = `Topic: "${topic}"
    Difficulty: ${difficulty}
    Primary Focus (Weak Areas): ${weakAreas.join(', ')}
    
    Generate a new, unique follow-up quiz now that helps reinforce these weak areas.`;

    const output = await generateContent({
        provider: 'pollinations',
        systemPrompt,
        userPrompt,
        schema: QuizSchema,
    });

    if (!output) {
        throw new Error('AI failed to generate an adaptive quiz.');
    }

    // Transform if the AI returned {quiz: [...]} instead of {topic, difficulty, questions: [...]}
    if (output.quiz && Array.isArray(output.quiz) && !output.questions) {
        console.log('🔄 Transforming regenerate quiz response from {quiz: [...]} to correct format');

        const firstQuestion = output.quiz[0];
        const extractedDifficulty = firstQuestion?.difficulty || difficulty;

        return {
            topic,
            difficulty: extractedDifficulty,
            questions: output.quiz.map((q: any, index: number) => ({
                id: q.id || `q${index + 1}`,
                question: q.question,
                options: Array.isArray(q.options)
                    ? q.options.map((opt: string, i: number) => ({
                        id: ['A', 'B', 'C', 'D'][i],
                        text: opt.replace(/^[A-D]\)\s*/, '')
                    }))
                    : q.options,
                correctOptionId: q.correctOptionId || q.answer?.charAt(0) || 'A',
                conceptTag: q.conceptTag || topic,
                explanation: q.explanation || `The correct answer is ${q.answer || q.correctOptionId}`
            }))
        };
    }

    return output;
}
