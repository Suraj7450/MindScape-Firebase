
import type { GenerateMindMapOutput } from '@/ai/flows/generate-mind-map';

/**
 * Static mind map data for MindScape itself, based on the PRD.
 * This is shown when users search for "MindScape" to showcase the product's features.
 */
export const mindscapeMap: GenerateMindMapOutput = {
    topic: "MindScape",
    icon: "brain-circuit",
    subTopics: [
        {
            name: "Core Features",
            icon: "sparkles",
            categories: [
                {
                    name: "Mind Map Generation",
                    icon: "network",
                    subCategories: [
                        {
                            name: "Single Topic",
                            description: "Generate comprehensive, multi-layered mind maps from any topic instantly. Perfect for learning new subjects or getting quick overviews.",
                            icon: "file-text",
                            tags: ["AI-Powered", "Instant", "Comprehensive"]
                        },
                        {
                            name: "Compare Concepts",
                            description: "Create comparative mind maps that highlight similarities, differences, and contextual overlaps between two topics (e.g., React vs Vue).",
                            icon: "git-compare-arrows",
                            tags: ["Comparison", "Analysis", "Decision-Making"]
                        },
                        {
                            name: "Vision Mode",
                            description: "Upload documents (PDF, images, or text files) and have AI generate structured mind maps based on your existing content.",
                            icon: "eye",
                            tags: ["Document Upload", "OCR", "Content Analysis"]
                        },
                        {
                            name: "Multi-language Support",
                            description: "Generate mind maps in 50+ languages, making learning accessible to users worldwide.",
                            icon: "languages",
                            tags: ["Translation", "Global", "Accessibility"]
                        }
                    ]
                },
                {
                    name: "Interactive Exploration",
                    icon: "mouse-pointer-click",
                    subCategories: [
                        {
                            name: "AI Explanations",
                            description: "Click any node to open a dialog with detailed, AI-generated explanations that deepen your understanding of specific concepts.",
                            icon: "lightbulb",
                            tags: ["Deep Learning", "Context", "Details"]
                        },
                        {
                            name: "Difficulty Levels",
                            description: "Toggle between Beginner, Intermediate, and Expert modes to get explanations tailored to your level of understanding.",
                            icon: "layers",
                            tags: ["Adaptive", "Personalized", "Learning Paths"]
                        },
                        {
                            name: "Expand Further",
                            description: "Generate deeper, more detailed mind maps for any specific node, allowing unlimited exploration of tangents and subtopics.",
                            icon: "git-branch",
                            tags: ["Recursive", "Deep Dive", "Exploration"]
                        },
                        {
                            name: "Quiz Me",
                            description: "Test your knowledge with AI-generated multiple-choice quizzes based on the mind map content.",
                            icon: "test-tube-2",
                            tags: ["Assessment", "Learning", "Practice"]
                        }
                    ]
                },
                {
                    name: "Map Management",
                    icon: "settings",
                    subCategories: [
                        {
                            name: "Save & Organize",
                            description: "Save mind maps to your personal dashboard with automatic thumbnail generation and easy organization.",
                            icon: "save",
                            tags: ["Persistence", "Organization", "Cloud Storage"]
                        },
                        {
                            name: "Translate Maps",
                            description: "Translate existing mind maps into other languages on the fly for sharing or multilingual study.",
                            icon: "languages",
                            tags: ["Real-time", "Translation", "Sharing"]
                        },
                        {
                            name: "Expand/Collapse",
                            description: "One-click controls to expand or collapse all nodes for better overview or focused exploration.",
                            icon: "maximize-2",
                            tags: ["Navigation", "UI Control", "Focus"]
                        },
                        {
                            name: "Download & Share",
                            description: "Export maps as PNG images or share via public links for collaboration and presentations.",
                            icon: "share-2",
                            tags: ["Export", "Collaboration", "Sharing"]
                        }
                    ]
                }
            ]
        },
        {
            name: "AI-Powered Tools",
            icon: "bot",
            categories: [
                {
                    name: "MindGPT",
                    icon: "message-circle",
                    subCategories: [
                        {
                            name: "Guided Brainstorming",
                            description: "Conversational AI interface that asks questions step-by-step to help you define topics and build mind maps from scratch.",
                            icon: "compass",
                            tags: ["Interactive", "Guided", "Brainstorming"]
                        },
                        {
                            name: "Smart Suggestions",
                            description: "AI-powered clickable suggestions during conversation to make the map-building process faster and more intuitive.",
                            icon: "sparkles",
                            tags: ["Autocomplete", "Suggestions", "Speed"]
                        },
                        {
                            name: "Context-Aware",
                            description: "MindGPT remembers your conversation history and provides contextually relevant follow-up questions and suggestions.",
                            icon: "brain",
                            tags: ["Memory", "Context", "Personalized"]
                        }
                    ]
                },
                {
                    name: "Content Generation",
                    icon: "wand-2",
                    subCategories: [
                        {
                            name: "Image Generator",
                            description: "Create high-quality visual assets using text-to-image AI with multiple artistic styles to enrich notes and presentations.",
                            icon: "image",
                            tags: ["Text-to-Image", "Creative", "Visual"]
                        },
                        {
                            name: "Auto Thumbnails",
                            description: "Automatic generation of relevant, visually appealing thumbnails for saved mind maps based on their topics.",
                            icon: "image-plus",
                            tags: ["Automation", "Visual Appeal", "Dashboard"]
                        },
                        {
                            name: "Example Generation",
                            description: "Generate real-world examples for any concept to make abstract ideas more concrete and understandable.",
                            icon: "pocket",
                            tags: ["Examples", "Practical", "Learning"]
                        }
                    ]
                },
                {
                    name: "Global AI Assistant",
                    icon: "sparkles",
                    subCategories: [
                        {
                            name: "Floating Chat Panel",
                            description: "AI assistant available on every page for help, brainstorming, and explanations without leaving your current context.",
                            icon: "message-square",
                            tags: ["Always Available", "Help", "Support"]
                        },
                        {
                            name: "Text Selection Translator",
                            description: "Highlight any text anywhere in the app to instantly translate it with a convenient popover.",
                            icon: "languages",
                            tags: ["Translation", "Convenience", "Multilingual"]
                        }
                    ]
                }
            ]
        },
        {
            name: "User Experience",
            icon: "user",
            categories: [
                {
                    name: "Dashboard",
                    icon: "layout-dashboard",
                    subCategories: [
                        {
                            name: "My Maps",
                            description: "Personal space to view, search, sort, and manage all your saved mind maps with a beautiful grid layout.",
                            icon: "folder-open",
                            tags: ["Organization", "Search", "Management"]
                        },
                        {
                            name: "Public Gallery",
                            description: "Explore and duplicate mind maps created and shared by the community for inspiration and learning.",
                            icon: "gallery-vertical",
                            tags: ["Community", "Sharing", "Discovery"]
                        },
                        {
                            name: "Search & Sort",
                            description: "Find maps quickly by topic and sort by most recent, oldest, or alphabetical order.",
                            icon: "search",
                            tags: ["Filtering", "Organization", "Efficiency"]
                        }
                    ]
                },
                {
                    name: "Authentication",
                    icon: "lock",
                    subCategories: [
                        {
                            name: "Google Sign-In",
                            description: "Quick and secure authentication using your Google account for instant access.",
                            icon: "chrome",
                            tags: ["OAuth", "Quick", "Secure"]
                        },
                        {
                            name: "Email/Password",
                            description: "Traditional email-based authentication with unified sign-up and sign-in flow.",
                            icon: "mail",
                            tags: ["Traditional", "Secure", "Flexible"]
                        },
                        {
                            name: "Profile Management",
                            description: "View your avatar and name in the navbar with easy logout functionality.",
                            icon: "user-circle",
                            tags: ["Profile", "Settings", "Control"]
                        }
                    ]
                },
                {
                    name: "Publishing & Sharing",
                    icon: "share",
                    subCategories: [
                        {
                            name: "Publish to Community",
                            description: "Make your mind maps visible in the public gallery for others to explore and learn from.",
                            icon: "upload",
                            tags: ["Community", "Contribution", "Visibility"]
                        },
                        {
                            name: "Duplicate Public Maps",
                            description: "Save any public map to your personal dashboard as an editable copy for customization.",
                            icon: "copy",
                            tags: ["Remix", "Learning", "Customization"]
                        },
                        {
                            name: "Share Links",
                            description: "Generate shareable links to your mind maps for easy collaboration and presentation.",
                            icon: "link",
                            tags: ["Collaboration", "Sharing", "Access"]
                        }
                    ]
                }
            ]
        },
        {
            name: "Technical Architecture",
            icon: "code",
            categories: [
                {
                    name: "Frontend",
                    icon: "monitor",
                    subCategories: [
                        {
                            name: "Next.js 15",
                            description: "Modern React framework with App Router for optimal performance and developer experience.",
                            icon: "zap",
                            tags: ["React", "SSR", "Performance"]
                        },
                        {
                            name: "TypeScript",
                            description: "Type-safe development ensuring code quality and reducing runtime errors.",
                            icon: "file-code",
                            tags: ["Type Safety", "Quality", "DX"]
                        },
                        {
                            name: "Tailwind CSS",
                            description: "Utility-first CSS framework for beautiful, responsive, and consistent UI design.",
                            icon: "palette",
                            tags: ["Styling", "Responsive", "Modern"]
                        },
                        {
                            name: "shadcn/ui",
                            description: "High-quality, accessible UI components built on Radix UI primitives.",
                            icon: "component",
                            tags: ["Components", "Accessible", "Beautiful"]
                        }
                    ]
                },
                {
                    name: "Backend & AI",
                    icon: "server",
                    subCategories: [
                        {
                            name: "Firebase",
                            description: "Authentication, Firestore database, and cloud storage for seamless user data management.",
                            icon: "database",
                            tags: ["BaaS", "Real-time", "Scalable"]
                        },
                        {
                            name: "Google Genkit",
                            description: "AI framework for building and deploying generative AI flows with observability.",
                            icon: "brain",
                            tags: ["AI", "Flows", "Observability"]
                        },
                        {
                            name: "Gemini AI",
                            description: "Google's advanced language model powering mind map generation and explanations.",
                            icon: "sparkles",
                            tags: ["LLM", "Generation", "Intelligence"]
                        }
                    ]
                }
            ]
        }
    ]
};
