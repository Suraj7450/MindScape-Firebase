
'use server';
import { AIProvider } from '@/ai/client-dispatcher';
import { providerMonitor } from '@/ai/provider-monitor';
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
  expandNode,
  ExpandNodeInput,
  ExpandNodeOutput,
} from '@/ai/flows/expand-node';
import { generateQuizFlow, GenerateQuizInput } from '@/ai/flows/generate-quiz';
import { regenerateQuizFlow, RegenerateQuizInput } from '@/ai/flows/regenerate-quiz';
import { Quiz } from '@/ai/schemas/quiz-schema';
import {
  generateRelatedQuestions,
  RelatedQuestionsInput,
} from '@/ai/flows/generate-related-questions';
import { RelatedQuestionsOutput } from '@/ai/schemas/related-questions-schema';
import {
  generateComparisonMapV2,
  GenerateComparisonMapOutputV2,
} from '@/ai/compare/flow';
import { GenerateComparisonMapInput } from '@/ai/compare/schema';
import { MindMapData, SingleMindMapData, CompareMindMapData, SubTopic, Category, SubCategory } from '@/types/mind-map';
import { addDoc, collection } from 'firebase/firestore';

/**
 * Ensures AI-generated data strictly adheres to the frontend MindMapData interface.
 * Fills in default values for required fields like tags and isExpanded.
 */
function mapToMindMapData(raw: any, depth: 'low' | 'medium' | 'deep' = 'low'): MindMapData {
  if (raw.mode === 'compare' || raw.compareData || raw.similarities || raw.root) {
    // Handle both formats: nested (raw.compareData) and flat (raw.similarities/root directly)
    const compareData = raw.compareData || {
      root: raw.root,
      similarities: raw.similarities,
      differences: raw.differences
    };

    return {
      ...raw,
      mode: 'compare',
      depth,
      createdAt: raw.createdAt || Date.now(),
      updatedAt: raw.updatedAt || Date.now(),
      compareData: {
        ...raw.compareData,
        similarities: (compareData.similarities || []).map((n: any) => ({ ...n, id: n.id || Math.random().toString(36).substr(2, 9) })),
        differences: {
          topicA: (compareData.differences?.topicA || []).map((n: any) => ({ ...n, id: n.id || Math.random().toString(36).substr(2, 9) })),
          topicB: (compareData.differences?.topicB || []).map((n: any) => ({ ...n, id: n.id || Math.random().toString(36).substr(2, 9) })),
        }
      }
    } as CompareMindMapData;
  }

  // Handle single mode
  return {
    ...raw,
    mode: 'single',
    depth,
    createdAt: raw.createdAt || Date.now(),
    updatedAt: raw.updatedAt || Date.now(),
    nestedExpansions: (raw.nestedExpansions || []).map((ne: any) => ({
      ...ne,
      subCategories: (ne.subCategories || []).map((sub: any) => ({
        ...sub,
        tags: Array.isArray(sub.tags) ? sub.tags : []
      }))
    })),
    subTopics: (raw.subTopics || []).map((st: any): SubTopic => ({
      name: st.name || '',
      icon: st.icon || 'flag',
      insight: st.insight || '',
      categories: (st.categories || []).map((cat: any): Category => ({
        name: cat.name || '',
        icon: cat.icon || 'folder',
        insight: cat.insight || '',
        subCategories: (cat.subCategories || [])
          .filter((sub: any) => sub && typeof sub.name === 'string' && sub.name.trim() !== '')
          .map((sub: any): SubCategory => ({
            name: sub.name || '',
            description: sub.description || '',
            icon: sub.icon || 'book-open',
            tags: Array.isArray(sub.tags) ? sub.tags : [],
            isExpanded: false
          }))
      }))
    }))
  } as SingleMindMapData;
}

export interface GenerateMindMapFromImageInput {
  imageDataUri: string;
  targetLang?: string;
  persona?: string;
  depth?: 'low' | 'medium' | 'deep';
}

