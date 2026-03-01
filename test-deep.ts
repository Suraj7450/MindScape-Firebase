import { generateMindMap } from './src/ai/flows/generate-mind-map';

async function run() {
    try {
        const res = await generateMindMap({
            topic: 'Space Exploration',
            depth: 'deep',
            persona: 'Teacher'
        });
        console.log(JSON.stringify(res, null, 2));
    } catch (e) {
        if (e instanceof Error) {
            console.error('Error MESSAGE:', e.message);
            console.error('Error STACK:', e.stack);
        } else {
            console.error('Error:', e);
        }
    }
}

run();
