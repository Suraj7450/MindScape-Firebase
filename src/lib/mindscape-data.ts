
import type { MindMapData } from '@/types/mind-map';

export const mindscapeMap: MindMapData = {
  topic: 'MindScape',
  icon: 'brain-circuit',
  subTopics: [
    {
      name: 'Core Features',
      icon: 'sparkles',
      categories: [
        {
          name: 'Mind Map Generation',
          icon: 'network',
          subCategories: [
            {
              name: 'Single Topic',
              description: 'Generate comprehensive mind maps from any topic.',
              icon: 'file-text',
              tags: ['generation', 'single-topic'],
            },
            {
              name: 'Compare Concepts',
              description:
                'Create comparative maps highlighting similarities and differences.',
              icon: 'git-compare-arrows',
              tags: ['comparison', 'analysis'],
            },
            {
              name: 'Vision Mode',
              description:
                'Upload documents (PDF, images, text) to generate maps.',
              icon: 'eye',
              tags: ['upload', 'vision'],
            },
            {
              name: 'Multi-language Support',
              description: 'Generate and translate maps in numerous languages.',
              icon: 'languages',
              tags: ['translation', 'global'],
            },
          ],
        },
        {
          name: 'Interactive Exploration',
          icon: 'mouse-pointer-click',
          subCategories: [
            {
              name: 'AI Explanations',
              description:
                'Click any node for detailed AI-generated explanations.',
              icon: 'lightbulb',
              tags: ['ai', 'explanation'],
            },
            {
              name: 'Difficulty Levels',
              description:
                'Toggle between Beginner, Intermediate, and Expert modes.',
              icon: 'layers',
              tags: ['customization', 'learning'],
            },
            {
              name: 'Expand Further',
              description: 'Generate deeper mind maps for any specific node.',
              icon: 'git-branch',
              tags: ['branching', 'exploration'],
            },
            {
              name: 'Quiz Me',
              description: 'Test knowledge with AI-generated quizzes.',
              icon: 'test-tube-2',
              tags: ['quiz', 'testing'],
            },
          ],
        },
      ],
    },
    {
      name: 'AI Tools',
      icon: 'bot',
      categories: [
        {
          name: 'MindGPT',
          icon: 'message-circle',
          subCategories: [
            {
              name: 'Guided Brainstorming',
              description:
                'Conversational interface for building maps step-by-step.',
              icon: 'compass',
              tags: ['chat', 'conversational-ai'],
            },
            {
              name: 'Smart Suggestions',
              description: 'AI-powered suggestions during conversation.',
              icon: 'sparkles',
              tags: ['suggestions', 'ai-ux'],
            },
          ],
        },
        {
          name: 'Content Generation',
          icon: 'wand-2',
          subCategories: [
            {
              name: 'Image Generator',
              description: 'Create visual assets with text-to-image AI.',
              icon: 'image',
              tags: ['images', 'text-to-image'],
            },
            {
              name: 'Auto Thumbnails',
              description: 'Automatic thumbnail generation for saved maps.',
              icon: 'image-plus',
              tags: ['thumbnails', 'automation'],
            },
          ],
        },
      ],
    },
    {
      name: 'User Management',
      icon: 'users',
      categories: [
        {
          name: 'Dashboard',
          icon: 'layout-dashboard',
          subCategories: [
            {
              name: 'My Maps',
              description: 'View, search, and manage all saved mind maps.',
              icon: 'folder-open',
              tags: ['dashboard', 'saved-work'],
            },
            {
              name: 'Public Gallery',
              description: 'Explore and duplicate community-shared maps.',
              icon: 'gallery-vertical',
              tags: ['community', 'sharing'],
            },
          ],
        },
        {
          name: 'Authentication',
          icon: 'key-round',
          subCategories: [
            {
              name: 'Google Sign-In',
              description: 'Quick authentication with Google account.',
              icon: 'chrome',
              tags: ['auth', 'google'],
            },
            {
              name: 'Email/Password',
              description: 'Traditional email-based authentication.',
              icon: 'mail',
              tags: ['auth', 'email'],
            },
          ],
        },
      ],
    },
  ],
};
