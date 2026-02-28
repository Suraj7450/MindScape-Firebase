import { SingleMindMapData } from "@/types/mind-map";

export const mindscapeMap = {
    mode: "single",
    topic: "MindScape",
    shortTitle: "MindScape",
    icon: "brain-circuit",
    subTopics: [
        {
            name: "Core Intelligence",
            icon: "sparkles",
            categories: [
                {
                    name: "Mind Map Engine",
                    icon: "network",
                    subCategories: [
                        {
                            name: "Instant Generation",
                            description: "Create comprehensive maps instantly from the Home page. Enter any topic or upload a PDF/Image for automated structuring.",
                            icon: "zap",
                            tags: ["Single Mode", "OCR", "Vision"],
                            isExpanded: false
                        },
                        {
                            name: "Compare Concepts",
                            description: "Visualize differences and similarities between two topics side-by-side with automated cross-analysis nodes.",
                            icon: "git-compare-arrows",
                            tags: ["Compare Mode", "Analysis"],
                            isExpanded: false
                        },
                        {
                            name: "Knowledge Pack Exports",
                            description: "Export comprehensive knowledge packs as structured PDFs with professional layouts, ready for offline study or sharing.",
                            icon: "file-down",
                            tags: ["PDF", "Export", "jsPDF"],
                            isExpanded: false
                        },
                        {
                            name: "Knowledge Navigator",
                            description: "Deep dive through infinite hierarchies using Miller Columns. Smooth lateral navigation across nested sub-maps.",
                            icon: "layout-columns",
                            tags: ["Miller Columns", "Hierarchy"],
                            isExpanded: false
                        }
                    ]
                },
                {
                    name: "Vision & Documents",
                    icon: "file-text",
                    subCategories: [
                        {
                            name: "Document Analysis",
                            description: "Upload PDFs to extract insights and structure them into interactive mind maps with cited references.",
                            icon: "file-up",
                            tags: ["PDF", "Extraction"],
                            isExpanded: false
                        },
                        {
                            name: "Vision Engine",
                            description: "Analyze images and diagrams to generate related concept structures and visual breakdowns.",
                            icon: "eye",
                            tags: ["Image-to-Map", "OCR"],
                            isExpanded: false
                        },
                        {
                            name: "Quantum Navigation",
                            description: "Experience zero-delay page transitions with instant Materializing architecture, removing all navigation friction.",
                            icon: "zap",
                            tags: ["Performance", "UX"],
                            isExpanded: false
                        }
                    ]
                }
            ]
        },
        {
            name: "Interactive Growth",
            icon: "graduation-cap",
            categories: [
                {
                    name: "AI Assistance",
                    icon: "bot",
                    subCategories: [
                        {
                            name: "MindSpark AI",
                            description: "The global assistant (Sparkle icon) available 24/7 for context-aware chat, explanations, and quiz generation.",
                            icon: "sparkles",
                            tags: ["Chat", "Helper"],
                            isExpanded: false
                        },
                        {
                            name: "Practice Arena",
                            description: "Engage in active recall. Click the Swords icon on any node to generate interactive testing sessions.",
                            icon: "swords",
                            tags: ["Active Recall", "Testing"],
                            isExpanded: false
                        },
                        {
                            name: "Global Challenge",
                            description: "Gamified quizzes covering entire map sections or the whole board to validate your systemic knowledge.",
                            icon: "brain-circuit",
                            tags: ["Gamification", "Quiz"],
                            isExpanded: false
                        },
                        {
                            name: "Achievement System",
                            description: "Unlock 15+ specialized achievements across Creation, Consistency, and Exploration to track your cognitive growth.",
                            icon: "award",
                            tags: ["Gamification", "Badges"],
                            isExpanded: false
                        }
                    ]
                },
                {
                    name: "Visual Feedback",
                    icon: "activity",
                    subCategories: [
                        {
                            name: "MindFlow Skeletons",
                            description: "Branded radial skeletons and premium layout placeholders ensuring visual continuity during AI operations.",
                            icon: "network",
                            tags: ["Skeletons", "UX"],
                            isExpanded: false
                        },
                        {
                            name: "Notification Center",
                            description: "Redesigned premium notification hub with 'Activities' and 'What's New' tabs for tracking progress and platform updates.",
                            icon: "bell",
                            tags: ["Premium UI", "Changelog"],
                            isExpanded: false
                        },
                        {
                            name: "AI Explanations",
                            description: "Click any node for context-aware deep dives. Ask follow-up questions for nuanced understanding.",
                            icon: "message-square-text",
                            tags: ["Context", "Depth"],
                            isExpanded: false
                        }
                    ]
                }
            ]
        },
        {
            name: "Creative Ecosystem",
            icon: "palette",
            categories: [
                {
                    name: "Vision & Imaging",
                    icon: "wand-2",
                    subCategories: [
                        {
                            name: "Visual Insight Lab",
                            description: "The premier AI art laboratory. Generate cinematic thumbnails or enhance prompts for ultra-high-fidelity imagery.",
                            icon: "sparkles",
                            tags: ["Imaging", "Studio"],
                            isExpanded: false
                        },
                        {
                            name: "Multi-language UI",
                            description: "Full platform localization supporting 14+ languages with instant on-the-fly translation of all data.",
                            icon: "languages",
                            tags: ["Global", "Translation"],
                            isExpanded: false
                        }
                    ]
                },
                {
                    name: "Social Learning",
                    icon: "users",
                    subCategories: [
                        {
                            name: "Community Gallery",
                            description: "Explore the collective intelligence. Duplicate, remix, and learn from thousands of shared maps.",
                            icon: "globus",
                            tags: ["Social", "Sharing"],
                            isExpanded: false
                        },
                        {
                            name: "One-Click Publishing",
                            description: "Securely publish your maps to the gallery. Categorized by AI for maximum reach and discovery.",
                            icon: "rocket",
                            tags: ["Publish", "Impact"],
                            isExpanded: false
                        },
                        {
                            name: "Advanced Sharing",
                            description: "Generate secure, shareable links with `sharedMapId` support. Optimized for community collaboration and link consistency.",
                            icon: "share-2",
                            tags: ["Collaboration", "Links"],
                            isExpanded: false
                        },
                        {
                            name: "Personal Cloud Vault",
                            description: "Secure real-time synchronization via Firebase. Protected by owner-only security rules (Option B encryption) for maximum privacy.",
                            icon: "cloud",
                            tags: ["Backup", "Security"],
                            isExpanded: false
                        }
                    ]
                }
            ]
        }
    ]
} as SingleMindMapData;


