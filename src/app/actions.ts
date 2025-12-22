
'use server';
import { AIProvider } from '@/ai/client-dispatcher';
import {
  generateMindMap,
  GenerateMindMapOutput,
  GenerateMindMapInput,
} from '@/ai/flows/generate-mind-map';
import {
  generateMindMapFromImage,
  GenerateMindMapFromImageOutput,
} from '@/ai/flows/generate-mind-map-from-image';
import { generateMindMapFromText } from '@/ai/flows/generate-mind-map-from-text';
import type {
  GenerateMindMapFromTextInput,
  GenerateMindMapFromTextOutput,
} from '@/ai/schemas/generate-mind-map-from-text-schema';
import {
  explainMindMapNode,
  ExplainMindMapNodeInput,
  ExplainMindMapNodeOutput,
} from '@/ai/flows/explain-mind-map-node';
import {
  generateQuiz,
  GenerateQuizOutput,
  GenerateQuizInput,
} from '@/ai/flows/generate-quiz';
import {
  chatWithAssistant,
  ChatWithAssistantInput,
  ChatWithAssistantOutput,
} from '@/ai/flows/chat-with-assistant';
import {
  translateMindMap,
  TranslateMindMapInput,
  TranslateMindMapOutput,
} from '@/ai/flows/translate-mind-map';
import {
  generateComparisonMap,
  GenerateComparisonMapInput,
  GenerateComparisonMapOutput,
} from '@/ai/flows/generate-comparison-map';
import {
  explainWithExample,
  ExplainWithExampleInput,
  ExplainWithExampleOutput,
} from '@/ai/flows/explain-with-example';
import { summarizeChat } from '@/ai/flows/summarize-chat';
import type {
  SummarizeChatInput,
  SummarizeChatOutput,
} from '@/ai/schemas/summarize-chat-schema';
import { conversationalMindMap } from '@/ai/flows/conversational-mind-map';
import type {
  ConversationalMindMapInput,
  ConversationalMindMapOutput,
} from '@/ai/schemas/conversational-mind-map-schema';
import {
  enhanceImagePrompt,
  EnhanceImagePromptInput,
  EnhanceImagePromptOutput,
} from '@/ai/flows/enhance-image-prompt';
import {
  summarizeMindMap,
  SummarizeMindMapInput,
  SummarizeMindMapOutput,
} from '@/ai/flows/summarize-mind-map';
import {
  expandNode,
  ExpandNodeInput,
  ExpandNodeOutput,
} from '@/ai/flows/expand-node';
import { addDoc, collection } from 'firebase/firestore';

export interface GenerateMindMapFromImageInput {
  imageDataUri: string;
  targetLang?: string;
  persona?: string;
}

/**
 * Server action to generate a mind map based on a given topic.
 * @param {GenerateMindMapInput} input - The input for the mind map generation, containing the topic.
 * @returns {Promise<{ data: GenerateMindMapOutput | null; error: string | null }>} An object with either the generated mind map data or an error message.
 */
export async function generateMindMapAction(
  input: GenerateMindMapInput,
  options: { apiKey?: string; provider?: AIProvider; strict?: boolean } = { provider: 'pollinations' }
): Promise<{ data: GenerateMindMapOutput | null; error: string | null }> {
  // Ensure input.topic is treated as a plain string
  const topic = String(input.topic);

  if (!topic || topic.length < 1) {
    return { data: null, error: 'Topic must be at least 1 character long.' };
  }

  try {
    const result = await generateMindMap({ ...input, topic, ...options });
    return { data: result, error: null };
  } catch (error) {
    console.error('Error in generateMindMapAction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      data: null,
      error: `Failed to generate mind map: ${errorMessage}`,
    };
  }
}

/**
 * Server action to generate a mind map from an image.
 * @param {GenerateMindMapFromImageInput} input - The input containing the image data URI.
 * @returns {Promise<{ data: GenerateMindMapFromImageOutput | null; error: string | null }>} An object with the generated map or an error.
 */
export async function generateMindMapFromImageAction(
  input: GenerateMindMapFromImageInput,
  options: { apiKey?: string; provider?: AIProvider; strict?: boolean } = { provider: 'pollinations' }
): Promise<{ data: GenerateMindMapFromImageOutput | null; error: string | null }> {
  if (!input.imageDataUri) {
    return { data: null, error: 'Image data URI is required.' };
  }

  try {
    const result = await generateMindMapFromImage({ ...input, ...options });
    return { data: result, error: null };
  } catch (error) {
    console.error('Error in generateMindMapFromImageAction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      data: null,
      error: `Failed to generate mind map from image: ${errorMessage}`,
    };
  }
}

/**
 * Server action to generate a mind map from a block of text.
 * @param {GenerateMindMapFromTextInput} input - The input containing the text.
 * @returns {Promise<{ data: GenerateMindMapFromTextOutput | null; error: string | null }>} An object with the generated map or an error.
 */
