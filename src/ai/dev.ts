
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-mind-map.ts';
import '@/ai/flows/generate-mind-map-from-image.ts';
import '@/ai/flows/generate-mind-map-from-text.ts';
import '@/ai/flows/explain-mind-map-node.ts';
import '@/ai/flows/chat-with-assistant.ts';
import '@/ai/flows/translate-mind-map.ts';
import '@/ai/flows/explain-with-example.ts';
import '@/ai/flows/summarize-chat.ts';
import '@/ai/flows/enhance-image-prompt.ts';
import '@/app/actions.ts';
