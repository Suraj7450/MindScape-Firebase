'use server';

import { SearchRequest } from './search-schema';

/**
 * Executes a web search using Pollinations search-optimized models
 * 
 * @param params - Search parameters including query, depth, and max results
 * @returns Raw search results from the API
 */
export async function executeGoogleSearch(params: SearchRequest & { apiKey?: string }): Promise<any> {
    const { query, depth, maxResults = 5, apiKey, model: modelOverride } = params;

    console.log(`🔍 Executing Google Search: "${query}" (depth: ${depth}, maxResults: ${maxResults})`);

    try {
        // Construct search prompt
        const searchPrompt = depth === 'deep'
            ? `Search the web for comprehensive, in-depth information about: "${query}". 
         Focus on recent developments, authoritative documentation, and expert tutorials.
          Return a detailed summary with EXACT source citations using markers like [1], [2], etc.
          Also, find and return a list of 4-6 high-quality relevant IMAGE URLs with their sources.
          For each source, I need a clear title and a professional snippet.`
            : `Research authoritative information about: "${query}".
          Provide a factual, concise summary with citations like [1], [2].
          Include 3-4 relevant high-quality IMAGE URLs that visually represent the topic.
          Focus on the most trusted documentation and official sources.`;

        // Prepare request body for Pollinations API with search-optimized model
        const body = {
            messages: [
                {
                    role: 'system',
                    content: `You are a research assistant with access to Google Search.
Use the google_search tool to find current, factual information.
Provide clear summaries with source citations.
Identify and provide direct image URLs (jpg, png, webp) for visual reference.
Focus on authoritative and recent sources.`
                },
                {
                    role: 'user',
                    content: searchPrompt
                }
            ],
            model: modelOverride || 'perplexity-fast', // Primary: Perplexity (high reliability, structured citations)
            tools: [
                {
                    type: 'google_search'
                }
            ],
            stream: false,
            max_tokens: 4096,
        };

        // Robust API Key selection
        const effectiveApiKey = apiKey === 'DISABLED'
            ? undefined
            : (apiKey && apiKey.trim() !== "")
                ? apiKey
                : process.env.POLLINATIONS_API_KEY;

        if (effectiveApiKey) {
            console.log(`🔑 Using Pollinations Search Key: ${effectiveApiKey.substring(0, 7)}... (from ${apiKey ? 'Client' : 'Server Env'})`);
        } else if (apiKey === 'DISABLED') {
            console.log(`🔑 Pollinations Auth: Explicitly DISABLED (no key will be used)`);
        }

        // Make API request to Pollinations
        const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(effectiveApiKey ? { 'Authorization': `Bearer ${effectiveApiKey}` } : {})
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            let errorMessage = response.statusText;
            const status = response.status;

            // Handle invalid API key by retrying without one (Pollinations fallback)
            // Only retry if we haven't already disabled the key to prevent infinite loop
            if (status === 401 && effectiveApiKey && apiKey !== 'DISABLED') {
                console.warn("⚠️ Pollinations Search API Key is invalid (401). Retrying without key...");
                return executeGoogleSearch({
                    ...params,
                    apiKey: 'DISABLED',
                });
            }

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

        // Handle tool_calls if content is empty (common for gemini-search)
        const message = data.choices?.[0]?.message;
        if (message && !message.content && message.tool_calls && message.tool_calls.length > 0) {
            console.log('🛠️ Extracting search result from tool_calls...');
            const toolCall = message.tool_calls[0];
            if (toolCall.function?.arguments) {
                try {
                    const args = typeof toolCall.function.arguments === 'string'
                        ? JSON.parse(toolCall.function.arguments)
                        : toolCall.function.arguments;
                    // If the model returned arguments that look like the search result content
                    if (args.content || args.summary) {
                        message.content = args.content || args.summary;
                    } else {
                        // Default to stringified args if no clear content field
                        message.content = JSON.stringify(args);
                    }
                } catch {
                    message.content = String(toolCall.function.arguments);
                }
            }
        }

        // Log response structure for debugging
        console.log('📦 Search response content:', (message?.content || 'EMPTY').substring(0, 500));

        // --- FALLBACK LOGIC ---
        // If content is empty or looks like a failure message, try next fallback
        const isEmpty = !message || !message.content || message.content.length < 50;

        if (isEmpty) {
            console.warn('⚠️ Search model returned empty or minimal results. Triggering internal research fallback...');
            // Manually trigger the "catch" block behavior by throwing an error
            throw new Error('All search models returned empty results');
        }

        return data;
    } catch (error: any) {
        console.error('❌ Google Search Execution Failed:', error);

        // Final fallback: Use a standard model for "internal knowledge" research if search fails
        const isSearchModel = !params.model || params.model === 'perplexity-fast';
        if (isSearchModel) {
            console.warn('🔄 All search-specific models failed or errored. Attempting internal research with mistral...');
            try {
                // We use a simpler fetch here to avoid circular dependencies with dispatcher
                const body = {
                    messages: [
                        { role: 'system', content: 'You are a research assistant. Provide a brief, factual summary of the given topic based on your internal knowledge.' },
                        { role: 'user', content: `Summarize key facts and categories for: "${query}"` }
                    ],
                    model: 'mistral',
                    stream: false
                };

                const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Internal research fallback successful');
                    return data;
                }
            } catch (innerError) {
                console.error('❌ Internal research fallback failed:', innerError);
            }
        }

        throw new Error(`Google Search failed: ${error.message}`);
    }
}
