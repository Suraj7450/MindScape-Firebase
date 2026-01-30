
import { enhanceImagePromptAction } from '@/app/actions';
import { NextResponse } from 'next/server';

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

    // 1. Enhance the user's prompt - exclusively use Pollinations
    const { enhancedPrompt, error: enhanceError } =
      await enhanceImagePromptAction(
        { prompt, style },
        {
          provider: 'pollinations',
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
  // Flux is best quality, Turbo is fastest fallback.
  const reliableModels = ['flux', 'turbo', 'flux-pro', 'gptimage', 'zimage'];

  const clientKey = (apiKey && apiKey.trim() !== "") ? apiKey : null;
  const serverKey = process.env.POLLINATIONS_API_KEY;
  let useServerKeyOnly = false;

  for (const model of reliableModels) {
    try {
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&nologo=true&enhance=false&seed=${Math.floor(Math.random() * 1000000)}`;

      const effectiveApiKey = (!useServerKeyOnly && clientKey) ? clientKey : serverKey;
      const keySource = (effectiveApiKey === clientKey) ? 'Client' : 'Server Env';

      console.log(`🎨 Attempting image generation with model: ${model} (12s timeout) using ${keySource} key`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        const imageResponse = await fetch(imageUrl, {
          signal: controller.signal,
          headers: {
            ...(effectiveApiKey ? { 'Authorization': `Bearer ${effectiveApiKey}` } : {})
          }
        });

        clearTimeout(timeoutId);

        if (!imageResponse.ok) {
          const status = imageResponse.status;
          const statusText = await imageResponse.text().catch(() => imageResponse.statusText);

          // Handle invalid API key or exhausted balance
          if ((status === 401 || status === 403) && effectiveApiKey === clientKey && serverKey && serverKey !== clientKey) {
            console.warn(`⚠️ Client API Key failed for image generation (${status}). Retrying same model with Server API Key...`);
            useServerKeyOnly = true; // Switch to server key for this and future attempts

            // Retry the current model immediately with server key
            const retryResponse = await fetch(imageUrl, {
              headers: {
                ...(serverKey ? { 'Authorization': `Bearer ${serverKey}` } : {})
              }
            });

            if (retryResponse.ok) {
              return NextResponse.json({ images: [imageUrl] });
            }
            console.warn(`⚠️ Server API Key also failed for ${model}: ${retryResponse.status}`);
          } else {
            console.warn(`⚠️ Pollinations model ${model} failed: ${status} ${statusText}`);
          }
          continue;
        }

        return NextResponse.json({ images: [imageUrl] });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn(`🕒 Model ${model} timed out`);
        } else {
          throw err;
        }
      }
    } catch (error) {
      console.warn(`❌ Pollinations model ${model} error:`, error);
    }
  }

  console.log('🛡️ All AI models failed, providing Premium SVG fallback');
  const fallbackSvg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="premiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#1e1b4b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#312e81;stop-opacity:1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="15" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#premiumGrad)" />
      
      <!-- Subtle Decorative Circles -->
      <circle cx="${width * 0.8}" cy="${height * 0.2}" r="${width * 0.3}" fill="#c084fc" opacity="0.05" />
      <circle cx="${width * 0.2}" cy="${height * 0.8}" r="${width * 0.3}" fill="#818cf8" opacity="0.05" />
      
      <!-- Icon representation (Sparkle) -->
      <path d="M${width / 2} ${height / 2 - 40} L${width / 2 + 10} ${height / 2 - 10} L${width / 2 + 40} ${height / 2} L${width / 2 + 10} ${height / 2 + 10} L${width / 2} ${height / 2 + 40} L${width / 2 - 10} ${height / 2 + 10} L${width / 2 - 40} ${height / 2} L${width / 2 - 10} ${height / 2 - 10} Z" fill="#a78bfa" opacity="0.5" filter="url(#glow)" />

      <text x="50%" y="55%" font-family="system-ui, -apple-system, sans-serif" font-size="32" fill="white" text-anchor="middle" font-weight="900" style="letter-spacing: 0.1em; text-transform: uppercase;">Awaiting Vision</text>
      <text x="50%" y="62%" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle" font-weight="500">AI nodes are currently saturated</text>
      
      <rect x="${width / 2 - 100}" y="${height * 0.8}" width="200" height="2" fill="white" opacity="0.1" />
      <text x="50%" y="${height * 0.85}" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#6366f1" text-anchor="middle" font-weight="bold" style="letter-spacing: 0.3em; text-transform: uppercase;">MindScape Intelligent Frame</text>
    </svg>
  `;
  const base64Svg = Buffer.from(fallbackSvg).toString('base64');
  return NextResponse.json({ images: [`data:image/svg+xml;base64,${base64Svg}`] });
}

