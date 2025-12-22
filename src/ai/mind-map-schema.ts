
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
    .describe('A list of detailed sub-categories.'),
});

const SubTopicSchema = z.object({
  name: z.string().describe('The name of the sub-topic.'),
  icon: z
    .string()
    .describe(
      'A relevant icon name from the lucide-react library, in kebab-case (e.g., "flag").'
    ),
  categories: z.array(CategorySchema).describe('A list of categories.'),
});

export const MindMapSchema = z.object({
  topic: z.string().describe('The main topic of the mind map.'),
  shortTitle: z.string().describe('A condensed version of the topic (max 3-4 words) for focused display.'),
  icon: z
    .string()
    .describe(
      'A relevant icon name from the lucide-react library, in kebab-case (e.g., "brain-circuit").'
    ),
  subTopics: z.array(SubTopicSchema).describe('A list of main sub-topics.'),
});

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
  ).describe('4-6 sub-categories for the expanded node'),
});

export type NestedExpansionOutput = z.infer<typeof NestedExpansionOutputSchema>;
export type SubCategory = z.infer<typeof SubCategorySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type SubTopic = z.infer<typeof SubTopicSchema>;
export type MindMap = z.infer<typeof MindMapSchema>;
