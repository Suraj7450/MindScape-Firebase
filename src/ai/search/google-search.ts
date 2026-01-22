'use server';

import { SearchRequest } from './search-schema';

/**
 * Executes a Google Search using Pollinations gemini-search model
 * 
 * @param params - Search parameters including query, depth, and max results
 * @returns Raw search results from the API
 */
export async function executeGoogleSearch(params: SearchRequest & { apiKey?: string }): Promise<any> {
    const { query, depth, maxResults = 5, apiKey } = params;

    console.log(`🔍 Executing Google Search: "${query}" (depth: ${depth}, maxResults: ${maxResults})`);

    try {
        // Construct search prompt
        const searchPrompt = depth === 'deep'
            ? `Search the web for comprehensive, in-depth information about: "${query}". 
         Focus on recent developments, authoritative sources, and detailed technical information.
         Provide factual summaries with proper citations.`
            : `Search the web for the most recent and authoritative information about: "${query}".
         Return factual, concise summaries with sources.`;

        // Prepare request body for Pollinations API with gemini-search model
        const body = {
            messages: [
                {
                    role: 'system',
                    content: `You are a research assistant with access to Google Search.
Use the google_search tool to find current, factual information.
Provide clear summaries with source citations.
Focus on authoritative and recent sources.`
                },
                {
                    role: 'user',
                    content: searchPrompt
                }
            ],
            model: 'gemini-search', // Pollinations model with native google_search tool
            tools: [
                {
                    type: 'google_search'
                }
            ],
            stream: false,
            max_tokens: 4096,
        };

        // Make API request to Pollinations
        const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } :
                    process.env.POLLINATIONS_API_KEY ? { 'Authorization': `Bearer ${process.env.POLLINATIONS_API_KEY}` } : {})
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            let errorMessage = response.statusText;
            const status = response.status;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error?.message || JSON.stringify(errorData);
            } catch (e) {
                try {
                    const text = await response.text();
                    if (text) errorMessage = text.substring(0, 500);
                } catch { /* ignore */ }
            }
            console.error(`❌ Google Search API Error [Status: ${status}]:`, errorMessage);
            throw new Error(`Search API error: ${status} ${errorMessage}`);
        }

        const data = await response.json();
        console.log(`✅ Google Search Response Success`);

        // Log response structure for debugging
        console.log('📦 Search response structure:', JSON.stringify(data, null, 2).substring(0, 1000));

        return data;
    } catch (error: any) {
        console.error('❌ Google Search Execution Failed:', error);
        throw new Error(`Google Search failed: ${error.message}`);
    }
}
