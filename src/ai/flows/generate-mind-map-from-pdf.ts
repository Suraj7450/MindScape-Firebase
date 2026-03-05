
'use server';

/**
 * @fileOverview Production-grade multi-stage PDF → MindMap pipeline.
 *
 * Pipeline: Clean → Chunk → Summarize (parallel) → SKEE Analysis → Generate → Validate
 *
 * SKEE (Smart Knowledge Extraction Engine) adds a deterministic structure
 * analysis layer that detects headings, extracts keywords, and identifies
 * relationships to provide structured scaffolding for the AI generation step.
 */

import { cleanPDFText } from '@/lib/text-cleaner';
import { chunkText } from '@/lib/text-chunker';
import { summarizeChunksParallel } from '@/ai/flows/summarize-chunk';
import {
    GenerateMindMapFromTextInput,
    GenerateMindMapFromTextOutput,
    GenerateMindMapFromTextOutputSchema,
} from '@/ai/schemas/generate-mind-map-from-text-schema';
import { generateContent, AIProvider } from '@/ai/client-dispatcher';
import { analyzeDocument } from '@/knowledge-engine';

/** Threshold below which we skip the summarization stage and send text directly */
const DIRECT_GENERATION_THRESHOLD = 3000;

/** Maximum combined summary length to send to the final generation step */
const MAX_SUMMARY_LENGTH = 12000;

/** Maximum retries for the final mind map generation if schema validation fails */
const MAX_GENERATION_RETRIES = 2;

/**
 * Multi-stage PDF → MindMap pipeline.
 *
 * 1. Clean raw PDF text
 * 2. Chunk it into 2000-char segments with overlap
 * 3. Summarize each chunk in parallel (concurrency: 3)
 * 4. SKEE: Deterministic document structure analysis
 * 5. Generate mind map from merged summary + SKEE context
 * 6. Validate with Zod schema (retry up to 2x on failure)
 */