/**
 * Server action to generate a mind map based on a given topic.
 * @param {GenerateMindMapInput} input - The input for the mind map generation, containing the topic.
 * @returns {Promise<{ data: GenerateMindMapOutput | null; error: string | null }>} An object with either the generated mind map data or an error message.
 */
export async function generateMindMapAction(
  input: GenerateMindMapInput,
  options: { apiKey?: string; provider?: AIProvider } = {}
): Promise<{ data: MindMapData | null; error: string | null }> {
  // Ensure input.topic is treated as a plain string
  const topic = String(input.topic);

  if (!topic || topic.length < 1) {
    return { data: null, error: 'Topic must be at least 1 character long.' };
  }

  try {
    const result = await generateMindMap({ ...input, topic, ...options });
    if (!result) return { data: null, error: 'AI failed to generate content.' };

    const sanitized = mapToMindMapData(result, input.depth || 'low');
    return { data: sanitized, error: null };
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

export async function checkPollinationsKeyAction(): Promise<{ isConfigured: boolean }> {
  return { isConfigured: !!process.env.POLLINATIONS_API_KEY };
}

/**
 * Server action to update the user's preferred Pollinations model.
 */
export async function updateAIModelPreferenceAction(userId: string, model: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const sdk = await (await import('@/firebase')).initializeFirebase();
    const firestore = sdk.firestore;
    if (!firestore) throw new Error("Firestore not initialized");

    await setDoc(doc(firestore, 'users', userId), {
      apiSettings: { pollinationsModel: model }
    }, { merge: true });

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Server action to generate a mind map from an image.
 * @param {GenerateMindMapFromImageInput} input - The input containing the image data URI.
 * @returns {Promise<{ data: GenerateMindMapFromImageOutput | null; error: string | null }>} An object with the generated map or an error.
 */
export async function generateMindMapFromImageAction(
  input: GenerateMindMapFromImageInput,
  options: { apiKey?: string; provider?: AIProvider } = {}
): Promise<{ data: MindMapData | null; error: string | null }> {
  if (!input.imageDataUri) {
    return { data: null, error: 'Image data URI is required.' };
  }

  try {
    const depth = input.depth || 'low';
    const rawResult = await generateMindMapFromImage({ ...input, depth, ...options });
    if (!rawResult) return { data: null, error: 'AI failed to process image.' };

    const sanitized = mapToMindMapData(rawResult, depth);
    return { data: sanitized, error: null };
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
  options: { apiKey?: string; provider?: AIProvider } = {}
): Promise<{ data: MindMapData | null; error: string | null }> {
  if (!input.text || input.text.trim().length < 10) {
    return { data: null, error: 'Text content is too short to generate a mind map.' };
  }

  try {
    const depth = input.depth || 'low';
    const result = await generateMindMapFromText({ ...input, depth, ...options });
    if (!result) return { data: null, error: 'AI failed to process text.' };

    const sanitized = mapToMindMapData(result, depth);
    return { data: sanitized, error: null };
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
 * Server action to get a detailed explanation for a specific node in a mind map.
 * @param {ExplainMindMapNodeInput} input - The input containing details about the node to be explained.
 * @returns {Promise<{ explanation: ExplainMindMapNodeOutput | null; error: string | null }>} An object with either the explanation content or an error message.
 */
export async function explainNodeAction(
  input: ExplainMindMapNodeInput,
  options: { apiKey?: string; provider?: AIProvider } = {}
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
 * Server action to handle a chat conversation with the AI assistant.
 * @param {ChatWithAssistantInput} input - The input containing the user's question, topic, chat history, and persona.
 * @returns {Promise<{ response: ChatWithAssistantOutput | null; error: string | null }>} An object with either the chat response or an error message.
 */
export async function chatAction(
  input: ChatWithAssistantInput,
  options: { apiKey?: string; provider?: AIProvider } = {}
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
  options: { apiKey?: string; provider?: AIProvider } = {}
): Promise<{ translation: MindMapData | null; error: string | null }> {
  try {
    const result = await translateMindMap({ ...input, ...options });
    if (!result) return { translation: null, error: 'AI failed to get translation.' };
    const sanitized = mapToMindMapData(result);
    return { translation: sanitized, error: null };
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
  options: { apiKey?: string; provider?: AIProvider } = {}
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
  options: { apiKey?: string; provider?: AIProvider } = {}
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
  options: { apiKey?: string; provider?: AIProvider } = {}
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
  options: { apiKey?: string; provider?: AIProvider } = {}
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
 * Server action to expand a specific node with nested sub-categories.
 * This enables inline expansion without creating a new mind map.
 * @param {ExpandNodeInput} input - The node to expand and its context.
 * @returns {Promise<{ expansion: ExpandNodeOutput | null; error: string | null }>} The generated expansion or an error.
 */
export async function expandNodeAction(
  input: ExpandNodeInput,
  options: { apiKey?: string; provider?: AIProvider } = {}
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



/**
 * Server action to generate related questions based on the current context.
 * @param {RelatedQuestionsInput} input - The context for generating related questions.
 * @returns {Promise<{ data: RelatedQuestionsOutput | null; error: string | null }>} The generated questions or an error.
 */
export async function generateRelatedQuestionsAction(
  input: RelatedQuestionsInput,
  options: { apiKey?: string; provider?: AIProvider } = {}
): Promise<{ data: RelatedQuestionsOutput | null; error: string | null }> {
  try {
    const result = await generateRelatedQuestions({ ...input, ...options });
    return { data: result, error: null };
  } catch (error) {
    console.error('Error in generateRelatedQuestionsAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      data: null,
      error: `Failed to generate related questions: ${errorMessage}`,
    };
  }
}

export async function getAIHealthReportAction() {
  return providerMonitor.getReport();
}

/**
 * Server action to generate a comparison mind map between two topics.
 * @param {GenerateComparisonMapInput} input - The input containing two topics.
 * @returns {Promise<{ data: GenerateComparisonMapOutputV2 | null; error: string | null }>}
 */
export async function generateComparisonMapAction(
  input: GenerateComparisonMapInput,
  options: { apiKey?: string; provider?: AIProvider } = {}
): Promise<{ data: CompareMindMapData | null; error: string | null }> {
  // TODO: Validate Firebase ID token server-side before invoking AI

  if (!input.topic1 || !input.topic2) {
    return { data: null, error: 'Both topics are required for comparison.' };
  }

  if (input.topic1.trim().toLowerCase() === input.topic2.trim().toLowerCase()) {
    return { data: null, error: 'Topics must be different to generate a comparison.' };
  }

  try {
    const result = await generateComparisonMapV2({ ...input, ...options });
    if (!result) return { data: null, error: 'AI failed to generate comparison.' };

    const sanitized = mapToMindMapData(result, input.depth || 'low');
    return { data: sanitized as CompareMindMapData, error: null };
  } catch (error) {
    console.error('Error in generateComparisonMapAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      data: null,
      error: `Failed to generate comparison map: ${errorMessage}`,
    };
  }
}
/**
 * Server action to generate a quiz based on a topic and optional mind map data.
 */
export async function generateQuizAction(
  input: GenerateQuizInput,
  options: { apiKey?: string; provider?: AIProvider } = {}
): Promise<{ data: Quiz | null; error: string | null }> {
  try {
    const result = await generateQuizFlow({ ...input, ...options });
    return { data: result, error: null };
  } catch (error) {
    console.error('Error in generateQuizAction:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to generate quiz.',
    };
  }
}

/**
 * Server action to regenerate an adaptive quiz based on previous results.
 */
export async function regenerateQuizAction(
  input: RegenerateQuizInput,
  options: { apiKey?: string; provider?: AIProvider } = {}
): Promise<{ data: Quiz | null; error: string | null }> {
  try {
    const result = await regenerateQuizFlow({ ...input, ...options });
    return { data: result, error: null };
  } catch (error) {
    console.error('Error in regenerateQuizAction:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to regenerate quiz.',
    };
  }
}
