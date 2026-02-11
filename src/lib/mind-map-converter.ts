
import { MindMapData, SingleMindMapData, CompareMindMapData, SubTopic, Category, SubCategory } from '@/types/mind-map';

/**
 * Ensures AI-generated data strictly adheres to the frontend MindMapData interface.
 * Fills in default values for required fields like tags and isExpanded.
 * 
 * @param raw - The raw data from the AI or API
 * @param depth - The depth level of the map
 * @returns The sanitized MindMapData object
 */
export function mapToMindMapData(raw: any, depth: 'low' | 'medium' | 'deep' = 'low'): MindMapData {
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
