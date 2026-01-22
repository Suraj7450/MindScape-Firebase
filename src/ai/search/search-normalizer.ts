
import { SearchContext, SearchSource, SearchContextSchema } from './search-schema';

/**
 * Normalizes raw search results from the API into a structured SearchContext
 * 
 * @param rawResults - Raw API response from executeGoogleSearch
 * @param query - Original search query
 * @returns Normalized and validated SearchContext
 */
export function normalizeSearchResults(rawResults: any, query: string): SearchContext {
    console.log('🔄 Normalizing search results...');

    try {
        // Extract content from various possible response structures
        let content = '';
        let toolCalls: any[] = [];

        // Check for tool_calls in the response
        if (rawResults.choices?.[0]?.message?.tool_calls) {
            toolCalls = rawResults.choices[0].message.tool_calls;
        }

        // Extract text content
        if (rawResults.choices?.[0]?.message?.content) {
            content = rawResults.choices[0].message.content;
        }

        // Initialize sources array
        const sources: SearchSource[] = [];
        let summary = '';

        // Process tool calls (google_search results)
        if (toolCalls.length > 0) {
            console.log(`📊 Found ${toolCalls.length} tool call(s)`);

            for (const toolCall of toolCalls) {
                if (toolCall.function?.name === 'google_search') {
                    try {
                        // Parse the function arguments which contain search results
                        const args = typeof toolCall.function.arguments === 'string'
                            ? JSON.parse(toolCall.function.arguments)
                            : toolCall.function.arguments;

                        console.log('🔍 Search tool arguments:', JSON.stringify(args).substring(0, 500));

                        // Extract results from various possible structures
                        const results = args.results || args.items || args.organic_results || [];

                        if (Array.isArray(results)) {
                            for (const result of results.slice(0, 5)) { // Limit to top 5 results
                                if (result.url || result.link) {
                                    sources.push({
                                        title: result.title || result.name || 'Untitled',
                                        url: result.url || result.link,
                                        snippet: result.snippet || result.description || undefined,
                                        published: result.date || result.published || undefined,
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('⚠️ Failed to parse tool call arguments:', e);
                    }
                }
            }
        }

        // Use content as summary, or generate a default one
        if (content && content.trim()) {
            summary = content.trim();
        } else if (sources.length > 0) {
            summary = `Found ${sources.length} relevant sources about ${query}.`;
        } else {
            summary = `Search completed for: ${query}`;
        }

        // If no sources found from tool calls, try to extract from content
        if (sources.length === 0 && content) {
            // Attempt to extract URLs from content
            const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
            const urls = content.match(urlRegex) || [];

            for (const url of urls.slice(0, 3)) {
                try {
                    const urlObj = new URL(url);
                    sources.push({
                        title: urlObj.hostname,
                        url: url,
                    });
                } catch (e) {
                    // Invalid URL, skip
                }
            }
        }

        // Create the search context
        const searchContext: SearchContext = {
            summary: summary.substring(0, 1000), // Limit summary length
            sources: sources,
            timestamp: new Date().toISOString(),
            query: query,
        };

        // Validate against schema
        const validated = SearchContextSchema.parse(searchContext);

        console.log(`✅ Normalized search results: ${validated.sources.length} sources`);
        return validated;

    } catch (error: any) {
        console.error('❌ Search normalization failed:', error);

        // Return minimal valid context on error
        return {
            summary: `Search results for: ${query}`,
            sources: [],
            timestamp: new Date().toISOString(),
            query: query,
        };
    }
}

/**
 * Filters sources to prioritize authoritative domains
 * 
 * @param sources - Array of search sources
 * @returns Filtered and sorted sources
 */
export function filterAuthoritativeSources(sources: SearchSource[]): SearchSource[] {
    // Authoritative domain patterns
    const authoritativePatterns = [
        /\.edu$/,
        /\.gov$/,
        /\.org$/,
        /wikipedia\.org/,
        /github\.com/,
        /stackoverflow\.com/,
        /medium\.com/,
        /arxiv\.org/,
        /nature\.com/,
        /sciencedirect\.com/,
    ];

    // Score each source
    const scored = sources.map(source => {
        let score = 0;

        try {
            const hostname = new URL(source.url).hostname.toLowerCase();

            // Check against authoritative patterns
            for (const pattern of authoritativePatterns) {
                if (pattern.test(hostname)) {
                    score += 10;
                    break;
                }
            }
        } catch (e) {
            // Invalid URL, give it a low score but don't fail
            console.warn(`⚠️ Invalid URL in source: ${source.url}`);
            score = -10;
        }

        // Prefer HTTPS
        if (source.url.startsWith('https://')) {
            score += 2;
        }

        // Prefer sources with publication dates
        if (source.published) {
            score += 3;
        }

        // Prefer sources with snippets
        if (source.snippet) {
            score += 1;
        }

        return { source, score };
    });

    // Sort by score (highest first) and return sources
    return scored
        .sort((a, b) => b.score - a.score)
        .map(item => item.source);
}
