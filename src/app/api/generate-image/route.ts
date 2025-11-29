
import { enhanceImagePromptAction } from '@/app/actions';
import { NextResponse } from 'next/server';

const modelsToTry = ['stable-diffusion', 'flux', 'turbo'];

export async function POST(req: Request) {
  try {
    const { prompt, size, style } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt text' },
        { status: 400 }
      );
    }

    // 1. Enhance the user's prompt
    const { enhancedPrompt, error: enhanceError } =
      await enhanceImagePromptAction({ prompt, style });

    if (enhanceError || !enhancedPrompt) {
      throw new Error(
        enhanceError || 'Failed to enhance prompt before generation.'
      );
    }

    const finalPrompt = enhancedPrompt.enhancedPrompt;
    const [width, height] = (size || '1024x1024').split('x').map(Number);
    
    let lastError: any = null;

    // 2. Try generating the image with the fallback models
    for (const model of modelsToTry) {
      try {
        const encodedPrompt = encodeURIComponent(finalPrompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&nologo=true`;

        const imageResponse = await fetch(imageUrl);

        if (!imageResponse.ok) {
          // Log the error and try the next model
          console.warn(`Model ${model} failed with status: ${imageResponse.status}`);
          lastError = new Error(`Pollinations API (${model}) failed with status: ${imageResponse.status}`);
          continue; // Try next model
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const contentType =
          imageResponse.headers.get('content-type') || 'image/jpeg';
        const dataUri = `data:${contentType};base64,${base64Image}`;

        // If successful, return the image
        return NextResponse.json({ images: [dataUri] });

      } catch (error) {
        lastError = error;
        console.warn(`An error occurred with model ${model}:`, error);
      }
    }
    
    // If all models failed, throw the last recorded error
    if (lastError) {
      throw lastError;
    }

    // Fallback error if no models succeed for an unknown reason
    throw new Error('All image generation models failed.');

  } catch (error: any) {
    console.error('💥 Error in /api/generate-image:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
