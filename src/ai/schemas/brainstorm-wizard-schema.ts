
import { z } from 'zod';
import { MindMapSchema, AIGeneratedMindMapSchema } from '../mind-map-schema';

import { SearchContextSchema } from '../search/search-schema';

export const BrainstormAspectSchema = z.object({
    name: z.string().describe('The name of the aspect (e.g., "Historical Context")'),
    description: z.string().describe('A brief, high-level description'),
    icon: z.string().describe('A Lucide icon name'),
});

export const BrainstormCategorySchema = z.object({
    name: z.string().describe('The name of the category'),
    description: z.string().describe('A detailed description of the category'),
    icon: z.string().describe('A Lucide icon name'),
});

export const BrainstormOutputTypeSchema = z.enum([
    'mindmap',
    'roadmap',
    'dossier',
    'pitch',
    'quiz',
    'premortem',
    'social'
]);

export type BrainstormOutputType = z.infer<typeof BrainstormOutputTypeSchema>;

export const BrainstormWizardInputSchema = z.object({
    step: z.enum(['GET_ASPECTS', 'GET_CATEGORIES', 'FINALIZE']),
    topic: z.string(),
    selectedAspects: z.array(z.string()).optional(),
    currentAspect: z.string().optional(),
    language: z.string().default('en'),
    depth: z.enum(['low', 'medium', 'deep']).optional(),
    selections: z.record(z.string(), z.array(z.string())).optional().describe('Map of selected aspects to their selected categories'),
    outputType: BrainstormOutputTypeSchema.optional().default('mindmap'),
    searchContext: SearchContextSchema.optional().describe('Context from real-time search'),
});

export const BrainstormWizardOutputSchema = z.discriminatedUnion('step', [
    z.object({
        step: z.literal('GET_ASPECTS'),
        aspects: z.array(BrainstormAspectSchema),
    }),
    z.object({
        step: z.literal('GET_CATEGORIES'),
        categories: z.array(BrainstormCategorySchema),
    }),
    z.object({
        step: z.literal('FINALIZE'),
        mindMap: AIGeneratedMindMapSchema.optional(),
        // New Studio Outputs
        content: z.string().optional().describe('Markdown or text content for Dossier, Pitch, or Premortem'),
        quiz: z.object({
            questions: z.array(z.object({
                question: z.string(),
                options: z.array(z.string()),
                answerIndex: z.number().describe('Zero-based index of the correct option'),
                answer: z.string().optional().describe('Deprecated: String answer for backward compatibility')
            })),
            flashcards: z.array(z.object({
                front: z.string(),
                back: z.string()
            }))
        }).optional(),
        social: z.array(z.object({
            platform: z.string(),
            content: z.string(),
            purpose: z.string()
        })).optional(),
    }),
]);

export type BrainstormWizardInput = z.infer<typeof BrainstormWizardInputSchema>;
export type BrainstormWizardOutput = z.infer<typeof BrainstormWizardOutputSchema>;
