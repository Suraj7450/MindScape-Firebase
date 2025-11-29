
'use server';

/**
 * @fileOverview Translates text using the MyMemory API.
 *
 * - translateText - A function that handles the translation.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLang: z.string().describe('The target language code (e.g., "es").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

// This tool will call the MyMemory Translation API
const translateWithMyMemory = ai.defineTool(
  {
    name: 'translateWithMyMemory',
    description: 'Translates text to a target language.',
    inputSchema: z.object({
      text: z.string(),
      targetLang: z.string(),
    }),
    outputSchema: z.object({ translatedText: z.string() }),
  },
  async (input) => {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      input.text
    )}&langpair=en|${input.targetLang}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.responseStatus !== 200) {
        throw new Error(`Translation API error: ${data.responseDetails}`);
      }
      
      return { translatedText: data.responseData.translatedText };
    } catch (error) {
      console.error("MyMemory API error:", error);
      // Return a structured error that the flow can handle
      throw new Error("Failed to fetch translation from the external service.");
    }
  }
);


const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    // Directly call the tool as the main logic of this flow.
    // This abstracts the external API call into a reusable tool.
    const translation = await translateWithMyMemory(input);
    return translation;
  }
);
