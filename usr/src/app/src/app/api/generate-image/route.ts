
'use server';

import { enhanceImagePromptAction } from '@/app/actions';
import { NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

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

    // 2. Generate the image with Imagen 4
    const { media, finishReason, usage } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: finalPrompt,
    });
    
    if (finishReason !== 'stop' || !media.url) {
        throw new Error('Image generation failed. The model did not produce an image.');
    }

    // The media.url is already a data URI (e.g., 'data:image/png;base64,...')
    const dataUri = media.url;
    
    // Return the generated image data URI
    return NextResponse.json({ images: [dataUri] });

  } catch (error: any) {
    console.error('💥 Error in /api/generate-image:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
