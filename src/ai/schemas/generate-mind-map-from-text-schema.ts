
/**
 * @fileOverview Zod schemas and TypeScript types for the text-to-mind-map generation flow.
 */

import { z } from 'zod';
import { MindMapSchema } from '@/ai/mind-map-schema';

export const GenerateMindMapFromTextInputSchema = z.object({
  text: z
    .string()
    .describe('A block of text, such as from a document or notes.'),
  context: z
    .string()
    .optional()
    .describe('Optional additional context or instructions from the user.'),
  targetLang: z
    .string()
    .optional()
    .describe('The target language for the mind map content (e.g., "es").'),
});
export type GenerateMindMapFromTextInput = z.infer<
  typeof GenerateMindMapFromTextInputSchema
>;

export const GenerateMindMapFromTextOutputSchema = MindMapSchema;
export type GenerateMindMapFromTextOutput = z.infer<
  typeof GenerateMindMapFromTextOutputSchema
>;
