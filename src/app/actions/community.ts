
'use server';

import { categorizeMindMap } from '@/ai/flows/categorize-mind-map';
import { AIProvider } from '@/ai/client-dispatcher';
import { MindMapWithId } from '@/types/mind-map';

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

// Note: Publication involves Firestore writes which are better handled on the client
// to use the user's auth token and security rules.
// These actions are helpers for AI-related tasks during publication.
