import { NextResponse } from 'next/server';

// Available Pollinations models with pricing
const POLLINATIONS_MODELS = {
  'flux': { cost: 0.0002, quality: 'high', description: 'Flux Schnell - High Quality & Rapid Speed' },
  'zimage': { cost: 0.0002, quality: 'fast', description: 'Z-Image Turbo - Maximum Performance' },
  'klein': { cost: 0.008, quality: 'premium', description: 'FLUX.2 Klein 4B - Premium Professional Quality' },
  'klein-large': { cost: 0.012, quality: 'ultra', description: 'FLUX.2 Klein 9B - Ultra Cinematic Quality' },
  'gptimage': { cost: 0.0133, quality: 'balanced', description: 'GPT Image 1 Mini - Balanced & Logical' }
} as const;

type ModelName = keyof typeof POLLINATIONS_MODELS | string;

interface GenerateImageRequest {
  prompt: string;
  model?: string;
  style?: string;
  composition?: string;
  mood?: string;
  width?: number;
  height?: number;
  userId?: string;
  userApiKey?: string;
}

/**
 * Enhance prompt with style-specific keywords or cinematic defaults
 */
function applyStyleToPrompt(prompt: string, style?: string, composition?: string, mood?: string): string {
  const lowerPrompt = prompt.toLowerCase();
  let enhancedPrompt = prompt;

  // Add composition keywords
  if (composition && composition !== 'none') {
    const compKeywords: Record<string, string> = {
      'close-up': 'extreme close-up shot, detailed textures, shallow depth of field',
      'wide-shot': 'wide cinematic pan, sweeping landscape composition, expansive view',
      'bird-eye': 'overlooking bird\'s eye view from above, high angle perspective',
      'macro': 'macro photography, extreme detail, focused on tiny intricate features',
      'low-angle': 'heroic low angle shot, looking up, imposing perspective'
    };
    if (compKeywords[composition]) enhancedPrompt += `, ${compKeywords[composition]}`;
  }

  // Add mood keywords
  if (mood && mood !== 'none') {
    const moodKeywords: Record<string, string> = {
      'golden-hour': 'golden hour sunset lighting, warm orange glow, long soft shadows',
      'rainy': 'heavy rain, wet surfaces, moody gray lighting, atmospheric droplets',
      'foggy': 'dense mysterious fog, low visibility, soft ethereal atmosphere',
      'neon': 'vibrant neon lighting, glowing signs, cyberpunk night aesthetic',
      'mystical': 'ethereal magical glow, dreamlike lighting, glowing particles',
      'nocturnal': 'dark midnight lighting, moonlight shadows, deep blue atmosphere'
    };
    if (moodKeywords[mood]) enhancedPrompt += `, ${moodKeywords[mood]}`;
  }

  // If a specific style is provided, prioritize it
  if (style && style !== 'none' && style !== 'cinematic') {
    const styleKeywords: Record<string, string> = {
      'anime': 'Studio Ghibli aesthetic, hand-painted textures, vibrant cel-shading, high detail anime style',
      '3d-render': 'Unreal Engine 5 aesthetic, Octane render, ray-tracing, intricate PBR materials, digital perfection',
      'cyberpunk': 'Neon noir lighting, rainy streets, holographic interfaces, vibrant pink and blue color palette',
      'minimalist': 'Clean lines, negative space, soft neutral colors, elegant simplicity, high-end design',
      'watercolor': 'Soft bleeding edges, textured paper, vibrant washes, artistic hand-painted watercolor style',
      'pencil': 'Fine graphite lines, cross-hatching, realistic shading, hand-drawn pencil sketch aesthetic',
      'polaroid': 'Vintage film grain, washed out colors, soft focus, authentic nostalgic polaroid photo look',
      'pop-art': 'Bold halftone patterns, vibrant saturated colors, thick black outlines, Andy Warhol aesthetic',
      'oil-painting': 'Rich impasto textures, visible brushstrokes, classic canvas feel, masterwork oil painting',
      'pixel-art': 'Sharp 16-bit sprites, limited color palette, clean grid alignment, retro gaming aesthetic'
    };

    const keywords = styleKeywords[style] || '';
    if (keywords) enhancedPrompt += `, ${keywords}`;
  } else if (!style || style === 'cinematic') {
    // Fallback to the existing person-aware cinematic enhancement if no major style is set
    const personKeywords = [
      'person', 'people', 'man', 'woman', 'leader', 'figure', 'celebrity',
      'scientist', 'artist', 'politician', 'entrepreneur', 'founder', 'ceo',
      'president', 'king', 'queen', 'emperor', 'philosopher', 'inventor',
      'author', 'writer', 'actor', 'musician', 'athlete', 'coach', 'teacher',
      'doctor', 'engineer', 'designer', 'developer', 'researcher', 'professor',
      'einstein', 'newton', 'tesla', 'jobs', 'gates', 'musk', 'bezos',
      'gandhi', 'lincoln', 'washington', 'churchill', 'napoleon', 'caesar',
      'da vinci', 'michelangelo', 'shakespeare', 'beethoven', 'mozart',
      'he ', 'she ', 'his ', 'her ', 'him ', 'himself', 'herself'
    ];

    const isPerson = personKeywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(lowerPrompt);
    });

    if (isPerson) {
      enhancedPrompt += ', professional portrait photography, dramatic studio lighting, high detail, cinematic composition, 8k quality, photorealistic';
    } else {
      enhancedPrompt += ', cinematic lighting, 3D render, octane render, ultra detailed, 8k quality, dramatic shadows';
    }
  }

  return enhancedPrompt;
}

