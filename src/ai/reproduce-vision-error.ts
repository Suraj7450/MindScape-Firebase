import { generateContentWithPollinations } from './pollinations-client';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testVision() {
    console.log('🧪 Testing Vision Generation with Pollinations...');
    // Small transparent pixel to test image input logic
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    try {
        const result = await generateContentWithPollinations(
            'Describe this image briefly in JSON format: {"description": "..."}',
            'What is in this image?',
            [{ inlineData: { mimeType: 'image/png', data: base64Image } }],
            {
                model: 'gemini',
                response_format: { type: 'json_object' }
            }
        );
        console.log('✅ Vision Result:', result);
    } catch (error: any) {
        console.error('❌ Vision Test Failed:', error.message);
        if (error.stack) {
            // console.error(error.stack);
        }
    }
}

testVision();
