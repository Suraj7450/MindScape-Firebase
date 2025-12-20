
'use server';
/**
 * @fileOverview AI flow to expand a specific node in a mind map with nested sub-categories.
 * This creates inline expansions rather than entirely new mind maps.
 */
import { ai } from '@/ai/genkit';
import { NestedExpansionOutputSchema } from '@/ai/mind-map-schema';
import { z } from 'zod';

const ExpandNodeInputSchema = z.object({
  nodeName: z.string().describe('The name of the node to expand'),
  parentTopic: z.string().describe('The main topic of the parent mind map'),
  nodeDescription: z.string().optional().describe('Description of the node being expanded'),
  depth: z.number().default(1).describe('Current nesting depth'),
});

export type ExpandNodeInput = z.infer<typeof ExpandNodeInputSchema>;
export type ExpandNodeOutput = z.infer<typeof NestedExpansionOutputSchema>;

const EXPAND_NODE_PROMPT = `You are an expert educator and content synthesizer. Your task is to expand a specific node within a mind map by generating detailed sub-categories.

**Node to Expand:** "{{{nodeName}}}"
**Parent Topic:** "{{{parentTopic}}}"
{{#if nodeDescription}}
**Node Description:** "{{{nodeDescription}}}"
{{/if}}
**Current Depth:** {{{depth}}}

Generate **4-6 detailed sub-categories** that dive deeper into "{{{nodeName}}}". Each sub-category should:
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
  "topic": "{{{nodeName}}}",
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
}
`;

const prompt = ai.definePrompt({
  name: 'expandNodePrompt',
  input: { schema: ExpandNodeInputSchema },
  output: { schema: NestedExpansionOutputSchema },
  prompt: EXPAND_NODE_PROMPT,
});

const expandNodeFlow = ai.defineFlow(
  {
    name: 'expandNodeFlow',
    inputSchema: ExpandNodeInputSchema,
    outputSchema: NestedExpansionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

import { generateContent, AIProvider } from '@/ai/client-dispatcher';

export async function expandNode(
  input: ExpandNodeInput & { apiKey?: string; provider?: AIProvider }
): Promise<ExpandNodeOutput> {
  if (input.provider === 'pollinations' || input.apiKey) {
    // Manual prompt construction
    const manualPrompt = `You are an expert educator and content synthesizer. Your task is to expand a specific node within a mind map by generating detailed sub-categories.

**Node to Expand:** "${input.nodeName}"
**Parent Topic:** "${input.parentTopic}"
${input.nodeDescription ? `**Node Description:** "${input.nodeDescription}"` : ''}
**Current Depth:** ${input.depth}

Generate **4-6 detailed sub-categories** that dive deeper into "${input.nodeName}". Each sub-category should:
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
  "topic": "${input.nodeName}",
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

    return generateContent({
      provider: input.provider,
      apiKey: input.apiKey,
      systemPrompt: "System: XML Schema compliant JSON generator",
      userPrompt: manualPrompt
    });
  }
  return expandNodeFlow(input);
}
