
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

    // 1. Enhance the user's prompt
    const { enhancedPrompt, error: enhanceError } =
      await enhanceImagePromptAction(
        { prompt, style },
        // Pass provider from request if valid, otherwise undefined (defaults to Pollinations)
        {
          provider: (provider === 'gemini' ? 'gemini' : 'pollinations'),
          apiKey: provider === 'pollinations' ? apiKey : undefined
        }
      );

    if (enhanceError || !enhancedPrompt) {
      throw new Error(
        enhanceError || 'Failed to enhance prompt before generation.'
      );
    }

    const finalPrompt = enhancedPrompt.enhancedPrompt || prompt;

    return await generateWithPollinations(finalPrompt, size);

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

  // Refined model list with latest stable Pollinations options
  // Refined model list with latest stable Pollinations options from dashboard
  const reliableModels = ['flux', 'zimage', 'turbo', 'klein', 'gptimage'];
  let lastError: any = null;

  for (const model of reliableModels) {
    try {
      const encodedPrompt = encodeURIComponent(prompt);
      // use the standard image.pollinations.ai endpoint
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&nologo=true`;

      console.log(`🎨 Attempting image generation with model: ${model}`);

      const effectiveApiKey = apiKey || process.env.POLLINATIONS_API_KEY;
      const imageResponse = await fetch(imageUrl, {
        headers: {
          ...(effectiveApiKey ? { 'Authorization': `Bearer ${effectiveApiKey}` } : {})
        }
      });

      if (!imageResponse.ok) {
        const statusText = await imageResponse.text().catch(() => imageResponse.statusText);
        console.warn(`⚠️ Pollinations model ${model} failed: ${imageResponse.status} ${statusText}`);
        lastError = new Error(`Pollinations (${model}) failed: ${imageResponse.status}`);
        continue;
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      if (imageBuffer.byteLength < 100) {
        throw new Error("Received empty or invalid image buffer");
      }

      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      const dataUri = `data:${contentType};base64,${base64Image}`;

      return NextResponse.json({ images: [dataUri] });

    } catch (error) {
      lastError = error;
      console.warn(`❌ Pollinations model ${model} error:`, error);
    }
  }

  throw lastError || new Error('All Pollinations image models failed');
}

