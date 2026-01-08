import { z } from 'zod';

/**
 * Recursive schema for comparison nodes.
 */
export const CompareNodeSchema: z.ZodType<any> = z.lazy(() =>
    z.object({
        id: z.string().describe('Unique ID for the node'),
        title: z.string().describe('The name of the point or topic'),
        description: z.string().describe('A detailed informative sentence explaining the comparison/point. DO NOT USE PLACEHOLDERS.'),
        icon: z.string().optional().describe('Lucide-react icon name in kebab-case'),
        children: z.array(z.lazy(() => CompareNodeSchema)).optional().describe('Nested comparison details'),
        tags: z.array(z.string()).optional().describe('2-3 relevant keywords'),
    })
);

/**
 * STRICT schema for Compare Mind Map.
 */
export const CompareMindMapSchema = z.object({
    mode: z.literal('compare').default('compare'),
    topic: z.string().optional().describe('The main title of the comparison (e.g., "A vs B")'),

    root: z.object({
        title: z.string().describe('Topic A vs Topic B'),
        description: z.string().optional().describe('High-level overview of the comparison'),
        icon: z.string().default('scale').describe('Main icon for the comparison'),
    }),

    similarities: z.array(CompareNodeSchema).describe('List of shared features/concepts'),

    differences: z.object({
        topicA: z.array(CompareNodeSchema).describe('Points unique to Topic A'),
        topicB: z.array(CompareNodeSchema).describe('Points unique to Topic B'),
    }),

    relevantLinks: z.array(
        z.object({
            title: z.string().describe('Readable title of the resource'),
            url: z.string().url().describe('Direct URL to the resource'),
            description: z.string().describe('A brief (1-sentence) explanation of what this resource provides.'),
        })
    ).describe('External resources for further reading'),

    topicADeepDive: z.array(CompareNodeSchema).describe('Independent in-depth expansion of Topic A'),
    topicBDeepDive: z.array(CompareNodeSchema).describe('Independent in-depth expansion of Topic B'),
});

export type CompareMindMap = z.infer<typeof CompareMindMapSchema>;
export type CompareNode = z.infer<typeof CompareNodeSchema>;

export const GenerateComparisonMapInputSchema = z.object({
    topic1: z.string().describe('The first topic for comparison.'),
    topic2: z.string().describe('The second topic for comparison.'),
    targetLang: z
        .string()
        .optional()
        .describe('The target language for the mind map content (e.g., "es").'),
    persona: z
        .string()
        .optional()
        .describe('The AI persona / style to use (e.g., "Teacher", "Concise", "Creative").'),
    apiKey: z.string().optional().describe('Optional custom API key to use for this request.'),
});

export type GenerateComparisonMapInput = z.infer<typeof GenerateComparisonMapInputSchema>;