/**
 * Model registry for rotation
 */
const MODEL_ROTATION_ORDER = ['flux', 'klein', 'klein-large', 'zimage', 'gptimage'];


/**
 * POST /api/generate-image
 * 
 * Generate images using Pollinations.ai API
 * Supports user API keys with fallback to server key
 */
export async function POST(req: Request) {
  try {
    // Safety check: ensure body is present to avoid "Unexpected end of JSON input"
    if (!req.body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    let body: GenerateImageRequest;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const {
      prompt,
      model = 'klein',
      style,
      composition,
      mood,
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

    // Relaxed model validation
    const isValidModel = !!(POLLINATIONS_MODELS as any)[model];

    // If not a known model and no user API key, block it
    if (!isValidModel && !userApiKey) {
      return NextResponse.json(
        { error: `Invalid model for guest generation. Available models: ${Object.keys(POLLINATIONS_MODELS).join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`🎨 Generating image with model: ${model} (${userApiKey ? 'User Key' : 'Server Key'})`);

    // Determine which API key to use (user key takes priority)
    const apiKey = userApiKey || process.env.POLLINATIONS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API key available. Please add your Pollinations API key in your profile settings.' },
        { status: 401 }
      );
    }

    // Enhance prompt using the new style-aware logic
    const enhancedPrompt = applyStyleToPrompt(prompt, style, composition, mood);

    // Implement model rotation for higher success rate
    let currentModel = model;
    let rotationIndex = 0;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`🎨 Attempt ${attempt + 1}: Generating image with model: ${currentModel}`);

        // Build Pollinations API URL
        const baseUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(enhancedPrompt)}`;
        const params = new URLSearchParams({
          model: currentModel,
          width: width.toString(),
          height: height.toString(),
          nologo: 'true',
          seed: Math.floor(Math.random() * 1000000).toString()
        });

        const imageUrl = `${baseUrl}?${params}`;

        const response = await fetch(imageUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'image/jpeg, image/png'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          const isModeration = errorText.includes('moderation_blocked') || errorText.includes('safety system');

          console.error(`❌ Pollinations API error [Model: ${currentModel}]: ${response.status} - ${errorText.substring(0, 100)}...`);

          if (attempt < maxRetries - 1) {
            // Rotate to next model in list
            rotationIndex = (rotationIndex + 1) % MODEL_ROTATION_ORDER.length;
            currentModel = MODEL_ROTATION_ORDER[rotationIndex];
            console.warn(`🔄 Rotating to next model: ${currentModel} due to ${isModeration ? 'moderation' : 'API error'}...`);

            // Add a small delay before retry to handle transient 500 errors
            await new Promise(resolve => setTimeout(resolve, 1500));
            continue;
          }

          return NextResponse.json(
            {
              error: `Image generation failed: ${response.status}`,
              details: errorText,
              suggestion: response.status === 401
                ? 'Invalid API key or insufficient balance.'
                : 'Moderation or capacity error. Please try a more general prompt.'
            },
            { status: response.status }
          );
        }

        // Success! Convert to base64
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');
        const dataUrl = `data:${contentType};base64,${base64Image}`;

        console.log(`✅ Image generated with model ${currentModel} (${Math.round(buffer.length / 1024)} KB)`);

        return NextResponse.json({
          success: true,
          imageUrl: dataUrl,
          model: currentModel,
          cost: (POLLINATIONS_MODELS as any)[currentModel]?.cost || 0.04,
          quality: (POLLINATIONS_MODELS as any)[currentModel]?.quality || 'custom',
          size: { width, height },
          usingUserKey: !!userApiKey
        });

      } catch (error: any) {
        console.error(`💥 Error in attempt ${attempt + 1}:`, error);
        if (attempt === maxRetries - 1) throw error;
      }
    }

    return NextResponse.json({ error: 'Failed after multiple attempts' }, { status: 500 });

  } catch (error: any) {
    console.error('💥 Fatal error generating image:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
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
