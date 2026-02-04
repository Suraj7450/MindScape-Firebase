import { NextResponse } from 'next/server';

// Available Pollinations models with pricing
const POLLINATIONS_MODELS = {
  'flux': { cost: 0.0002, quality: 'high', description: 'Flux Schnell - Fast & High Quality' },
  'zimage': { cost: 0.0002, quality: 'fast', description: 'Z-Image Turbo - Fast Alternative' },
  'klein': { cost: 0.008, quality: 'premium', description: 'FLUX.2 Klein 4B - Premium Quality' },
  'klein-large': { cost: 0.012, quality: 'ultra', description: 'FLUX.2 Klein 9B - Ultra Quality' },
  'kontext': { cost: 0.04, quality: 'contextual', description: 'FLUX.1 Kontext - Contextual' }
} as const;

type ModelName = keyof typeof POLLINATIONS_MODELS;

interface GenerateImageRequest {
  prompt: string;
  model?: ModelName;
  width?: number;
  height?: number;
  userId?: string;
  userApiKey?: string;
}

/**
 * Enhance prompt with cinematic 3D render effects
 * Detects if prompt is about people/figures and adjusts accordingly
 */
function enhanceCinematicPrompt(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  // Keywords that indicate the prompt is about a person or figure
  const personKeywords = [
    'person', 'people', 'man', 'woman', 'leader', 'figure', 'celebrity',
    'scientist', 'artist', 'politician', 'entrepreneur', 'founder', 'ceo',
    'president', 'king', 'queen', 'emperor', 'philosopher', 'inventor',
    'author', 'writer', 'actor', 'musician', 'athlete', 'coach', 'teacher',
    'doctor', 'engineer', 'designer', 'developer', 'researcher', 'professor',
    // Historical figures
    'einstein', 'newton', 'tesla', 'jobs', 'gates', 'musk', 'bezos',
    'gandhi', 'lincoln', 'washington', 'churchill', 'napoleon', 'caesar',
    'da vinci', 'michelangelo', 'shakespeare', 'beethoven', 'mozart',
    // Generic person indicators
    'he ', 'she ', 'his ', 'her ', 'him ', 'himself', 'herself'
  ];

  const isPerson = personKeywords.some(keyword => lowerPrompt.includes(keyword));

  if (isPerson) {
    // For people: focus on portrait photography style
    return `${prompt}, professional portrait photography, dramatic studio lighting, high detail facial features, cinematic composition, 8k quality, photorealistic, sharp focus, professional headshot style, magazine cover quality`;
  } else {
    // For objects/concepts: use 3D render style
    return `${prompt}, cinematic lighting, 3D render, octane render, ultra detailed, 8k quality, dramatic shadows, depth of field, photorealistic, professional photography`;
  }
}

/**
 * POST /api/generate-image
 * 
 * Generate images using Pollinations.ai API
 * Supports user API keys with fallback to server key
 */
export async function POST(req: Request) {
  try {
    const body: GenerateImageRequest = await req.json();
    const {
      prompt,
      model = 'flux',
      width = 1024,
      height = 1024,
      userApiKey
    } = body;

    // Validate inputs
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!POLLINATIONS_MODELS[model]) {
      return NextResponse.json(
        { error: `Invalid model. Available models: ${Object.keys(POLLINATIONS_MODELS).join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`🎨 Generating image with model: ${model}`);

    // Determine which API key to use (user key takes priority)
    const apiKey = userApiKey || process.env.POLLINATIONS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API key available. Please add your Pollinations API key in your profile settings.' },
        { status: 401 }
      );
    }

    // Enhance prompt for cinematic effect
    const enhancedPrompt = enhanceCinematicPrompt(prompt);

    // Build Pollinations API URL
    // We'll use the query param key as a fallback, but Bearer token is preferred in docs
    const baseUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(enhancedPrompt)}`;
    const params = new URLSearchParams({
      model,
      width: width.toString(),
      height: height.toString(),
      nologo: 'true',
      seed: Math.floor(Math.random() * 1000000).toString()
    });

    const imageUrl = `${baseUrl}?${params}`;
    console.log(`🔗 Generation Request: ${imageUrl.substring(0, 150)}...`);

    // Call Pollinations API with Bearer token authentication
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'image/jpeg, image/png'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Pollinations API error: ${response.status} - ${errorText}`);

      return NextResponse.json(
        {
          error: `Image generation failed: ${response.status}`,
          details: errorText,
          suggestion: response.status === 401
            ? 'Invalid API key or insufficient balance. Please check your Pollinations account.'
            : 'Please try again or select a different model.'
        },
        { status: response.status }
      );
    }

    // Verify the response is an image
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      console.warn(`⚠️ Unexpected content type: ${contentType}`);
    }

    // Convert image buffer to base64 data URL
    // This is the most reliable way to return the image to the client
    // because it avoids a second unauthenticated request from the browser
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64Image}`;

    console.log(`✅ Image generated and converted to Base64 (${Math.round(buffer.length / 1024)} KB)`);

    // Calculate cost based on our internal tracker
    const modelInfo = POLLINATIONS_MODELS[model];

    return NextResponse.json({
      success: true,
      imageUrl: dataUrl, // Return the actual data URL
      model,
      cost: modelInfo.cost,
      quality: modelInfo.quality,
      size: {
        width,
        height
      },
      usingUserKey: !!userApiKey
    });

  } catch (error: any) {
    console.error('💥 Error generating image:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal Server Error',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate-image/models
 * 
 * Get list of available models
 */
export async function GET() {
  return NextResponse.json({
    models: Object.entries(POLLINATIONS_MODELS).map(([name, info]) => ({
      name,
      ...info
    }))
  });
}
