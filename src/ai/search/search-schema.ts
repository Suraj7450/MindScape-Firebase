import { z } from 'zod';

/**
 * Schema for individual search source/result
 */
export const SearchSourceSchema = z.object({
    title: z.string().describe('Title of the search result'),
    url: z.string().url().describe('URL of the source'),
    published: z.string().optional().describe('Publication date if available'),
    snippet: z.string().optional().describe('Brief excerpt from the source'),
});

export type SearchSource = z.infer<typeof SearchSourceSchema>;

/**
 * Schema for normalized search context
 */
export const SearchContextSchema = z.object({
    summary: z.string().describe('Concise summary of search findings'),
    sources: z.array(SearchSourceSchema).describe('List of search sources'),
    timestamp: z.string().describe('ISO timestamp of when search was executed'),
    query: z.string().describe('Original search query'),
});

export type SearchContext = z.infer<typeof SearchContextSchema>;

/**
 * Schema for search request parameters
 */
export const SearchRequestSchema = z.object({
    query: z.string().min(1).describe('Search query string'),
    depth: z.enum(['basic', 'deep']).default('basic').describe('Search depth level'),
    maxResults: z.number().min(1).max(10).default(5).describe('Maximum number of results to return'),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;
