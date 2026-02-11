
'use server';

import {
  BrainstormWizardInput,
  BrainstormWizardOutput,
  BrainstormAspectSchema,
  BrainstormCategorySchema,
} from '@/ai/schemas/brainstorm-wizard-schema';
import { generateContent, AIProvider } from '@/ai/client-dispatcher';
import { AIGeneratedMindMapSchema } from '../mind-map-schema';
import { z } from 'zod';

export async function brainstormWizard(
  input: BrainstormWizardInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<BrainstormWizardOutput> {
  const { provider, apiKey, strict, step, topic, language, searchContext } = input;

  let baseSystemPrompt = `You are MindSpark, a precision AI architect. You are helping a user build a mind map for the topic: "${topic}".
  
  Current Step: ${step}
  Language: ${language}
  `;

  if (searchContext) {
    baseSystemPrompt += `
    REAL-TIME SEARCH CONTEXT:
    Using the following search results to inform your content:
    ${JSON.stringify(searchContext.summary)}
    Source Insights: ${JSON.stringify(searchContext.sources)}
    `;
  }


  let systemPrompt = baseSystemPrompt;
  let stepSchema: z.ZodType<any>;

  if (step === 'GET_ASPECTS') {
    stepSchema = z.object({ aspects: z.array(BrainstormAspectSchema) });
    systemPrompt += `
    Your Task: Suggest 5-6 high-level "Aspects" for the topic "${topic}".
    Example JSON Output:
    {
      "aspects": [
        { "name": "History", "description": "The origins and evolution...", "icon": "history" }
      ]
    }
    Criteria:
    - Each aspect must have a captivating description.
    - Icons must be from lucide-react (e.g., brain, globe, zap).
    `;
  } else if (step === 'GET_CATEGORIES') {
    stepSchema = z.object({ categories: z.array(BrainstormCategorySchema) });
    systemPrompt += `
    Your Task: For the aspect "${input.currentAspect}", suggest 3-4 detailed "Categories".
    Example JSON Output:
    {
      "categories": [
        { "name": "Ancient Roots", "description": "The foundational beginnings...", "icon": "scroll" }
      ]
    }
    Criteria:
    - description is REQUIRED.
    - Icons must be from lucide-react.
    `;
  } else {
    // FINALIZE - Knowledge Studio Multi-Output Logic
    const outputType = input.outputType || 'mindmap';
    // Truncate selections to avoid token overflow
    const selectionsStr = JSON.stringify(input.selections || {});
    // Limit selection context to ~2000 chars to leave room for generation
    const selectedStructure = selectionsStr.length > 2000
      ? selectionsStr.substring(0, 2000) + "... (truncated)"
      : selectionsStr;

    // Choose appropriate schema and prompt based on outputType
    if (outputType === 'mindmap' || outputType === 'roadmap') {
      stepSchema = z.object({ mindMap: AIGeneratedMindMapSchema });
      const formatGoal = outputType === 'roadmap'
        ? 'Generate a CHRONOLOGICAL ROADMAP. Organize data into clear Timeframes (e.g., Q1, Phase 1) and Milestones.'
        : 'Generate a standard HIERARCHICAL MIND MAP.';

      const jsonExample = outputType === 'roadmap' ? `
        {
          "mindMap": {
            "mode": "single",
            "topic": "${topic}",
            "shortTitle": "Product Roadmap",
            "icon": "map",
            "subTopics": [
              {
                "name": "Phase 1: Foundation (Q1)",
                "icon": "flag",
                "categories": [
                  {
                    "name": "Core Infrastructure",
                    "icon": "server",
                    "subCategories": [
                      { "name": "Setup DB", "description": "Owner: DevOps | Status: Pending", "icon": "database" }
                    ]
                  }
                ]
              }
            ]
          }
        }` : `
        {
          "mindMap": {
            "mode": "single",
            "topic": "${topic}",
            "shortTitle": "Creative Title",
            "icon": "brain",
            "subTopics": [
              {
                "name": "Main Concept 1",
                "icon": "lightbulb",
                "categories": [
                  {
                    "name": "Sub-Concept A",
                    "icon": "arrow-right",
                    "subCategories": [
                      { "name": "Detail", "description": "Context...", "icon": "file-text" }
                    ]
                  }
                ]
              }
            ]
          }
        }`;

      systemPrompt += `
      Your Task: ${formatGoal} for the topic "${topic}".
      
      Structure Requirements:
      - Main Topic: "${topic}"
      - Hierarchical Depth: Deep (Multi-layered)
      - ${outputType === 'roadmap' ? 'CRITICAL: Root nodes MUST be Timeframes/Phases. Child nodes are Deliverables.' : 'Expand ONLY on the selected aspects.'}
      
      Mandatory JSON Format:
      ${jsonExample}
      `;
    } else if (outputType === 'dossier' || outputType === 'pitch' || outputType === 'premortem') {
      stepSchema = z.object({ content: z.string() });
      const focus =
        outputType === 'dossier' ? 'Deep-dive Research Dossier (Academic/Professional)' :
          outputType === 'pitch' ? 'VC/Project Pitch Deck (Persuasive/Strategic)' :
            'Pre-Mortem Risk Analysis (Critical/Preventative)';

      systemPrompt += `
      Your Task: Generate a comprehensive ${focus} for "${topic}".
      
      Content Strategy:
      - Use the selected structure for sections: ${selectedStructure}.
      - Output MUST be valid GitHub Flavored Markdown.
      - Use headers, bullet points, charts (via mermaid if appropriate), and bold text.
      - ICON USAGE: To include an icon for a section or point, use the following syntax: ":icon-name:" (e.g., ":user-plus:"). Use Lucide icon names.
      - SEMANTIC LABELS: Instead of using "Description:", use context-aware bold labels followed by a colon for key points.
        Example: "**🏷️ Layer**: Foundational layer...", "**🚀 Impact**: High scalability..."
      - Visually separate sections clearly.
      
      Mandatory JSON Format:
      { "content": "# Markdown text here..." }
      `;
    } else if (outputType === 'quiz') {
      stepSchema = z.object({
        quiz: z.object({
          questions: z.array(z.object({
            question: z.string(),
            options: z.array(z.string()),
            answerIndex: z.number()
          })),
          flashcards: z.array(z.object({
            front: z.string(),
            back: z.string()
          }))
        })
      });
      systemPrompt += `
      Your Task: Generate a Learning Suite for "${topic}".
      
      Requirements:
      - 5-7 multiple-choice questions.
      - 5-10 flashcards (Front: Concept, Back: Detailed Answer).
      - CRITICAL: "answerIndex" MUST be the 0-based integer index of the correct option. Do NOT include an "answer" string field.
      - Based on: ${selectedStructure}.
      
      Mandatory JSON Format:
      {
        "quiz": {
          "questions": [{ "question": "...", "options": ["A", "B", "C"], "answerIndex": 2 }],
          "flashcards": [{ "front": "...", "back": "..." }]
        }
      }
      `;
    } else if (outputType === 'social') {
      stepSchema = z.object({
        social: z.array(z.object({
          platform: z.string(),
          content: z.string(),
          purpose: z.string()
        }))
      });
      // ... systemPrompt setup ...
      systemPrompt += `
      Your Task: Generate a Social Media Content Pack for "${topic}".
      
      Requirements:
      - Generate 3-4 posts for different platforms (LinkedIn, Twitter/X, Instagram).
      - Based on: ${selectedStructure}.
      
      Mandatory JSON Format:
      {
        "social": [
          { "platform": "LinkedIn", "content": "...", "purpose": "Thought Leadership" }
        ]
      }
      `;
    } else {
      // Default fallback for safety
      stepSchema = z.any();
    }

    systemPrompt += `
    Strict Rules (Step: FINALIZE, Type: ${outputType}):
    1. Ensure the output is a valid JSON object matching the requested schema.
    2. "description" is MANDATORY for all descriptive fields.
    3. Use kebab-case Lucide icon names where applicable.
    4. CRITICAL: If you hit a token limit or are unsure, generate a shorter but complete JSON rather than an invalid one.
    5. No markdown formatting outside the "content" string. No preamble. Return ONLY the JSON object.
    `;
  }

  const userPrompt = `Proceed with step ${step} for topic "${topic}".`;

  const result = await generateContent({
    provider: provider,
    apiKey: apiKey,
    systemPrompt,
    userPrompt,
    schema: stepSchema,
    strict: step === 'FINALIZE' ? false : strict,
    options: {
      capability: step === 'FINALIZE' ? 'reasoning' : 'creative'
    }
  });

  console.log(`[brainstormWizard] Raw AI result for ${step}:`, JSON.stringify(result).substring(0, 500));

  if (!result || Object.keys(result).length === 0) {
    console.error(`[brainstormWizard] AI returned empty or invalid response for step ${step}`);
    throw new Error(`AI failed to generate valid ${step} data. Please try a different topic or simplify selections.`);
  }

  // Ensure the result has the step field for the discriminated union in the client
  let finalOutput: BrainstormWizardOutput;
  if (step === 'GET_ASPECTS') {
    finalOutput = { step: 'GET_ASPECTS', aspects: result.aspects || [] };
  } else if (step === 'GET_CATEGORIES') {
    finalOutput = { step: 'GET_CATEGORIES', categories: result.categories || [] };
  } else {
    // FINALIZE: Robustly handle potential schema naming mismatches
    const raw = result as any;

    // Normalize data if keys are missing but data exists elsewhere
    // 1. Check for quiz
    if (input.outputType === 'quiz' && !raw.quiz) {
      if (raw.questions) raw.quiz = { questions: raw.questions, flashcards: raw.flashcards || [] };
    }
    // 2. Check for social
    if (input.outputType === 'social' && !raw.social) {
      if (Array.isArray(raw)) (raw as any).social = raw; // Sometimes returns just the array
      else if (raw.posts) (raw as any).social = raw.posts;
    }
    // 3. Check for content (dossier/pitch)
    if ((input.outputType === 'dossier' || input.outputType === 'pitch' || input.outputType === 'premortem') && !raw.content) {
      // Loop through keys to find a likely long string
      const candidates = Object.values(raw).filter(v => typeof v === 'string' && v.length > 50);
      if (candidates.length > 0) raw.content = candidates[0];
    }
    // 4. Check for mindMap
    if ((input.outputType === 'mindmap' || input.outputType === 'roadmap') && !raw.mindMap) {
      if (raw.topic && raw.subTopics) raw.mindMap = raw; // It returned the map directly, not wrapped
    }

    finalOutput = {
      step: 'FINALIZE',
      ...raw
    } as BrainstormWizardOutput;

    const hasAnyContent = !!(finalOutput as any).mindMap || !!(finalOutput as any).content || !!(finalOutput as any).quiz || !!(finalOutput as any).social;

    if (!hasAnyContent) {
      console.error(`[brainstormWizard] FINALIZE result missing all expected data fields:`, result);
      throw new Error("The AI response was empty or incorrectly formatted. Please retry.");
    }
  }

  console.log(`[brainstormWizard] Returning ${step} output:`, {
    hasMindMap: !!(finalOutput as any).mindMap,
    hasAspects: !!(finalOutput as any).aspects,
    hasCategories: !!(finalOutput as any).categories
  });

  return finalOutput;
}
