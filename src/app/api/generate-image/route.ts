
import { enhanceImagePromptAction } from '@/app/actions';
import { NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

const pollinationsModels = ['flux', 'turbo', 'gptimage', 'kontext', 'seedream', 'nanobanana'];

export async function POST(req: Request) {
  try {
    const { prompt, size, style, provider, apiKey } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt text' },
        { status: 400 }
      );
    }

    // 1. Enhance the user's prompt - strictly avoid direct Gemini
    const { enhancedPrompt, error: enhanceError } =
      await enhanceImagePromptAction(
        { prompt, style },
        {
          provider: 'pollinations',
          model: provider === 'gemini' ? 'gemini' : undefined,
          apiKey: apiKey
        }
      );

    if (enhanceError || !enhancedPrompt) {
      throw new Error(
        enhanceError || 'Failed to enhance prompt before generation.'
      );
    }

    const finalPrompt = enhancedPrompt.enhancedPrompt || prompt;

    return await generateWithPollinations(finalPrompt, size, apiKey);

  } catch (error: any) {
    console.error('💥 Error in /api/generate-image:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function generateWithPollinations(prompt: string, size?: string, apiKey?: string) {
  const [width, height] = (size || '1024x1024').split('x').map(Number);
  const reliableModels = ['flux', 'flux-pro', 'turbo', 'gptimage', 'zimage'];
  let lastError: any = null;

  for (const model of reliableModels) {
    try {
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

      console.log(`🎨 Attempting image generation with model: ${model} (20s timeout)`);

      const effectiveApiKey = apiKey || process.env.POLLINATIONS_API_KEY;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const imageResponse = await fetch(imageUrl, {
          signal: controller.signal,
          headers: {
            ...(effectiveApiKey ? { 'Authorization': `Bearer ${effectiveApiKey}` } : {})
          }
        });

        clearTimeout(timeoutId);

        if (!imageResponse.ok) {
          const statusText = await imageResponse.text().catch(() => imageResponse.statusText);
          console.warn(`⚠️ Pollinations model ${model} failed: ${imageResponse.status} ${statusText}`);
          continue;
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        if (imageBuffer.byteLength < 100) continue;

        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        return NextResponse.json({ images: [`data:${contentType};base64,${base64Image}`] });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn(`🕒 Model ${model} timed out`);
        } else {
          throw err;
        }
      }
    } catch (error) {
      lastError = error;
      console.warn(`❌ Pollinations model ${model} error:`, error);
    }
  }

  console.log('🛡️ All AI models failed, providing SVG fallback');
  const fallbackSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e1b4b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#4c1d95;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <text x="50%" y="45%" font-family="Arial" font-size="40" fill="white" text-anchor="middle" font-weight="bold">AI is highly busy ✨</text>
      <text x="50%" y="55%" font-family="Arial" font-size="24" fill="#a78bfa" text-anchor="middle">${prompt.substring(0, 30)}...</text>
      <text x="50%" y="80%" font-family="Arial" font-size="16" fill="#6d28d9" text-anchor="middle">MindScape Intelligent Fallback</text>
    </svg>
  `;
  const base64Svg = Buffer.from(fallbackSvg).toString('base64');
  return NextResponse.json({ images: [`data:image/svg+xml;base64,${base64Svg}`] });
}

