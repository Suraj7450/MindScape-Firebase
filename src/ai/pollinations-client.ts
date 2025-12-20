/**
 * AI Client using Pollinations.ai
 * Provides free text and image generation using open source models.
 */

export async function generateContentWithPollinations(
    systemPrompt: string,
    userPrompt: string,
    images?: { inlineData: { mimeType: string, data: string } }[]
): Promise<any> {
    // console.log("Using Pollinations.ai..."); 

    try {
        const messages: any[] = [
            { role: 'system', content: systemPrompt + "\n\nIMPORTANT: You must return ONLY valid JSON. No markdown formatting, no code blocks, just the raw JSON object." }
        ];

        // Construct user message with potential images
        const userContent: any[] = [{ type: 'text', text: userPrompt }];

        if (images && images.length > 0) {
            images.forEach(img => {
                userContent.push({
                    type: 'image_url',
                    image_url: {
                        url: `data:${img.inlineData.mimeType};base64,${img.inlineData.data}`
                    }
                });
            });
        }

        messages.push({ role: 'user', content: userContent });

        // Pollinations.ai text generation endpoint
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: messages,
                model: 'openai',
                json: true
            }),
        });

        if (!response.ok) {
            throw new Error(`Pollinations API error: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();

        // Clean up any potential markdown formatting if the model ignored instructions
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanedText);
    } catch (error: any) {
        console.error("Pollinations AI Generation Failed:", error);
        throw new Error(`Pollinations API failed: ${error.message}`);
    }
}
