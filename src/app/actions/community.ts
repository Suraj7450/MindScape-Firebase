
'use server';

import { categorizeMindMap } from '@/ai/flows/categorize-mind-map';
import { AIProvider } from '@/ai/client-dispatcher';
import { MindMapWithId } from '@/types/mind-map';

import { suggestRelatedTopics } from '@/ai/flows/suggest-related-topics';

export async function categorizeMindMapAction(
    input: { topic: string; summary?: string },
    options?: { provider?: AIProvider; apiKey?: string }
) {
    try {
        const result = await categorizeMindMap({
            topic: input.topic,
            summary: input.summary,
            ...options,
        });
        return { categories: result.categories, error: null };
    } catch (error: any) {
        console.error('Categorization error:', error);
        return { categories: [], error: error.message || 'Failed to categorize mind map.' };
    }
}

export async function suggestRelatedTopicsAction(
    input: { topic: string; summary?: string },
    options?: { provider?: AIProvider; apiKey?: string }
) {
    try {
        const result = await suggestRelatedTopics({
            topic: input.topic,
            summary: input.summary,
            ...options,
        });

        // If AI fails or returns nothing, provide high-quality fallback topics based on input
        if (!result.topics || result.topics.length === 0) {
            return {
                topics: [
                    `Niche applications of ${input.topic} in modern industry`,
                    `The psychological impact of ${input.topic} on society`,
                    `Interdisciplinary connections: ${input.topic} and emerging tech`,
                    `Controversial debates surrounding ${input.topic} today`
                ].filter(Boolean),
                error: null
            };
        }

        return { topics: result.topics, error: null };
    } catch (error: any) {
        console.error('Suggestion error:', error);
        return {
            topics: [
                `Exploring ${input.topic} further`,
                `Deep dive research: ${input.topic}`,
                `Historical context of ${input.topic}`
            ],
            error: error.message || 'Failed to suggest related topics.'
        };
    }
}

// Note: Publication involves Firestore writes which are better handled on the client
// to use the user's auth token and security rules.
// These actions are helpers for AI-related tasks during publication.
