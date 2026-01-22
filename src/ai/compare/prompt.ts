export const systemPrompt = `You are an expert analyst and educator.

Your task is to compare TWO topics in a structured, neutral, and factual way.
You MUST return RAW JSON that strictly matches the provided schema.
CRITICAL: Do not provide any prose, preamble, or conclusion. Return only the JSON object.
Ensure all JSON strings are properly escaped for parsing.

When provided with real-time search context, use it as factual grounding for your comparison.
Prefer recent and authoritative sources from the search results.
`;

export const userPromptTemplate = (
  topicA: string,
  topicB: string,
  depth: 'low' | 'medium' | 'deep' = 'low',
  searchContextA?: any,
  searchContextB?: any
) => {
  let countInstruction = '';
  let depthDetail = '';

  if (depth === 'medium') {
    countInstruction = '4-6 similarities and 4-6 differences per topic';
    depthDetail = 'Provide a more detailed expansion in deep-dive sections.';
  } else if (depth === 'deep') {
    countInstruction = '6-8 similarities and 6-8 differences per topic';
    depthDetail = 'Provide an extensive, granular expansion in deep-dive sections with maximum detail.';
  } else {
    countInstruction = '3-4 similarities and 3-4 differences per topic';
    depthDetail = '';
  }

  // Search grounding section
  let searchSection = '';
  if (searchContextA || searchContextB) {
    searchSection = `

REAL-TIME WEB INFORMATION:

Topic A (${topicA}):
${searchContextA ? `Summary: ${searchContextA.summary}
Sources: ${searchContextA.sources.slice(0, 3).map((s: any) => `${s.title} (${s.url})`).join(', ')}
Search Date: ${new Date(searchContextA.timestamp).toLocaleDateString()}` : 'No search data available'}

Topic B (${topicB}):
${searchContextB ? `Summary: ${searchContextB.summary}
Sources: ${searchContextB.sources.slice(0, 3).map((s: any) => `${s.title} (${s.url})`).join(', ')}
Search Date: ${new Date(searchContextB.timestamp).toLocaleDateString()}` : 'No search data available'}

Use this current information to ground your comparison in recent facts and developments.
Incorporate up-to-date information from the search results into your analysis.
`;
  }

  return `
Compare the following two topics in depth.

Topic A: ${topicA}
Topic B: ${topicB}
${searchSection}

Requirements:
- Produce a structured comparison
- Identify meaningful similarities
- Clearly distinguish differences (provide parallel points of comparison)
- Provide 3-4 highly relevant external links for further reading.
- CRITICAL: LINK QUALITY. Use ONLY stable, high-authority, and evergreen domains (e.g., Wikipedia, official documentation, academic .edu sites, government .gov portals, or major technical journals). 
- DO NOT generate links to specific news articles that might expire, or promotional/blog sites. 
- Ensure the URLs look functionally correct and point to the root or stable sub-pages of the topic.
- Expand each topic independently in deep-dive sections. ${depthDetail}
- For EVERY similarity and difference, you MUST provide a "description" field containing one or two clear, informative sentences explaining the comparison. DO NOT USE GENERIC PLACEHOLDERS like "Detailed analysis for this comparison point." - generate real data.
- Keep each node concise and factual
${searchSection ? '- Ground all comparisons in the provided search results. Use current facts and recent developments.' : ''}

Output Rules:
- Produce EXACTLY ${countInstruction}.
- Use short, clear titles (max 3 words).
- Avoid repetition between sections.
- Do NOT include opinions or conversational text.
- Return RAW JSON ONLY. No markdown markers.
- CRITICAL: Ensure all strings are properly escaped. Do not use unescaped double quotes inside values.
- Use kebab-case for icons (e.g., "git-compare", "layers", "link-2").
- The output MUST conform to the schema:
{
  "mode": "compare",
  "topic": "${topicA} vs ${topicB}",
  "root": { "title": "${topicA} vs ${topicB}", "description": "A comparative analysis focused on key similarities and distinct differences." },
  "similarities": [{ "title": "...", "description": "A specific sentence about why they are similar.", "icon": "..." }],
  "differences": { 
     "topicA": [{ "title": "...", "description": "A specific sentence about why this is unique to Topic A.", "icon": "..." }], 
     "topicB": [{ "title": "...", "description": "A specific sentence about why this is unique to Topic B.", "icon": "..." }] 
  },
  "relevantLinks": [
    { "title": "Official Documentation", "url": "https://docs.example.com", "description": "The primary source for technical specifications and core features." },
    { "title": "Wikipedia: Topic Overview", "url": "https://en.wikipedia.org/wiki/Topic", "description": "Comprehensive historical and technical background information." }
  ],
  "topicADeepDive": [
    { "title": "Specific Deep Dive topic for A", "description": "High-fidelity informative sentence. NO PLACEHOLDERS.", "icon": "..." }
  ],
  "topicBDeepDive": [
    { "title": "Specific Deep Dive topic for B", "description": "High-fidelity informative sentence. NO PLACEHOLDERS.", "icon": "..." }
  ]
}

CRITICAL: The "topicADeepDive" and "topicBDeepDive" MUST NOT BE EMPTY. Generate at least 3-4 deep dive nodes for EACH topic.
CRITICAL: The "topic" and "root.title" MUST be in the format "[Topic A Name] vs [Topic B Name]". Do not use "Topic A" or "Topic B" literally in the output.
`;
};
