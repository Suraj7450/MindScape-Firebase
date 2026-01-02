
import { enhanceImagePromptAction } from '@/app/actions';
import { NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

const pollinationsModels = ['turbo', 'stable-diffusion', 'flux'];

export async function POST(req: Request) {
  try {
    const { prompt, size, style, provider } = await req.json();

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
        { provider: (provider === 'gemini' ? 'gemini' : 'pollinations') }
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

async function generateWithPollinations(prompt: string, size?: string) {
  const [width, height] = (size || '1024x1024').split('x').map(Number);
  let lastError: any = null;

  for (const model of pollinationsModels) {
    try {
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&nologo=true`;

      const imageResponse = await fetch(imageUrl);

      if (!imageResponse.ok) {
        console.warn(`Pollinations model ${model} failed with status: ${imageResponse.status}`);
        lastError = new Error(`Pollinations (${model}) failed with status: ${imageResponse.status}`);
        continue;
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      const dataUri = `data:${contentType};base64,${base64Image}`;

      return NextResponse.json({ images: [dataUri] });

    } catch (error) {
      lastError = error;
      console.warn(`Pollinations model ${model} error:`, error);
    }
  }

  throw lastError || new Error('All Pollinations models failed');
}