export async function generateMindMapFromTextAction(
  input: GenerateMindMapFromTextInput,
  options: { apiKey?: string; provider?: AIProvider; strict?: boolean } = { provider: 'pollinations' }
): Promise<{ data: GenerateMindMapFromTextOutput | null; error: string | null }> {
  if (!input.text || input.text.trim().length < 10) {
    return { data: null, error: 'Text content is too short to generate a mind map.' };
  }

  try {
    const result = await generateMindMapFromText({ ...input, ...options });
    return { data: result, error: null };
  } catch (error) {
    console.error('Error in generateMindMapFromTextAction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      data: null,
      error: `Failed to generate mind map from text: ${errorMessage}`,
    };
  }
}

/**
 * Server action to generate a comparison mind map between two topics.
 * @param {GenerateComparisonMapInput} input - The input for the comparison map generation.
 * @returns {Promise<{ data: GenerateComparisonMapOutput | null; error: string | null }>} An object with the generated map or an error.
 */
export async function generateComparisonMapAction(
  input: GenerateComparisonMapInput,
  options: { apiKey?: string; provider?: AIProvider; strict?: boolean } = { provider: 'pollinations' }
): Promise<{ data: GenerateComparisonMapOutput | null; error: string | null }> {
  if (!input.topic1 || input.topic1.length < 1 || !input.topic2 || input.topic2.length < 1) {
    return { data: null, error: 'Both topics must be at least 1 character long.' };
  }

  try {
    const result = await generateComparisonMap({ ...input, ...options });
    return { data: result, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      data: null,
      error: `Failed to generate comparison map. ${errorMessage}`,
    };
  }
}


/**
 * Server action to get a detailed explanation for a specific node in a mind map.
 * @param {ExplainMindMapNodeInput} input - The input containing details about the node to be explained.
 * @returns {Promise<{ explanation: ExplainMindMapNodeOutput | null; error: string | null }>} An object with either the explanation content or an error message.
 */
export async function explainNodeAction(
  input: ExplainMindMapNodeInput,
  options: { apiKey?: string; provider?: AIProvider; strict?: boolean } = { provider: 'pollinations' }
): Promise<{ explanation: ExplainMindMapNodeOutput | null; error: string | null }> {
  try {
    const result = await explainMindMapNode({ ...input, ...options });
    return { explanation: result, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      explanation: null,
      error: `Failed to get explanation. ${errorMessage}`,
    };
  }
}

/**
 * Server action to generate a quiz based on the mind map data.
 * @param {GenerateQuizInput} input - The input containing the mind map data.
 * @returns {Promise<{ quiz: GenerateQuizOutput | null; error: string | null }>} An object with either the generated quiz or an error message.
 */
export async function generateQuizAction(
  input: GenerateQuizInput,
  options: { apiKey?: string; provider?: AIProvider; strict?: boolean } = { provider: 'pollinations' }
): Promise<{ quiz: GenerateQuizOutput | null; error: string | null }> {
  try {
    const result = await generateQuiz({ ...input, ...options });
    return { quiz: result, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      quiz: null,
      error: `Failed to generate quiz. ${errorMessage}`,
    };
  }
}

/**
 * Server action to handle a chat conversation with the AI assistant.
 * @param {ChatWithAssistantInput} input - The input containing the user's question and the current topic context.
 * @returns {Promise<{ response: ChatWithAssistantOutput | null; error: string | null }>} An object with either the chat response or an error message.
 */
/**
 * Server action to handle a chat conversation with the AI assistant.
 * @param {ChatWithAssistantInput} input - The input containing the user's question, topic, chat history, and persona.
 * @returns {Promise<{ response: ChatWithAssistantOutput | null; error: string | null }>} An object with either the chat response or an error message.
 */
export async function chatAction(
  input: ChatWithAssistantInput,
  options: { apiKey?: string; provider?: AIProvider; strict?: boolean } = { provider: 'pollinations' }
): Promise<{ response: ChatWithAssistantOutput | null; error: string | null }> {
  try {
    const result = await chatWithAssistant({ ...input, ...options });
    return { response: result, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      response: null,
      error: `Failed to get chat response. ${errorMessage}`,
    };
  }
}

/**
 * Server action to translate a mind map to a target language.
 * @param {TranslateMindMapInput} input - The input containing the mind map data and the target language.
 * @returns {Promise<{ translation: TranslateMindMapOutput | null; error: string | null }>} An object with either the translated mind map or an error message.
 */
export async function translateMindMapAction(
  input: TranslateMindMapInput,
  options: { apiKey?: string; provider?: AIProvider; strict?: boolean } = { provider: 'pollinations' }
): Promise<{ translation: TranslateMindMapOutput | null; error: string | null }> {
  try {
    const result = await translateMindMap({ ...input, ...options });
    return { translation: result, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      translation: null,
      error: `Failed to translate mind map. ${errorMessage}`,
    };
  }
}

