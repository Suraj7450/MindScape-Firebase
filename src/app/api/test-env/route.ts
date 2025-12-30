import { NextResponse } from 'next/server';

/**
 * Test endpoint to verify environment variables are loaded
 * Access at: http://localhost:3000/api/test-env
 */
export async function GET() {
    const diagnostics = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        apis: {
            gemini: {
                configured: !!process.env.GOOGLE_GENAI_API_KEY,
                keyPrefix: process.env.GOOGLE_GENAI_API_KEY
                    ? process.env.GOOGLE_GENAI_API_KEY.substring(0, 10) + '...'
                    : 'NOT SET',
                status: process.env.GOOGLE_GENAI_API_KEY ? '✅ Ready' : '❌ Missing'
            },
            bytez: {
                configured: !!process.env.BYTEZ_API_KEY,
                keyPrefix: process.env.BYTEZ_API_KEY
                    ? process.env.BYTEZ_API_KEY.substring(0, 10) + '...'
                    : 'NOT SET',
                status: process.env.BYTEZ_API_KEY ? '✅ Ready' : '❌ Missing'
            }
        },
        instructions: {
            missing_keys: !process.env.GOOGLE_GENAI_API_KEY || !process.env.BYTEZ_API_KEY
                ? [
                    '1. Create a .env.local file in your project root',
                    '2. Add: GOOGLE_GENAI_API_KEY=your-key-here',
                    '3. Add: BYTEZ_API_KEY=your-key-here',
                    '4. Restart the dev server (npm run dev)',
                    '5. Refresh this page to verify'
                ]
                : ['✅ All API keys are configured!'],
            get_keys: {
                gemini: 'https://aistudio.google.com/app/apikey',
                bytez: 'https://bytez.com'
            }
        }
    };

    return NextResponse.json(diagnostics, {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        }
    });
}
