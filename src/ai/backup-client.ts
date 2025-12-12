/**
 * Backup AI Client using Pollinations.ai
 * Provides a free fallback when the primary API quota is exceeded or fails.
 */

export async function generateContentWithBackup(
    systemPrompt: string,
    userPrompt: string
): Promise<any> {
    console.log("⚠️ Switching to Backup AI Provider (Pollinations.ai)...");

    try {
        const messages = [
            { role: 'system', content: systemPrompt + "\n\nIMPORTANT: You must return ONLY valid JSON. No markdown formatting, no code blocks, just the raw JSON object." },
            { role: 'user', content: userPrompt }
        ];

        // Pollinations.ai text generation endpoint
        // It's free and often uses models like GPT-4o-mini, Qwen, or Llama
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: messages,
                model: 'openai', // or 'mistral', 'llama' - openai usually maps to gpt-4o-mini equivalent
                json: true // Hint for JSON output
            }),
        });

        if (!response.ok) {
            throw new Error(`Backup API error: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();

        // Clean up any potential markdown formatting if the model ignored instructions
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanedText);
    } catch (error: any) {
        console.error("Backup AI Generation Failed:", error);
        // If even the backup fails, we have to throw
        throw new Error(`All AI providers failed. Primary: Quota/Error. Backup: ${error.message}`);
    }
}
