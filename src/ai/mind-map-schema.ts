
import { z } from 'zod';

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
  icon: z
    .string()
    .describe(
      'A relevant icon name from the lucide-react library, in kebab-case (e.g., "brain-circuit").'
    ),
  subTopics: z.array(SubTopicSchema).describe('A list of main sub-topics.'),
});