/**
 * Server action to get a real-life example for a mind map node.
 * @param {ExplainWithExampleInput} input - The input containing the topic name and main topic.
 * @returns {Promise<{ example: ExplainWithExampleOutput | null; error: string | null }>} An object with the example or an error.
 */
export async function explainWithExampleAction(
  input: ExplainWithExampleInput,
  options: { apiKey?: string; provider?: AIProvider; strict?: boolean } = { provider: 'pollinations' }
): Promise<{ example: ExplainWithExampleOutput | null; error: string | null }> {
  try {
    const result = await explainWithExample({ ...input, ...options });
    return { example: result, error: null };
  } catch (error) {
    console.error('Error in explainWithExampleAction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      example: null,
      error: `Failed to get example. ${errorMessage}`,
    };
  }
}

/**
 * Server action to summarize a chat history into a topic.
 * @param {SummarizeChatInput} input - The chat history to summarize.
 * @returns {Promise<{ summary: SummarizeChatOutput | null; error: string | null }>} The generated topic or an error.
 */
export async function summarizeChatAction(
  input: SummarizeChatInput,
  options: { apiKey?: string; provider?: AIProvider; strict?: boolean } = { provider: 'pollinations' }
): Promise<{ summary: SummarizeChatOutput | null; error: string | null }> {
  try {
    const result = await summarizeChat({ ...input, ...options });
    return { summary: result, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      summary: null,
      error: `Failed to summarize chat. ${errorMessage}`,
    };
  }
}

/**
 * Server action for the conversational mind map builder.
 * @param {ConversationalMindMapInput} input - The current state of the conversation.
 * @returns {Promise<{ response: ConversationalMindMapOutput | null; error: string | null }>} The AI's next turn or an error.
 */
export async function conversationalMindMapAction(
  input: ConversationalMindMapInput,
  options: { apiKey?: string; provider?: AIProvider; strict?: boolean } = { provider: 'pollinations' }
): Promise<{ response: ConversationalMindMapOutput | null; error: string | null }> {
  try {
    const result = await conversationalMindMap({ ...input, ...options });
    return { response: result, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      response: null,
      error: `Failed to process conversational turn. ${errorMessage}`,
    };
  }
}

/**
 * Server action to enhance a user's prompt for image generation.
 * @param {EnhanceImagePromptInput} input - The user's original prompt.
 * @returns {Promise<{ enhancedPrompt: EnhanceImagePromptOutput | null; error: string | null }>} The enhanced prompt or an error.
 */
export async function enhanceImagePromptAction(
  input: EnhanceImagePromptInput,
  options: { apiKey?: string; provider?: AIProvider; strict?: boolean } = { provider: 'pollinations' }
): Promise<{
  enhancedPrompt: EnhanceImagePromptOutput | null;
  error: string | null;
}> {
  try {
    const result = await enhanceImagePrompt({ ...input, ...options });
    return { enhancedPrompt: result, error: null };
  } catch (error) {
    console.error('Error in enhanceImagePromptAction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      enhancedPrompt: null,
      error: `Failed to enhance prompt: ${errorMessage}`,
    };
  }
}

/**
 * Server action to summarize a mind map into a short description.
 * @param {SummarizeMindMapInput} input - The mind map data to summarize.
 * @returns {Promise<{ summary: SummarizeMindMapOutput | null; error: string | null }>} The generated summary or an error.
 */
export async function summarizeMindMapAction(
  input: SummarizeMindMapInput,
  options: { apiKey?: string; provider?: AIProvider; strict?: boolean } = { provider: 'pollinations' }
): Promise<{ summary: SummarizeMindMapOutput | null; error: string | null }> {
  try {
    const result = await summarizeMindMap({ ...input, ...options });
    return { summary: result, error: null };
  } catch (error) {
    console.error('Error in summarizeMindMapAction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      summary: null,
      error: `Failed to summarize mind map. ${errorMessage}`,
    };
  }
}

/**
 * Server action to expand a specific node with nested sub-categories.
 * This enables inline expansion without creating a new mind map.
 * @param {ExpandNodeInput} input - The node to expand and its context.
 * @returns {Promise<{ expansion: ExpandNodeOutput | null; error: string | null }>} The generated expansion or an error.
 */
export async function expandNodeAction(
  input: ExpandNodeInput,
  options: { apiKey?: string; provider?: AIProvider; strict?: boolean } = { provider: 'pollinations' }
): Promise<{ expansion: ExpandNodeOutput | null; error: string | null }> {
  try {
    const result = await expandNode({ ...input, ...options });
    return { expansion: result, error: null };
  } catch (error) {
    console.error('Error in expandNodeAction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      expansion: null,
      error: `Failed to expand node. ${errorMessage}`,
    };
  }
}
