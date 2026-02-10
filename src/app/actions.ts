
'use server';
'use server';
import { AIProvider } from '@/ai/client-dispatcher';
import { providerMonitor } from '@/ai/provider-monitor';
import {
  generateMindMap,
  GenerateMindMapOutput,
  GenerateMindMapInput,
} from '@/ai/flows/generate-mind-map';
import { getUserImageSettings } from '@/lib/firestore-helpers';
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
import { summarizeTopic } from '@/ai/flows/summarize-topic';

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
import type { BrainstormOutputType } from '@/ai/schemas/brainstorm-wizard-schema';
import {
  enhanceImagePrompt,
  EnhanceImagePromptInput,
  EnhanceImagePromptOutput,
} from '@/ai/flows/enhance-image-prompt';
import { brainstormWizard } from '@/ai/flows/brainstorm-wizard';
import { BrainstormWizardInput, BrainstormWizardOutput } from '@/ai/schemas/brainstorm-wizard-schema';


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
import { generateSearchContext } from './actions/generateSearchContext';

/**
 * Ensures AI-generated data strictly adheres to the frontend MindMapData interface.
 * Fills in default values for required fields like tags and isExpanded.
 */
export async function mapToMindMapData(raw: any, depth: 'low' | 'medium' | 'deep' = 'low'): Promise<MindMapData> {
  if (raw.mode === 'compare' || raw.compareData) {
    // If the data is already in the new nested compareData format, pass it through
    if (raw.compareData) {
      return {
        ...raw,
        mode: 'compare',
        depth,
        createdAt: raw.createdAt || Date.now(),
        updatedAt: raw.updatedAt || Date.now(),
        compareData: {
          ...raw.compareData,
          unityNexus: (raw.compareData.unityNexus || []).map((n: any) => ({
            ...n,
            id: n.id || `nexus-${Math.random().toString(36).substr(2, 9)}`
          })),
          dimensions: (raw.compareData.dimensions || []).map((d: any) => ({
            ...d
          }))
        }
      } as CompareMindMapData;
    }

    // Legacy Fallback: If it's old flat format, we wrap it (though new generations won't go here)
    return {
      ...raw,
      mode: 'compare',
      depth,
      compareData: {
        root: raw.root || { title: raw.topic || 'Comparison' },
        unityNexus: (raw.similarities || []).map((n: any) => ({ ...n, id: n.id || Math.random().toString(36).substr(2, 9) })),
        dimensions: [], // Old format can't satisfy dimensions easily
        synthesisHorizon: { expertVerdict: '', futureEvolution: '' },
        relevantLinks: raw.relevantLinks || []
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
 * Internal helper to resolve the effective API key for AI generation.
 * Prioritizes explicitly provided keys, then user-specific keys from Firestore, 
 * and finally falls back to server-side environmental variables.
 */
export async function resolveApiKey(options: { apiKey?: string; userId?: string; provider?: AIProvider }): Promise<string | undefined> {
  let effectiveApiKey = options.apiKey;

  // If no API key provided, try to fetch from user profile on server
  if (!effectiveApiKey && options.userId && (options.provider === 'pollinations' || !options.provider)) {
    try {
      const { getUserImageSettingsAdmin } = await import('@/lib/firestore-server-helpers');
      const userSettings = await getUserImageSettingsAdmin(options.userId);
      if (userSettings?.pollinationsApiKey) {
        effectiveApiKey = userSettings.pollinationsApiKey;
        console.log(`🔑 Using Pollinations API key from Firestore Admin for user: ${options.userId}`);
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch user API key from Firestore Admin, falling back to server default:', err);
    }
  }

  return effectiveApiKey;
}

/**
 * Server action to generate a mind map based on a given topic.
 * @param {GenerateMindMapInput} input - The input for the mind map generation, containing the topic.
 * @param {boolean} input.useSearch - Optional flag to enable Google Search for real-time context
 * @returns {Promise<{ data: GenerateMindMapOutput | null; error: string | null }>} An object with either the generated mind map data or an error message.
 */
export async function generateMindMapAction(
  input: GenerateMindMapInput & { useSearch?: boolean },
  options: { apiKey?: string; provider?: AIProvider; model?: string; userId?: string } = {}
): Promise<{ data: MindMapData | null; error: string | null }> {
  try {
    // Ensure input.topic is treated as a plain string
    const topic = String(input.topic);

    if (!topic || topic.length < 1) {
      return { data: null, error: 'Topic must be at least 1 character long.' };
    }

    const effectiveApiKey = await resolveApiKey(options);
    let searchContext = null;

    // Generate search context if requested
    if (input.useSearch) {
      console.log(`🔍 Search enabled for topic: "${topic}"`);
      const searchResult = await generateSearchContext({
        query: topic,
        depth: input.depth === 'deep' ? 'deep' : 'basic',
        apiKey: effectiveApiKey,
        provider: options.provider,
      });

      if (searchResult.data) {
        searchContext = searchResult.data;
        console.log(`✅ Search context retrieved: ${searchContext.sources.length} sources`);
      } else {
        console.warn(`⚠️ Search failed, continuing without search context: ${searchResult.error}`);
      }
    }

    const result = await generateMindMap({
      ...input,
      topic,
      searchContext,
      ...options,
      apiKey: effectiveApiKey
    });

    if (!result) return { data: null, error: 'AI failed to generate content.' };

    const sanitized = await mapToMindMapData(result, input.depth || 'low');

    // Attach search metadata if search was used
    if (searchContext && searchContext.sources.length > 0) {
      sanitized.searchSources = searchContext.sources;
      sanitized.searchTimestamp = searchContext.timestamp;
    }

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
    const { initializeFirebaseServer } = await import('@/firebase/server');
    const { firestore } = initializeFirebaseServer();

    await firestore.collection('users').doc(userId).set({
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
  options: { apiKey?: string; provider?: AIProvider; userId?: string } = {}
): Promise<{ data: MindMapData | null; error: string | null }> {
  if (!input.imageDataUri) {
    return { data: null, error: 'Image data URI is required.' };
  }

  try {
    const depth = input.depth || 'low';
    const effectiveApiKey = await resolveApiKey(options);
    const rawResult = await generateMindMapFromImage({ ...input, depth, ...options, apiKey: effectiveApiKey });
    if (!rawResult) return { data: null, error: 'AI failed to process image.' };

    const sanitized = await mapToMindMapData(rawResult, depth);
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
    const effectiveApiKey = await resolveApiKey(options);
    const result = await generateMindMapFromText({ ...input, depth, ...options, apiKey: effectiveApiKey });
    if (!result) return { data: null, error: 'AI failed to process text.' };

    const sanitized = await mapToMindMapData(result, depth);
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
    const effectiveApiKey = await resolveApiKey(options);
    const result = await explainMindMapNode({ ...input, ...options, apiKey: effectiveApiKey });
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
    const effectiveApiKey = await resolveApiKey(options);
    const result = await chatWithAssistant({ ...input, ...options, apiKey: effectiveApiKey });
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
    const effectiveApiKey = await resolveApiKey(options);
    const result = await translateMindMap({ ...input, ...options, apiKey: effectiveApiKey });
    if (!result) return { translation: null, error: 'AI failed to get translation.' };
    const sanitized = await mapToMindMapData(result);
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
    const effectiveApiKey = await resolveApiKey(options);
    const result = await explainWithExample({ ...input, ...options, apiKey: effectiveApiKey });
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
    const effectiveApiKey = await resolveApiKey(options);
    const result = await summarizeChat({ ...input, ...options, apiKey: effectiveApiKey });
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
 * Server action to generate a concise summary for the entire mind map.
 */
export async function summarizeTopicAction(
  input: { mindMapData: MindMapData },
  options: { apiKey?: string; provider?: AIProvider } = {}
): Promise<{ summary: string | null; error: string | null }> {
  try {
    const effectiveApiKey = await resolveApiKey(options);
    const result = await summarizeTopic({ ...input, ...options, apiKey: effectiveApiKey });
    return { summary: result.summary, error: null };
  } catch (error) {
    console.error('Error in summarizeTopicAction:', error);
    return {
      summary: null,
      error: error instanceof Error ? error.message : 'Failed to generate summary.',
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
    const effectiveApiKey = await resolveApiKey(options);
    const result = await conversationalMindMap({ ...input, ...options, apiKey: effectiveApiKey });
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
 * Server action for the structured brainstorm wizard.
 */
export async function brainstormWizardAction(
  input: BrainstormWizardInput,
  options: { apiKey?: string; provider?: AIProvider } = {}
): Promise<{ response: BrainstormWizardOutput | null; error: string | null }> {
  try {
    const effectiveApiKey = await resolveApiKey(options);
    const result = await brainstormWizard({ ...input, ...options, apiKey: effectiveApiKey });

    // Sanitize the mind map if it's the final step
    if (result.step === 'FINALIZE' && result.mindMap) {
      try {
        // We cast to any here because mapToMindMapData returns a broader MindMapData type
        // but we want to keep the response structure consistent for the caller.
        result.mindMap = (await mapToMindMapData(result.mindMap, input.depth as any || 'low')) as any;
      } catch (e) {
        console.error('Failed to sanitize brainstormed mind map:', e);
      }
    }

    console.log(`[brainstormWizardAction] Final response shape:`, {
      step: result.step,
      hasMindMap: !!(result as any).mindMap,
      resultKeys: Object.keys(result)
    });
    return { response: result, error: null };
  } catch (error) {
    console.error('Error in brainstormWizardAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { response: null, error: errorMessage };
  }
}

/**
 * Server action to transform an existing mind map into a different Knowledge Studio format.
 * @param {MindMapData} sourceMap - The source mind map to transform.
 * @param {BrainstormOutputType} targetFormat - The target format (dossier, quiz, etc.).
 * @returns {Promise<{ response: any | null; error: string | null }>} The transformed content or an error.
 */
export async function transformMindMapAction(
  sourceMap: MindMapData,
  targetFormat: BrainstormOutputType,
  useSearch: boolean = false,
  options: { apiKey?: string; provider?: AIProvider } = {}
): Promise<{ response: any | null; error: string | null }> {
  try {
    // Extract structure from the mind map
    const selections: Record<string, string[]> = {};

    // Convert mind map structure to selections format
    // Only process single mind maps (not compare mode)
    if (sourceMap.mode === 'single' && 'subTopics' in sourceMap && sourceMap.subTopics) {
      sourceMap.subTopics.forEach((subTopic: any) => {
        const aspectName = subTopic.name;
        const categories: string[] = [];

        if (subTopic.categories) {
          subTopic.categories.forEach((cat: any) => {
            categories.push(cat.name);
          });
        }
        selections[aspectName] = categories;
      });
    }

    console.log('[transformMindMapAction] Extracted selections:', selections);

    let searchContext = undefined;
    if (useSearch) {
      console.log('[transformMindMapAction] 🔍 Real-time search enabled for topic:', sourceMap.topic);
      const searchResult = await generateSearchContext({
        query: sourceMap.topic,
        depth: 'deep',
        maxResults: 5,
        apiKey: options.apiKey,
        provider: options.provider
      });

      if (searchResult.data) {
        console.log(`[transformMindMapAction] ✅ Search context retrieved: ${searchResult.data.sources.length} sources`);
        searchContext = searchResult.data;
      } else {
        console.warn(`[transformMindMapAction] ⚠️ Search failed: ${searchResult.error}`);
      }
    }

    // Call brainstormWizard with FINALIZE step
    const result = await brainstormWizardAction(
      {
        step: 'FINALIZE',
        topic: sourceMap.topic,
        language: 'en',
        outputType: targetFormat,
        selections,
        depth: 'medium',
        searchContext: searchContext
      },
      options
    );

    if (result.error || !result.response) {
      return { response: null, error: result.error || 'Transformation failed' };
    }

    // Extract the appropriate data field based on format
    const finalizeResult = result.response as any;
    let transformedData: any;

    if (targetFormat === 'mindmap' || targetFormat === 'roadmap') {
      transformedData = finalizeResult.mindMap;
    } else if (targetFormat === 'dossier' || targetFormat === 'pitch' || targetFormat === 'premortem') {
      transformedData = finalizeResult.content;
    } else if (targetFormat === 'quiz') {
      transformedData = finalizeResult.quiz;
    } else if (targetFormat === 'social') {
      transformedData = finalizeResult.social;


    }

    if (!transformedData) {
      return { response: null, error: 'AI did not return data in the expected format' };
    }

    return { response: transformedData, error: null };
  } catch (error) {
    console.error('Error in transformMindMapAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { response: null, error: errorMessage };
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
    const effectiveApiKey = await resolveApiKey(options);
    const result = await enhanceImagePrompt({ ...input, ...options, apiKey: effectiveApiKey });
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
    const effectiveApiKey = await resolveApiKey(options);
    const result = await expandNode({ ...input, ...options, apiKey: effectiveApiKey });
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
    const effectiveApiKey = await resolveApiKey(options);
    const result = await generateRelatedQuestions({ ...input, ...options, apiKey: effectiveApiKey });
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
 * @param {boolean} input.useSearch - Optional flag to enable Google Search for both topics
 * @returns {Promise<{ data: GenerateComparisonMapOutputV2 | null; error: string | null }>}
 */
export async function generateComparisonMapAction(
  input: GenerateComparisonMapInput & { useSearch?: boolean },
  options: { apiKey?: string; provider?: AIProvider; userId?: string } = {}
): Promise<{ data: CompareMindMapData | null; error: string | null }> {
  // TODO: Validate Firebase ID token server-side before invoking AI

  if (!input.topic1 || !input.topic2) {
    return { data: null, error: 'Both topics are required for comparison.' };
  }

  if (input.topic1.trim().toLowerCase() === input.topic2.trim().toLowerCase()) {
    return { data: null, error: 'Topics must be different to generate a comparison.' };
  }

  try {
    const effectiveApiKey = await resolveApiKey(options);
    let searchContextA = null;
    let searchContextB = null;

    // Generate search contexts for both topics if requested
    if (input.useSearch) {
      console.log(`🔍 Search enabled for comparison: "${input.topic1}" vs "${input.topic2}"`);

      // Execute searches in parallel for better performance
      const [searchResultA, searchResultB] = await Promise.all([
        generateSearchContext({
          query: input.topic1,
          depth: input.depth === 'deep' ? 'deep' : 'basic',
          apiKey: effectiveApiKey,
          provider: options.provider,
        }),
        generateSearchContext({
          query: input.topic2,
          depth: input.depth === 'deep' ? 'deep' : 'basic',
          apiKey: effectiveApiKey,
          provider: options.provider,
        }),
      ]);

      if (searchResultA.data) {
        searchContextA = searchResultA.data;
        console.log(`✅ Search context A retrieved: ${searchContextA.sources.length} sources`);
      } else {
        console.warn(`⚠️ Search A failed: ${searchResultA.error}`);
      }

      if (searchResultB.data) {
        searchContextB = searchResultB.data;
        console.log(`✅ Search context B retrieved: ${searchContextB.sources.length} sources`);
      } else {
        console.warn(`⚠️ Search B failed: ${searchResultB.error}`);
      }
    }

    const result = await generateComparisonMapV2({
      ...input,
      searchContextA,
      searchContextB,
      ...options,
      apiKey: effectiveApiKey
    });

    if (!result) return { data: null, error: 'AI failed to generate comparison.' };

    const sanitized = await mapToMindMapData(result, input.depth || 'low');

    // Attach search metadata if search was used
    if (searchContextA || searchContextB) {
      // Store search sources in the mind map data
      // We'll use a combined array for now, could be separated in the future
      const allSources = [
        ...(searchContextA?.sources || []),
        ...(searchContextB?.sources || []),
      ];
      if (allSources.length > 0) {
        sanitized.searchSources = allSources;
        sanitized.searchTimestamp = searchContextA?.timestamp || searchContextB?.timestamp || new Date().toISOString();
      }
    }

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
    const effectiveApiKey = await resolveApiKey(options);
    const result = await generateQuizFlow({ ...input, ...options, apiKey: effectiveApiKey });
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
    const effectiveApiKey = await resolveApiKey(options);
    const result = await regenerateQuizFlow({ ...input, ...options, apiKey: effectiveApiKey });
    return { data: result, error: null };
  } catch (error) {
    console.error('Error in regenerateQuizAction:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to regenerate quiz.',
    };
  }
}
