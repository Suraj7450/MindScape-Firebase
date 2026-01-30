

import type { SingleMindMapData } from '@/types/mind-map';

/**
 * Static mind map data for MindScape itself, based on the PRD.
 * This is shown when users search for "MindScape" to showcase the product's features.
 */
export const mindscapeMap = {
    mode: "single",
    topic: "MindScape",
    shortTitle: "MindScape Explorer",
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
                            tags: ["AI-Powered", "Instant", "Comprehensive"],
                            isExpanded: false
                        },
                        {
                            name: "Compare Concepts",
                            description: "Create comparative mind maps that highlight similarities, differences, and contextual overlaps between two topics (e.g., React vs Vue).",
                            icon: "git-compare-arrows",
                            tags: ["Comparison", "Analysis", "Decision-Making"],
                            isExpanded: false
                        },
                        {
                            name: "Vision Mode",
                            description: "Upload documents (PDF, images, or text files) and have AI generate structured mind maps based on your existing content.",
                            icon: "eye",
                            tags: ["Document Upload", "OCR", "Content Analysis"],
                            isExpanded: false
                        },
                        {
                            name: "Multi-language Support",
                            description: "Generate mind maps in 50+ languages, making learning accessible to users worldwide.",
                            icon: "languages",
                            tags: ["Translation", "Global", "Accessibility"],
                            isExpanded: false
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
                            tags: ["Deep Learning", "Context", "Details"],
                            isExpanded: false
                        },
                        {
                            name: "Difficulty Levels",
                            description: "Toggle between Beginner, Intermediate, and Expert modes to get explanations tailored to your level of understanding.",
                            icon: "layers",
                            tags: ["Adaptive", "Personalized", "Learning Paths"],
                            isExpanded: false
                        },
                        {
                            name: "Expand Further",
                            description: "Generate deeper, more detailed mind maps for any specific node, allowing unlimited exploration of tangents and subtopics.",
                            icon: "git-branch",
                            tags: ["Recursive", "Deep Dive", "Exploration"],
                            isExpanded: false
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
                            tags: ["Persistence", "Organization", "Cloud Storage"],
                            isExpanded: false
                        },
                        {
                            name: "Translate Maps",
                            description: "Translate existing mind maps into other languages on the fly for sharing or multilingual study.",
                            icon: "languages",
                            tags: ["Real-time", "Translation", "Sharing"],
                            isExpanded: false
                        },
                        {
                            name: "Expand/Collapse",
                            description: "One-click controls to expand or collapse all nodes for better overview or focused exploration.",
                            icon: "maximize-2",
                            tags: ["Navigation", "UI Control", "Focus"],
                            isExpanded: false
                        },
                        {
                            name: "Download & Share",
                            description: "Export maps as PNG images or share via community links for collaboration and presentations.",
                            icon: "share-2",
                            tags: ["Export", "Collaboration", "Sharing"],
                            isExpanded: false
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
                    name: "Guided Brainstorming",
                    icon: "message-circle",
                    subCategories: [
                        {
                            name: "Guided Brainstorming",
                            description: "Conversational AI interface that asks questions step-by-step to help you define topics and build mind maps from scratch.",
                            icon: "compass",
                            tags: ["Interactive", "Guided", "Brainstorming"],
                            isExpanded: false
                        },
                        {
                            name: "Smart Suggestions",
                            description: "AI-powered clickable suggestions during conversation to make the map-building process faster and more intuitive.",
                            icon: "sparkles",
                            tags: ["Autocomplete", "Suggestions", "Speed"],
                            isExpanded: false
                        },
                        {
                            name: "Context-Aware",
                            description: "The AI remembers your conversation history and provides contextually relevant follow-up questions and suggestions.",
                            icon: "brain",
                            tags: ["Memory", "Context", "Personalized"],
                            isExpanded: false
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
                            tags: ["Text-to-Image", "Creative", "Visual"],
                            isExpanded: false
                        },
                        {
                            name: "Auto Thumbnails",
                            description: "Automatic generation of relevant, visually appealing thumbnails for saved mind maps based on their topics.",
                            icon: "image-plus",
                            tags: ["Automation", "Visual Appeal", "Dashboard"],
                            isExpanded: false
                        },
                        {
                            name: "Example Generation",
                            description: "Generate real-world examples for any concept to make abstract ideas more concrete and understandable.",
                            icon: "pocket",
                            tags: ["Examples", "Practical", "Learning"],
                            isExpanded: false
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
                            tags: ["Always Available", "Help", "Support"],
                            isExpanded: false
                        },
                        {
                            name: "Text Selection Translator",
                            description: "Highlight any text anywhere in the app to instantly translate it with a convenient popover.",
                            icon: "languages",
                            tags: ["Translation", "Convenience", "Multilingual"],
                            isExpanded: false
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
                    name: "Mind Entry Portal",
                    icon: "door-open",
                    subCategories: [
                        {
                            name: "Dynamic Login Showcases",
                            description: "Rotating content on each visit highlighting different MindScape capabilities: Guided Brainstorming, AI Generation, Infinite Exploration, and Vision Mode.",
                            icon: "shuffle",
                            tags: ["Dynamic", "Engaging", "Value Proposition"],
                            isExpanded: false
                        },
                        {
                            name: "Glassmorphism Design",
                            description: "Premium authentication interface with zinc/purple color scheme, subtle glows, and backdrop blur effects.",
                            icon: "sparkles",
                            tags: ["Modern", "Premium", "Aesthetic"],
                            isExpanded: false
                        },
                        {
                            name: "Unified Auth Flow",
                            description: "Seamless sign-in/sign-up experience with Google OAuth and email/password options in a single interface.",
                            icon: "key",
                            tags: ["Streamlined", "Secure", "Flexible"],
                            isExpanded: false
                        }
                    ]
                },
                {
                    name: "Home Page Journey",
                    icon: "home",
                    subCategories: [
                        {
                            name: "Hero Section",
                            description: "Action-oriented entry point with 'Visualize Smarter. Think Faster.' headline and instant mind map generation.",
                            icon: "zap",
                            tags: ["CTA", "Immediate Value", "Interactive"],
                            isExpanded: false
                        },
                        {
                            name: "Transition Bridge",
                            description: "Philosophical anchor 'Everything starts with a thought' connecting user intent to product capabilities.",
                            icon: "bridge",
                            tags: ["Narrative", "Philosophy", "Connection"],
                            isExpanded: false
                        },
                        {
                            name: "Capability Strip",
                            description: "Clean 4-column grid showcasing AI Generation, Nested Exploration, Visual Learning, and Vision Mode with subtle icon glows.",
                            icon: "grid-3x3",
                            tags: ["Overview", "Features", "Lightweight"],
                            isExpanded: false
                        },
                        {
                            name: "Feature Cards",
                            // @ts-ignore
                            title: 'Library',
                            description: 'Access, manage, and revisit all of your saved mind maps in one place.',
                            // @ts-ignore
                            href: '/library',
                            icon: "list",
                            tags: ["Management", "Library"],
                            isExpanded: false
                        },
                        {
                            description: 'Explore a gallery of mind maps created and shared by the community.',
                            // @ts-ignore
                            title: 'Community Maps',
                            // @ts-ignore
                            href: '/community',
                            name: "Community Explorer",
                            icon: "globe",
                            tags: ["Community", "Discovery"],
                            isExpanded: false
                        }
                    ]
                },
                {
                    name: "Dashboard",
                    icon: "layout-dashboard",
                    subCategories: [
                        {
                            name: "My Maps",
                            description: "Personal space to view, search, sort, and manage all your saved mind maps with a beautiful grid layout.",
                            icon: "folder-open",
                            tags: ["Organization", "Search", "Management"],
                            isExpanded: false
                        },
                        {
                            name: "Community Gallery",
                            description: "Explore and duplicate mind maps created and shared by the community for inspiration and learning.",
                            icon: "gallery-vertical",
                            tags: ["Community", "Sharing", "Discovery"],
                            isExpanded: false
                        },
                        {
                            name: "Search & Sort",
                            description: "Find maps quickly by topic and sort by most recent, oldest, or alphabetical order.",
                            icon: "search",
                            tags: ["Filtering", "Organization", "Efficiency"],
                            isExpanded: false
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
                            tags: ["Community", "Contribution", "Visibility"],
                            isExpanded: false
                        },
                        {
                            name: "Duplicate Community Maps",
                            description: "Save any community map to your personal dashboard as an editable copy for customization.",
                            icon: "copy",
                            tags: ["Remix", "Learning", "Customization"],
                            isExpanded: false
                        },
                        {
                            name: "Share Links",
                            description: "Generate shareable links to your mind maps for easy collaboration and presentation.",
                            icon: "link",
                            tags: ["Collaboration", "Sharing", "Access"],
                            isExpanded: false
                        }
                    ]
                }
            ]
        },
        {
            name: "Design Philosophy",
            icon: "palette",
            categories: [
                {
                    name: "Visual Identity",
                    icon: "eye",
                    subCategories: [
                        {
                            name: "Purple/Zinc Theme",
                            description: "Consistent color palette using purple-400 accents on dark zinc backgrounds (zinc-900/zinc-950) for premium feel.",
                            icon: "droplet",
                            tags: ["Branding", "Consistency", "Premium"],
                            isExpanded: false
                        },
                        {
                            name: "Glassmorphism Effects",
                            description: "Subtle backdrop blur, border-white/5 borders, and purple shadow glows for depth and modern aesthetics.",
                            icon: "layers",
                            tags: ["Modern", "Depth", "Visual Hierarchy"],
                            isExpanded: false
                        },
                        {
                            name: "Micro-animations",
                            description: "Smooth transitions, hover effects, and scroll-based reveals using Framer Motion for engaging interactions.",
                            icon: "sparkles",
                            tags: ["Polish", "Engagement", "UX"],
                            isExpanded: false
                        }
                    ]
                },
                {
                    name: "Information Architecture",
                    icon: "sitemap",
                    subCategories: [
                        {
                            name: "Thought → Structure → Clarity",
                            description: "Page flow designed to guide users from philosophical understanding to concrete action and deep exploration.",
                            icon: "arrow-right",
                            tags: ["Narrative", "Flow", "User Journey"],
                            isExpanded: false
                        },
                        {
                            name: "Progressive Disclosure",
                            description: "Information revealed in layers: Hero (action) → Transition (philosophy) → Capabilities (proof) → Features (exploration).",
                            icon: "unfold-vertical",
                            tags: ["Hierarchy", "Clarity", "Cognitive Load"],
                            isExpanded: false
                        },
                        {
                            name: "Minimal Noise",
                            description: "Reduced visual clutter, focused typography, and strategic use of whitespace for calm, professional experience.",
                            icon: "minimize-2",
                            tags: ["Clean", "Focus", "Professional"],
                            isExpanded: false
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
                            tags: ["React", "SSR", "Performance"],
                            isExpanded: false
                        },
                        {
                            name: "TypeScript",
                            description: "Type-safe development ensuring code quality and reducing runtime errors.",
                            icon: "file-code",
                            tags: ["Type Safety", "Quality", "DX"],
                            isExpanded: false
                        },
                        {
                            name: "Tailwind CSS",
                            description: "Utility-first CSS framework for beautiful, responsive, and consistent UI design.",
                            icon: "palette",
                            tags: ["Styling", "Responsive", "Modern"],
                            isExpanded: false
                        },
                        {
                            name: "shadcn/ui",
                            description: "High-quality, accessible UI components built on Radix UI primitives.",
                            icon: "component",
                            tags: ["Components", "Accessible", "Beautiful"],
                            isExpanded: false
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
                            tags: ["BaaS", "Real-time", "Scalable"],
                            isExpanded: false
                        },
                        {
                            name: "Pollinations AI",
                            description: "The core AI engine powering mind map generation, real-time search, and creative content.",
                            icon: "zap",
                            tags: ["Single-Provider", "Generation", "Intelligence"],
                            isExpanded: false
                        },
                        {
                            name: "Multi-Model Search",
                            description: "Advanced search strategy utilizing Perplexity and Mistral models for maximum accuracy.",
                            icon: "search",
                            tags: ["Research", "Citations", "Accuracy"],
                            isExpanded: false
                        }
                    ]
                }
            ]
        }
    ]
} as SingleMindMapData;

