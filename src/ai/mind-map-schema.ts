
import { z } from 'zod';

/**
 * Schema for a nested expansion - a mini mind map that expands from a sub-category
 */
const NestedSubCategorySchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    name: z.string().describe('The name of the sub-category.'),
    description: z.string().describe('A brief description of the sub-category.'),
    icon: z
      .string()
      .describe(
        'A relevant icon name from the lucide-react library, in kebab-case (e.g., "book-open").'
      ),
    tags: z
      .array(z.string())
      .describe('A list of 2-3 relevant keywords or tags for the sub-category.'),
    // Nested expansion support
    nestedExpansion: z
      .object({
        id: z.string().describe('Unique ID for this nested expansion'),
        topic: z.string().describe('The expanded topic name'),
        icon: z.string(),
        subCategories: z.array(z.lazy(() => NestedSubCategorySchema)),
        createdAt: z.number().optional(),
      })
      .optional()
      .describe('Nested sub-mindmap expansion for this category'),
    isExpanded: z.boolean().optional().default(false),
  })
);

const SubCategorySchema = z.object({
  name: z.string().describe('The name of the sub-category.'),
  description: z.string().describe('A brief description of the sub-category.'),
  icon: z
    .string()
    .describe(
      'A relevant icon name from the lucide-react library, in kebab-case (e.g., "book-open").'
    ),
  tags: z
    .array(z.string())
    .describe('A list of 2-3 relevant keywords or tags for the sub-category.'),
  // Nested expansion support
  nestedExpansion: z
    .object({
      id: z.string().describe('Unique ID for this nested expansion'),
      topic: z.string().describe('The expanded topic name'),
      icon: z.string(),
      subCategories: z.array(NestedSubCategorySchema),
      createdAt: z.number().optional(),
    })
    .optional()
    .describe('Nested sub-mindmap expansion for this category'),
  isExpanded: z.boolean().optional().default(false),
});

const CategorySchema = z.object({
  name: z.string().describe('The name of the category.'),
  icon: z
    .string()
    .describe(
      'A relevant icon name from the lucide-react library, in kebab-case (e.g., "folder").'
    ),
  subCategories: z
    .array(SubCategorySchema)
    .min(1)
    .describe('A list of detailed sub-categories.'),
  insight: z.string().optional().describe('A deeper philosophical or analytical insight about this category.'),
});

const SubTopicSchema = z.object({
  name: z.string().describe('The name of the sub-topic.'),
  icon: z
    .string()
    .describe(
      'A relevant icon name from the lucide-react library, in kebab-case (e.g., "flag").'
    ),
  categories: z.array(CategorySchema).min(1).describe('A list of categories.'),
  insight: z.string().optional().describe('A high-level philosophical or analytical insight about this sub-topic.'),
});

export const GeneratedImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.enum(['generating', 'completed', 'failed']),
});

export const NestedExpansionItemSchema = z.object({
  id: z.string(),
  parentName: z.string(),
  topic: z.string(),
  icon: z.string(),
  subCategories: z.array(z.object({
    name: z.string(),
    description: z.string(),
    icon: z.string(),
    tags: z.array(z.string()),
  })),
  createdAt: z.number(),
  depth: z.number(),
  path: z.string().optional(),
  status: z.enum(['generating', 'completed', 'failed']).optional(),
  fullData: z.any().optional(), // Self-reference limit
});

export const CompareMindMapSchema = z.object({
  mode: z.literal('compare'),
  topic: z.string(),
  shortTitle: z.string().optional(),
  icon: z.string().optional(),
  compareData: z.object({
    root: z.object({
      title: z.string(),
      description: z.string().optional(),
      icon: z.string().optional(),
    }),
    similarities: z.array(z.any()),
    differences: z.object({
      topicA: z.array(z.any()),
      topicB: z.array(z.any()),
    }),
    relevantLinks: z.array(z.any()),
    topicADeepDive: z.array(z.any()),
    topicBDeepDive: z.array(z.any()),
  }),
  id: z.string().optional(),
  nestedExpansions: z.array(NestedExpansionItemSchema).optional(),
  savedImages: z.array(GeneratedImageSchema).optional(),
  thumbnailUrl: z.string().optional(),
  depth: z.enum(['low', 'medium', 'deep']).optional(),
});

export const SingleMindMapSchema = z.object({
  mode: z.literal('single').default('single').describe('The mode of the mind map (single topic)'),
  topic: z.string().describe('The main topic of the mind map.'),
  shortTitle: z.string().optional().describe('A condensed version of the topic (max 3-4 words) for focused display.'),
  icon: z
    .string()
    .optional()
    .describe(
      'A relevant icon name from the lucide-react library, in kebab-case (e.g., "brain-circuit").'
    ),
  subTopics: z.array(SubTopicSchema).min(1).describe('A list of main sub-topics.'),
  isSubMap: z.boolean().optional().describe('Whether this map is a nested sub-map'),
  parentMapId: z.string().optional().describe('The ID of the parent mind map'),
  id: z.string().optional(),
  nestedExpansions: z.array(NestedExpansionItemSchema).optional(),
  savedImages: z.array(GeneratedImageSchema).optional(),
  thumbnailUrl: z.string().optional(),
  depth: z.enum(['low', 'medium', 'deep']).optional(),
});

export const MindMapSchema = z.union([SingleMindMapSchema, CompareMindMapSchema]);

/**
 * Schema for nested expansion output from AI
 */
export const NestedExpansionOutputSchema = z.object({
  topic: z.string().describe('The topic being expanded'),
  icon: z.string().describe('Icon for the expansion'),
  subCategories: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      icon: z.string(),
      tags: z.array(z.string()),
    })
  ).min(4).describe('4-6 sub-categories for the expanded node'),
});

export type NestedExpansionOutput = z.infer<typeof NestedExpansionOutputSchema>;
export type SubCategory = z.infer<typeof SubCategorySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type SubTopic = z.infer<typeof SubTopicSchema>;
export type MindMap = z.infer<typeof MindMapSchema>;
