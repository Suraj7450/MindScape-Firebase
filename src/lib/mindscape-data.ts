

import type { SingleMindMapData } from '@/types/mind-map';

/**
 * Static mind map data for MindScape itself, based on the PRD.
 * This is shown when users search for "MindScape" to showcase the product's features.
 */
export const mindscapeMap = {
    mode: "single",
    topic: "MindScape",
    shortTitle: "MindScape",
    icon: "brain-circuit",
    subTopics: [
        {
            name: "Core Experience",
            icon: "sparkles",
            categories: [
                {
                    name: "Mind Map Engine",
                    icon: "network",
                    subCategories: [
                        {
                            name: "Instant Generation",
                            description: "Create comprehensive maps instantly from the Home page (Single Mode). Enter any topic (text) or upload a PDF/Image.",
                            icon: "zap",
                            tags: ["Home Page", "Single Mode", "Creation"],
                            isExpanded: false
                        },
                        {
                            name: "Brainstorm Wizard",
                            description: "Select 'Brainstorm' mode on the Home page for a guided, step-by-step wizard to refine your idea before mapping.",
                            icon: "wand-sparkles",
                            tags: ["Home Page", "Brainstorm Mode", "Guided"],
                            isExpanded: false
                        },
                        {
                            name: "Compare Concepts",
                            description: "Select 'Compare' mode on the Home page to visualize differences and similarities between two topics side-by-side.",
                            icon: "git-compare-arrows",
                            tags: ["Home Page", "Compare Mode", "Analysis"],
                            isExpanded: false
                        },
                        {
                            name: "Nested Deep Dive",
                            description: "Click the 'Network' icon on the Toolbar or 'Deep Dive' on any node to generate recursive sub-maps.",
                            icon: "git-branch",
                            tags: ["Toolbar", "Recursive", "Exploration"],
                            isExpanded: false
                        },
                        {
                            name: "Multi-language Support",
                            description: "Switch languages instantly using the Language Selector in the Toolbar (top-left). Supports 14+ languages.",
                            icon: "languages",
                            tags: ["Toolbar", "Global", "Accessibility"],
                            isExpanded: false
                        }
                    ]
                },
                {
                    name: "Interactive Learning",
                    icon: "graduation-cap",
                    subCategories: [
                        {
                            name: "Global Assistant",
                            description: "Click the Sparkle icon (bottom-right) or 'AI Chat' in Toolbar to chat with MindSpark AI anytime.",
                            icon: "bot",
                            tags: ["Global", "Chat", "Help"],
                            isExpanded: false
                        },
                        {
                            name: "Practice Mode",
                            description: "Toggle 'Practice' in the Toolbar to overlay interactive questions on nodes. Test your knowledge actively.",
                            icon: "swords",
                            tags: ["Toolbar", "Active Recall", "Testing"],
                            isExpanded: false
                        },
                        {
                            name: "AI Explanations",
                            description: "Click any node to open the Chat Panel with a context-aware explanation. Ask follow-up questions for deep understanding.",
                            icon: "lightbulb",
                            tags: ["Click Interaction", "Chat Panel", "Deep Dive"],
                            isExpanded: false
                        },
                        {
                            name: "Global Challenge",
                            description: "Click 'Challenge' in the Toolbar to start a gamified quiz covering the entire mind map topic.",
                            icon: "brain-circuit",
                            tags: ["Toolbar", "Gamification", "Quiz"],
                            isExpanded: false
                        }
                    ]
                }
            ]
        },
        {
            name: "Creative Studio",
            icon: "palette",
            categories: [
                {
                    name: "Knowledge Studio",
                    icon: "wand-2",
                    subCategories: [
                        {
                            name: "Transform Content",
                            description: "Click 'Knowledge Studio' in the Toolbar to transform maps into likely blog posts, essays, or scripts.",
                            icon: "file-pen",
                            tags: ["Toolbar", "Creation", "Writing"],
                            isExpanded: false
                        },
                        {
                            name: "Visual Generation",
                            description: "Generate cinematic images for topics via the 'Image Gallery' in the Toolbar or within Knowledge Studio.",
                            icon: "image",
                            tags: ["Pollinations AI", "Visuals", "Art"],
                            isExpanded: false
                        },
                        {
                            name: "Thumbnail Magic",
                            description: "MindScape automatically generates beautiful thumbnails for your maps, visible in your Personal Library.",
                            icon: "image-plus",
                            tags: ["Library", "Automation", "Aesthetics"],
                            isExpanded: false
                        }
                    ]
                },
                {
                    name: "Vision & Documents",
                    icon: "eye",
                    subCategories: [
                        {
                            name: "Document Analysis",
                            description: "Upload PDFs on the Home page to extract insights and structure them into interactive mind maps.",
                            icon: "file-search",
                            tags: ["Home Page", "OCR", "Analysis"],
                            isExpanded: false
                        },
                        {
                            name: "Vision Mode",
                            description: "Upload images on the Home page to analyze visuals and generate related concept structures.",
                            icon: "view",
                            tags: ["Home Page", "Multimodal", "Computer Vision"],
                            isExpanded: false
                        }
                    ]
                }
            ]
        },
        {
            name: "Ecosystem",
            icon: "globe",
            categories: [
                {
                    name: "Community & Library",
                    icon: "library",
                    subCategories: [
                        {
                            name: "Personal Library",
                            description: "Access your saved maps via 'Library' in the Navbar. Manage, search, and delete your creations.",
                            icon: "folder-open",
                            tags: ["Navbar", "Organization", "Management"],
                            isExpanded: false
                        },
                        {
                            name: "Community Gallery",
                            description: "Explore maps by other users via 'Community' in the Navbar. Duplicate them to your library to remix.",
                            icon: "users",
                            tags: ["Navbar", "Sharing", "Inspiration"],
                            isExpanded: false
                        },
                        {
                            name: "Publishing",
                            description: "Click the Rocket icon in the Toolbar to publish your current map to the global Community Gallery.",
                            icon: "share-2",
                            tags: ["Toolbar", "Publishing", "Social"],
                            isExpanded: false
                        }
                    ]
                },
                {
                    name: "Technical Architecture",
                    icon: "server",
                    subCategories: [
                        {
                            name: "Modern Stack",
                            description: "Built with Next.js 15, TypeScript, and Tailwind CSS. Validated for performance and SEO.",
                            icon: "code-2",
                            tags: ["Next.js", "React", "Tech"],
                            isExpanded: false
                        },
                        {
                            name: "Hybrid AI Engine",
                            description: "Orchestrates multiple models (Pollinations, Mistral, Perplexity) for specialized tasks like chat, imagery, and logic.",
                            icon: "cpu",
                            tags: ["Multi-Model", "Agile", "Intelligence"],
                            isExpanded: false
                        },
                        {
                            name: "Secure Backend",
                            description: "Powered by Firebase for secure Authentication, Firestore Database, and real-time synchronization.",
                            icon: "database",
                            tags: ["Firebase", "Security", "Real-time"],
                            isExpanded: false
                        }
                    ]
                }
            ]
        }
    ]
} as SingleMindMapData;

