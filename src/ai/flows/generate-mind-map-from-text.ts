
'use server';

/**
 * @fileOverview Generates a mind map from a block of text.
 *
 * - generateMindMapFromText - A function that generates the mind map from text.
 */

import {
  GenerateMindMapFromTextInput,
  GenerateMindMapFromTextInputSchema,
  GenerateMindMapFromTextOutput,
  GenerateMindMapFromTextOutputSchema,
} from '@/ai/schemas/generate-mind-map-from-text-schema';

import { generateContent, AIProvider } from '@/ai/client-dispatcher';
import { analyzeDocument } from '@/knowledge-engine';

// Uses client-dispatcher with SKEE pre-analysis
export async function generateMindMapFromText(
  input: GenerateMindMapFromTextInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<GenerateMindMapFromTextOutput> {
  const { provider, apiKey, context, targetLang, text, persona, strict, depth = 'low' } = input;

  // Map depth to structural density
  let densityInstruction = '';
  if (depth === 'medium') {
    densityInstruction = 'STRUCTURE DENSITY: Generate EXACTLY 5 subTopics. Each subTopic MUST have EXACTLY 3 categories. Each category MUST have EXACTLY 3-4 subCategories. (Target: ~60 nodes)';
  } else if (depth === 'deep') {
    densityInstruction = 'STRUCTURE DENSITY: Generate EXACTLY 6 subTopics. Each subTopic MUST have EXACTLY 4 categories. Each category MUST have EXACTLY 5 subCategories. (Target: ~120 nodes)';
  } else {
    densityInstruction = 'STRUCTURE DENSITY: Generate 4 subTopics. Each subTopic should have 2 categories. Each category should have 3 subCategories. (Target: ~24 nodes)';
  }

  let personaInstruction = '';
  const p = (persona || '').toLowerCase();
  if (p === 'teacher') {
    personaInstruction = `
    ADOPT PERSONA: "Expert Teacher"
    - Use educational analogies to explain complex concepts found in the text.
    - Focus on "How" and "Why" in descriptions.
    - Structure sub-topics like a curriculum or learning path.
    - Descriptions should be encouraging and clear.`;
  } else if (p === 'concise') {
    personaInstruction = `
    ADOPT PERSONA: "Efficiency Expert"
    - Keep all text extracted from the source extremely brief.
    - Use fragments or high-impact keywords instead of long sentences.
    - Focus only on the most critical information from the text.
    - Descriptions should be very short (max 15 words).`;
  } else if (p === 'creative') {
    personaInstruction = `
    ADOPT PERSONA: "Creative Visionary"
    - Explore unique connections and innovative angles within the text.
    - Use vivid, evocative language in descriptions.
    - Highlight theoretical or "Innovation" aspects found in the content.
    - Make the content feel inspired and non-obvious.`;
  } else {
    personaInstruction = `
    ADOPT PERSONA: "Standard Academic Assistant"
    - Provide a balanced and well-structured overview of the provided text.
    - Use clear, professional, yet accessible language.
    - Ensure comprehensive coverage of all key points in the text.
    - Keep descriptions highly focused and exactly one sentence.`;
  }

  const contextInstruction = context
    ? `The user has provided the following additional context or instructions, which you should prioritize: "${context}"`
    : '';

  const targetLangInstruction = targetLang
    ? `The entire mind map, including all topics, categories, and descriptions, MUST be in the following language: ${targetLang}.`
    : `The entire mind map MUST be in English.`;

  // ── SKEE: Deterministic Document Analysis ──
  const skeeResult = analyzeDocument(text);
  const hasStructure = skeeResult.structuredContext.length > 0;

  if (hasStructure) {
    console.log(`🧠 SKEE Analysis (text flow):`, skeeResult.stats);
  }

  const skeeSection = hasStructure
    ? `
    **PRE-ANALYZED DOCUMENT STRUCTURE (use as structural guide)**:
    The following analysis was extracted algorithmically from the text.
    Use this as the PRIMARY scaffold for your mind map hierarchy.

    ${skeeResult.structuredContext}
    ---
    IMPORTANT: Your subTopics SHOULD align with the detected sections above.
    Your categories and subCategories SHOULD reflect the key concepts and relationships found.`
    : '';

  const systemPrompt = `You are an expert in analyzing text and creating structured, comprehensive mind maps from it.
  
    ${personaInstruction}
  
    Analyze the provided text and generate a detailed, multi-layered mind map based on its content. 
    ${skeeSection}

    **DOCUMENT STRUCTURAL AWARENESS**:
    - Look for structural markers like "Chapter", "Section", "Title", or bolded headers to define your \`subTopics\`.
    - If the text has a clear Table of Contents or logical flow, MIRROR that structure in the mind map.
    - Treat double newlines as potential section breaks.

    **ENTITY EXTRACTION RULE**: 
    - For structured docs (IDs, Invoices, Resumes): Extract ACTUAL values (e.g., "Invoice #: 12345").
    - DO NOT use generic placeholders if literal data is available.

    **FOR GENERAL TEXTS**:
    - Prioritize information density and logical hierarchy.
    - Each \`subCategory\` MUST contain a specific fact, definition, or takeaway from the text.
    - Avoid repetitive or redundant nodes.
    - If the text is long, synthesize the core message of each section.

    ${densityInstruction}
  
    ${contextInstruction}
  
    ${targetLangInstruction}
  
    The mind map must have the following structure:
    - Topic: The main topic identified from the text. If the user provided context, use it to refine the topic.
    - ShortTitle: A condensed, catchy, and smart version (max 2-4 words) for focused display.
    - Icon: A relevant icon name from the lucide-react library, in kebab-case (e.g., "file-text").
    - Sub-Topics: A list of at least 4-5 main sub-topics.
      - name: The title of the sub-topic.
      - icon: A relevant lucide-react icon for each sub-topic.
    - Categories: For each sub-topic, a list of 3-4 categories.
      - name: The title of the category.
      - icon: A relevant lucide-react icon for each category.
    - Sub-Categories: For each category, a list of at least 4-5 detailed sub-categories.
      - name: The title of the sub-category.
      - description: A concise statement (exactly one sentence) of each sub-category, using data from the text.
      - icon: A relevant lucide-react icon for each sub-category.
      - tags: A list of 2-3 relevant keywords or tags for the sub-category.
  
    The output must be a valid JSON object that strictly adheres to the provided output schema. Do not include any extra text or explanations outside the JSON structure.`;

  const userPrompt = `Text to analyze:\n---\n${text}\n---`;


  const maxAttempts = 1;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await generateContent({
        provider,
        apiKey,
        systemPrompt,
        userPrompt,
        schema: GenerateMindMapFromTextOutputSchema,
        strict
      });

      return result;
    } catch (e: any) {
      lastError = e;
      console.error(`❌ Text-to-map generation attempt ${attempt} failed:`, e.message);
      if (attempt === maxAttempts) throw e;
      await new Promise(res => setTimeout(res, 1000));
    }
  }

  throw lastError || new Error('Text-to-map generation failed');
}
