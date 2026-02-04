import { NextResponse } from 'next/server';

// Available Pollinations text models for prompt enhancement
const TEXT_MODELS = {
    'gemini-search': {
        name: 'Gemini Search',
        description: 'Best for research and context gathering',
        hasSearch: true
    },
    'gemini-fast': {
        name: 'Gemini Fast',
        description: 'Fast responses, good quality',
        hasSearch: false
    },
    'perplexity-fast': {
        name: 'Perplexity Fast',
        description: 'Fast with built-in search',
        hasSearch: true
    }
} as const;

type TextModelName = keyof typeof TEXT_MODELS;

interface EnhancePromptRequest {
    topic: string;
    context?: string;
    imageType?: 'portrait' | 'object' | 'scene' | 'concept';
    model?: TextModelName;
}

/**
 * POST /api/enhance-prompt
 * 
 * Uses Pollinations text models to enhance image prompts with AI
 * Supports gemini-search (with search), gemini-fast, and perplexity-fast
 */
export async function POST(req: Request) {
    try {
        const body: EnhancePromptRequest = await req.json();
        const {
            topic,
            context = '',
            imageType = 'auto',
            model = 'gemini-search' // Default to search-enabled model
        } = body;

        // Validate inputs
        if (!topic || topic.trim().length === 0) {
            return NextResponse.json(
                { error: 'Topic is required' },
                { status: 400 }
            );
        }

        if (!TEXT_MODELS[model]) {
            return NextResponse.json(
                { error: `Invalid model. Available models: ${Object.keys(TEXT_MODELS).join(', ')}` },
                { status: 400 }
            );
        }

        console.log(`🤖 Enhancing prompt for: "${topic}" using ${model}`);

        // Get API key (user key takes priority)
        const apiKey = process.env.POLLINATIONS_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key not configured' },
                { status: 500 }
            );
        }

        // Create the enhancement prompt for the AI
        const enhancementPrompt = `You are an expert image prompt engineer. Enhance this topic into a detailed, visually-rich prompt for AI image generation.

Topic: "${topic}"
${context ? `Context: "${context}"` : ''}

RULES:
- Create a detailed visual description
- Include: composition, lighting, colors, mood, style  
- Be specific about visual details
- Keep it under 100 words
- Focus on what the image should LOOK like
- For people: include appearance, clothing, expression
- For objects/concepts: include materials, environment
- Add professional photography/art keywords

OUTPUT: Return ONLY the enhanced prompt text, nothing else.`;

        // Call Pollinations text API (simplified format)
        const textApiUrl = `https://text.pollinations.ai/${encodeURIComponent(enhancementPrompt)}`;
        const params = new URLSearchParams({
            model: model,
            seed: Math.floor(Math.random() * 1000000).toString(),
            key: apiKey
        });

        const fullUrl = `${textApiUrl}?${params}`;

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Accept': 'text/plain',
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Pollinations text API error: ${response.status} - ${errorText}`);

            // Fallback to basic enhancement if API fails
            console.log('⚠️ Using fallback enhancement');
            return NextResponse.json({
                success: true,
                originalPrompt: topic,
                enhancedPrompt: `${topic}${context ? `, ${context}` : ''}, professional photography, high quality, detailed, 8k`,
                model: 'fallback',
                usedSearch: false,
                fallback: true
            });
        }

        const enhancedPrompt = await response.text();
        console.log(`✅ Prompt enhanced (${enhancedPrompt.length} chars)`);

        return NextResponse.json({
            success: true,
            originalPrompt: topic,
            enhancedPrompt: enhancedPrompt.trim(),
            model,
            usedSearch: TEXT_MODELS[model].hasSearch,
            fallback: false
        });

    } catch (error: any) {
        console.error('💥 Error enhancing prompt:', error);

        return NextResponse.json(
            {
                error: error.message || 'Internal Server Error',
                details: error.stack
            },
            { status: 500 }
        );
    }
}
