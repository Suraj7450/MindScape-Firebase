
'use server';
/**
 * @fileOverview AI flow to expand a specific node in a mind map with nested sub-categories.
 * This creates inline expansions rather than entirely new mind maps.
 */
import { NestedExpansionOutputSchema } from '@/ai/mind-map-schema';
import { z } from 'zod';

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

export interface ExpandNodeInput {
  nodeName: string;
  parentTopic: string;
  nodeDescription?: string;
  depth: number;
  persona?: string;
}

export type ExpandNodeOutput = z.infer<typeof NestedExpansionOutputSchema>;

// Simplified to always use client-dispatcher
export async function expandNode(
  input: ExpandNodeInput & { apiKey?: string; provider?: AIProvider; strict?: boolean }
): Promise<ExpandNodeOutput> {
  const { provider, apiKey, nodeName, parentTopic, nodeDescription, depth, persona, strict } = input;

  let personaInstruction = '';
  if (persona === 'Teacher') {
    personaInstruction = `
    ADOPT PERSONA: "Expert Teacher"
    - Use educational analogies to expand on the node.
    - Focus on "How" and "Why" in sub-category descriptions.
    - Structure expansion like a specific modular lesson.
    - Descriptions should be encouraging and clear.`;
  } else if (persona === 'Concise') {
    personaInstruction = `
    ADOPT PERSONA: "Efficiency Expert"
    - Keep all expanded sub-categories extremely brief.
    - Use high-impact keywords instead of long sentences.
    - Focus only on the most critical deeper information.
    - Descriptions should be very short (max 15 words).`;
  } else if (persona === 'Creative') {
    personaInstruction = `
    ADOPT PERSONA: "Creative Visionary"
    - Find unique, imaginative ways to expand on this node.
    - Use vivid, evocative language in descriptions.
    - Suggest interesting or theoretical sub-paths.
    - Make the result feel inspired and non-obvious.`;
  } else {
    personaInstruction = `
    ADOPT PERSONA: "Standard Academic Assistant"
    - Provide a balanced and well-structured expansion of the node.
    - Use clear, professional, yet accessible language.
    - Ensure comprehensive coverage of the node's facets.
    - Keep descriptions highly focused and under 2 sentences.`;
  }

  // Manual prompt construction
  const manualPrompt = `You are an expert educator and content synthesizer. Your task is to expand a specific node within a mind map by generating detailed sub-categories.

  ${personaInstruction}

**Node to Expand:** "${nodeName}"
**Parent Topic:** "${parentTopic}"
${nodeDescription ? `**Node Description:** "${nodeDescription}"` : ''}
**Current Depth:** ${depth}

Generate **4-6 detailed sub-categories** that dive deeper into "${nodeName}". Each sub-category should:
1. Explore a specific aspect, concept, or component of the node
2. Be educational and informative
3. Provide value for someone learning about this topic

**RULES:**
1. **Be Specific:** Each sub-category should cover a distinct aspect, not overlap with others.
2. **Add Depth:** Go deeper into the topic, don't just rephrase the parent.
3. **Be Educational:** Focus on concepts, techniques, facts, or applications.
4. **Use Clear Names:** Short, descriptive names (2-4 words).
5. **Rich Descriptions:** 1-2 sentences explaining the sub-category.
6. **Relevant Icons:** Use lucide-react icon names in kebab-case.
7. **Accurate Tags:** 2-3 keywords that help categorize each item.

Return a JSON object with:
{
  "topic": "${nodeName}",
  "icon": "appropriate-icon",
  "subCategories": [
    {
      "name": "Sub-concept Name",
      "description": "Clear explanation of what this covers.",
      "icon": "icon-name",
      "tags": ["tag1", "tag2", "tag3"]
    },
    // ... 3-5 more sub-categories
  ]
}`;

  const result = await generateContent({
    provider,
    apiKey,
    systemPrompt: "System: Mind map node expansion specialist. JSON ONLY.",
    userPrompt: manualPrompt,
    schema: NestedExpansionOutputSchema,
    strict
  });

  return result;
}