export async function generateMindMapFromPdf(
    input: GenerateMindMapFromTextInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<GenerateMindMapFromTextOutput> {
    const { provider, apiKey, context, targetLang, text, persona, strict, depth = 'low' } = input;

    console.log(`📄 PDF Pipeline: Starting. Raw text length: ${text.length} chars`);

    // ── Stage 1: Clean ──────────────────────────────────────────────
    const cleaned = cleanPDFText(text);
    console.log(`📄 PDF Pipeline: Cleaned text length: ${cleaned.length} chars`);

    // ── Stage 2 & 3: Chunk + Summarize (skip for short docs) ────────
    let contentForGeneration: string;

    if (cleaned.length <= DIRECT_GENERATION_THRESHOLD) {
        // Short document — send directly without summarization
        console.log(`📄 PDF Pipeline: Short document, skipping chunking/summarization.`);
        contentForGeneration = cleaned;
    } else {
        // Chunk the text
        const chunks = chunkText(cleaned, 2000, 200);
        console.log(`📄 PDF Pipeline: Created ${chunks.length} chunks.`);

        // Summarize chunks in parallel
        const chunkTexts = chunks.map(c => c.text);
        const summaries = await summarizeChunksParallel(chunkTexts, 3, apiKey);

        console.log(`📄 PDF Pipeline: ${summaries.length}/${chunks.length} chunks summarized successfully.`);

        if (summaries.length === 0) {
            // All summarizations failed — fall back to truncated raw text
            console.warn(`⚠️ PDF Pipeline: All chunk summarizations failed. Falling back to truncated raw text.`);
            contentForGeneration = cleaned.substring(0, MAX_SUMMARY_LENGTH);
        } else {
            // Merge summaries
            contentForGeneration = summaries.join('\n\n');

            // Truncate if merged summary is still too long
            if (contentForGeneration.length > MAX_SUMMARY_LENGTH) {
                console.log(`📄 PDF Pipeline: Merged summary truncated from ${contentForGeneration.length} to ${MAX_SUMMARY_LENGTH} chars.`);
                contentForGeneration = contentForGeneration.substring(0, MAX_SUMMARY_LENGTH);
            }
        }
    }

    console.log(`📄 PDF Pipeline: Final content for generation: ${contentForGeneration.length} chars`);

    // ── Stage 4: SKEE — Deterministic Document Analysis ─────────────
    // Run on the original cleaned text (not summaries) for best structure detection
    const skeeResult = analyzeDocument(cleaned);
    const hasStructure = skeeResult.structuredContext.length > 0;

    if (hasStructure) {
        console.log(`🧠 SKEE Analysis complete:`, skeeResult.stats);
    } else {
        console.log(`🧠 SKEE Analysis: No strong document structure detected, AI will infer.`);
    }

    // ── Stage 5: Generate MindMap ───────────────────────────────────
    // Dynamic density: use SKEE section count as minimum subTopics when structure is detected
    const skeeSections = hasStructure ? skeeResult.stats.sectionsCreated : 0;
    let densityInstruction = '';
    if (depth === 'medium') {
        const minSubs = Math.max(5, skeeSections);
        densityInstruction = `STRUCTURE DENSITY: Generate EXACTLY ${minSubs} subTopics. Each subTopic MUST have EXACTLY 3 categories. (Target: ~${minSubs * 12} nodes)`;
    } else if (depth === 'deep') {
        const minSubs = Math.max(6, skeeSections);
        densityInstruction = `STRUCTURE DENSITY: Generate EXACTLY ${minSubs} subTopics. Each subTopic MUST have EXACTLY 4 categories. (Target: ~${minSubs * 20} nodes)`;
    } else {
        const minSubs = Math.max(4, skeeSections);
        densityInstruction = `STRUCTURE DENSITY: Generate at least ${minSubs} subTopics. Each subTopic should have 2-3 categories. (Target: ~${minSubs * 8} nodes)`;
    }

    const targetLangInstruction = targetLang
        ? `The entire mind map MUST be in the following language: ${targetLang}.`
        : `The entire mind map MUST be in English.`;

    // Build SKEE context section for the prompt
    const skeeSection = hasStructure
        ? `
    **PRE-ANALYZED DOCUMENT STRUCTURE (use as structural guide)**:
    The following analysis was extracted algorithmically from the document.
    Use this as the PRIMARY scaffold for your mind map hierarchy.
    DO NOT ignore these sections — they represent the actual document structure.

    ${skeeResult.structuredContext}
    ---
    IMPORTANT: Your subTopics SHOULD map to the detected sections above.
    Your categories and subCategories SHOULD reflect the key concepts and relationships found.
    You may add additional insights, but the core structure must match the document.`
        : '';

    const systemPrompt = `You are a Document Intelligence Expert specializing in converting document summaries into structured mind maps.
    
    **DOCUMENT ANALYSIS GOALS**:
    1. **Structural Integrity**: Identify major sections, topics, or themes from the summarized content.
    2. **Entity Extraction**: Extract specific names, dates, IDs, and core facts.
    3. **Logical Flow**: Organize content into a logical hierarchy (e.g., Intro -> Methods -> Results -> Conclusion).
    
    **DOCUMENT-SPECIFIC RULES**:
    - If the content looks like an academic paper, focus on: Abstract, Methodology, Key Findings, and Future Work.
    - If the content looks like a technical manual, focus on: Specifications, Installation, Troubleshooting, and FAQ.
    - If the content looks like a business report, focus on: Executive Summary, Market Analysis, Risks, and Recommendations.
    - If it is a personal document (Resume/Invoice), extract literal values (e.g., "Skills: React, Node.js").
    ${skeeSection}

    ${densityInstruction}
    ${targetLangInstruction}
    ${context ? `ADDITIONAL USER CONTEXT: "${context}"` : ''}

    **REQUIRED OUTPUT FORMAT** (return ONLY this JSON structure, no wrapper keys, no explanations):
    {
      "topic": "Main Topic Title",
      "shortTitle": "Short Title",
      "icon": "lucide-icon-name",
      "subTopics": [
        {
          "name": "Sub Topic Name",
          "icon": "lucide-icon-name",
          "categories": [
            {
              "name": "Category Name",
              "icon": "lucide-icon-name",
              "subCategories": [
                {
                  "name": "Detail Name",
                  "description": "One sentence description of this detail.",
                  "icon": "lucide-icon-name"
                }
              ]
            }
          ]
        }
      ]
    }

    CRITICAL: Use exactly the field names shown above: "topic", "shortTitle", "icon", "subTopics", "categories", "subCategories", "description".
    Do NOT use "name" and "children" format. Do NOT wrap the output in any other key.`;

    const userPrompt = `DOCUMENT CONTENT (summarized):\n---\n${contentForGeneration}\n---`;

    // ── Stage 6: Generate with retry ────────────────────────────────
    let lastError: any = null;

    for (let attempt = 0; attempt < MAX_GENERATION_RETRIES; attempt++) {
        try {
            console.log(`📄 PDF Pipeline: Generation attempt ${attempt + 1}/${MAX_GENERATION_RETRIES}...`);

            const result = await generateContent({
                provider,
                apiKey,
                systemPrompt,
                userPrompt,
                schema: GenerateMindMapFromTextOutputSchema,
                strict,
                options: {
                    capability: 'fast',
                }
            });

            // Debug: log what the AI actually returned
            if (result) {
                const keys = Object.keys(result);
                console.log(`📄 PDF Pipeline: AI response keys: [${keys.join(', ')}]`);
                console.log(`📄 PDF Pipeline: topic="${result.topic}", subTopics count=${result.subTopics?.length ?? 'N/A'}`);
            }

            // Basic structural validation
            // If the AI wrapped the data in a nested key, try to extract it
            let finalResult = result;
            if (result && !result.topic && !result.subTopics) {
                // Check for common wrapper keys
                const wrapperKeys = ['mindMap', 'mindmap', 'data', 'result', 'output', 'response'];
                for (const key of wrapperKeys) {
                    if (result[key] && typeof result[key] === 'object' && (result[key].topic || result[key].subTopics)) {
                        console.log(`📄 PDF Pipeline: Found nested data under "${key}" — unwrapping.`);
                        finalResult = result[key];
                        break;
                    }
                }
            }

            if (finalResult && (finalResult.subTopics?.length > 0 || finalResult.topic)) {
                console.log(`✅ PDF Pipeline: Mind map generated successfully on attempt ${attempt + 1}.`, {
                    topic: finalResult.topic,
                    subTopicsCount: finalResult.subTopics?.length ?? 0
                });
                return finalResult;
            }

            console.warn(`⚠️ PDF Pipeline: Attempt ${attempt + 1} returned empty/invalid structure.`);
            lastError = new Error('Generation returned empty structure');
        } catch (err: any) {
            console.warn(`⚠️ PDF Pipeline: Attempt ${attempt + 1} failed:`, err.message);
            lastError = err;
        }

        // Wait before retry
        if (attempt < MAX_GENERATION_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }

    throw lastError || new Error('PDF mind map generation failed after all retries.');
}
