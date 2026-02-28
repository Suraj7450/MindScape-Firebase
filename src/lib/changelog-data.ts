
import { Sparkles, Zap, Palette, Layout, Network, Image as ImageIcon, FastForward, Info, Shield, Brain, Cpu, RefreshCw, Trash2, Eye } from 'lucide-react';

export interface ChangelogHighlight {
    icon: any;
    color: string;
    title: string;
    description: string;
}

export interface ChangelogVersion {
    version: string;
    slug: string;
    date: string;
    title: string;
    description?: string;
    summary: string;
    coverImage: string;
    tags: string[];
    impact: 'major' | 'minor' | 'patch';
    highlights: ChangelogHighlight[];
    content: string[];
}

export const CHANGELOG_DATA: ChangelogVersion[] = [
    {
        version: '1.4.0',
        slug: 'intelligence-engine-overhaul',
        date: 'February 28, 2026',
        title: 'Intelligence Engine Overhaul',
        summary: 'Major AI reliability improvements — smarter model selection, template echo protection, and real-time thumbnail updates for nested maps.',
        coverImage: '/changelog/canvas-mindmap.png',
        tags: ['AI', 'Reliability', 'UX', 'Performance'],
        impact: 'major',
        highlights: [
            {
                icon: Brain,
                color: 'text-purple-400 bg-purple-500/10',
                title: 'Consistent Model Selection',
                description: 'Your chosen AI model is now respected across all generation modes — single, compare, and sub-maps. No more silent overrides.',
            },
            {
                icon: Shield,
                color: 'text-emerald-400 bg-emerald-500/10',
                title: 'Template Echo Protection',
                description: 'New validation layer detects when AI echoes prompt templates instead of generating real content. Auto-retries with model rotation for guaranteed results.',
            },
            {
                icon: Eye,
                color: 'text-blue-400 bg-blue-500/10',
                title: 'Live Thumbnail Refresh',
                description: 'Nested map thumbnails now update in real-time when generated — no more manual page refresh needed.',
            },
            {
                icon: Trash2,
                color: 'text-red-400 bg-red-500/10',
                title: 'Codebase Cleanup',
                description: 'Removed experimental Warp and Mentor features. Deprecated deepseek-chat model removed with automatic fallback for users with stale preferences.',
            },
        ],
        content: [
            "This release focuses on the invisible but critical infrastructure that powers every mind map you generate. We've rebuilt the model selection pipeline to be more predictable, more reliable, and fully respectful of your preferences.",
            "## Smarter Model Selection",
            "Previously, when you selected a specific AI model in your profile, the system would silently override your choice for certain generation modes like Compare or deep-dive maps. This happened because the internal 'capability' system would discard your model when it decided a different capability (like 'reasoning') was needed.",
            "Now, your model choice is always passed through first. The capability hint is still sent for auto-select fallback, but it never overrides an explicit user selection. This means consistent output quality across single mode, compare mode, and all sub-map generations.",
            "## Template Echo Protection",
            "We discovered a rare but frustrating bug where some AI models would echo back the JSON template from our prompt instead of generating real content. The result was a mind map filled with placeholder text like 'Subtopic Name' and 'Category Name'.",
            "The new template detection system checks every generation against a set of known placeholder markers. If 2+ markers are found, the generation is automatically retried with a different model — up to 3 attempts with automatic model rotation. The system prompt was also enhanced with explicit anti-template instructions.",
            "## Real-Time Thumbnail Updates",
            "The nested maps dialog (Knowledge Navigator) now reflects thumbnail changes instantly. Previously, when you generated a new thumbnail for a sub-map, the card in the navigator would still show the old image until you refreshed the browser. The fix was a priority resolution change — the dialog now reads from the live `thumbnailOverrides` state before falling back to persisted Firestore data.",
            "## Cleanup & Deprecations",
            "The experimental **Warp** (Perspective Warp) and **Mentor Roleplay** features have been fully removed. These were partially wired handlers with no clear product surface. The deprecated `deepseek-chat` model was also removed from the available models list, with a sanitization layer added to gracefully handle users whose saved preferences reference it.",
        ],
    },
    {
        version: '1.3.0',
        slug: 'quantum-navigation-skeletons',
        date: 'February 26, 2026',
        title: 'Quantum Navigation & Skeletons',
        summary: 'Massive performance upgrade for navigation and loading states with instant canvas transitions.',
        coverImage: '/changelog/library-thumbnails.png',
        tags: ['Performance', 'UX', 'Navigation'],
        impact: 'major',
        highlights: [
            {
                icon: FastForward,
                color: 'text-emerald-400 bg-emerald-500/10',
                title: 'Instant Navigation',
                description: 'We removed blocking home page overlays. Click "Generate" and jump straight to the canvas instantly.',
            },
            {
                icon: Network,
                color: 'text-primary bg-primary/10',
                title: 'Mind Map Skeletons',
                description: 'New specialized radial skeletons show a pulsing "building" state for your maps while AI works.',
            },
            {
                icon: Layout,
                color: 'text-blue-400 bg-blue-500/10',
                title: 'Page Recovery',
                description: 'Added high-fidelity skeletons for Community and Profile pages for a flicker-free experience.',
            },
        ],
        content: [
            "This release is all about speed and perceived performance. We've fundamentally changed how navigation works in MindScape to eliminate the feeling of 'waiting'.",
            "## Instant Canvas Navigation",
            "Previously, clicking 'Generate' on the home page would show a full-screen overlay while the AI started working. This blocked all interaction and felt slow. Now, you're immediately routed to the canvas page where a beautiful radial skeleton animation plays while your map generates in the background.",
            "## Skeleton Loading States",
            "Every major page now has purpose-built skeleton states. The mind map canvas shows an animated radial network, the Community page shows card placeholders, and the Profile page shows a structured layout skeleton. These are designed to match the final UI layout, so the transition from loading to loaded feels seamless.",
            "## Technical Details",
            "The navigation change was achieved by moving the generation trigger from the home page to the canvas page's `useEffect`. The canvas now reads URL parameters to determine what to generate, and the generation happens client-side after mount. This eliminates the need for any blocking overlay.",
        ],
    },
    {
        version: '1.2.5',
        slug: 'nested-maps-miller-columns',
        date: 'February 20, 2026',
        title: 'Nested Maps: Miller Columns',
        summary: 'The Knowledge Navigator gets a powerful Miller Columns interface for deep, multi-level exploration.',
        coverImage: '/changelog/nested-maps-miller.png',
        tags: ['Navigation', 'UX', 'Nested Maps'],
        impact: 'minor',
        highlights: [
            {
                icon: Network,
                color: 'text-purple-400 bg-purple-500/10',
                title: 'Miller Columns',
                description: 'The Nested Maps explorer now uses a smooth, multi-column Miller Columns interface for deep navigation.',
            },
            {
                icon: ImageIcon,
                color: 'text-amber-400 bg-amber-500/10',
                title: 'Visual Insight Lab',
                description: 'Generate and enhance high-resolution thumbnails for your nested maps directly from the new Insight Lab.',
            },
        ],
        content: [
            "This release introduces a completely new way to navigate your knowledge graph. The flat list of nested maps has been replaced with an elegant Miller Columns interface — the same pattern used by macOS Finder.",
            "## Miller Columns Navigation",
            "Each level of your mind map hierarchy gets its own scrollable column. Click a node to reveal its children in the next column. This makes it intuitive to explore deep, multi-level structures without losing context of where you are.",
            "## Visual Insight Lab",
            "Every nested map card now has a sparkle button that opens the Visual Insight Lab. Here you can generate high-resolution AI thumbnails for your sub-maps, making the Knowledge Navigator visually rich and easier to scan.",
        ],
    },
    {
        version: '1.2.0',
        slug: 'visual-polish-stability',
        date: 'February 15, 2026',
        title: 'Visual Polish & Stability',
        summary: 'Redesigned toolbar, improved persistence, and squashed circular reference bugs.',
        coverImage: '/changelog/toolbar-polish.png',
        tags: ['Design', 'Stability', 'Persistence'],
        impact: 'minor',
        highlights: [
            {
                icon: Palette,
                color: 'text-pink-400 bg-pink-500/10',
                title: 'Redesigned Toolbar',
                description: 'Fresh look for the MindMap toolbar with distinct colors for Imaging, Challenge, and Summary.',
            },
            {
                icon: Zap,
                color: 'text-amber-400 bg-amber-500/10',
                title: 'Better Persistence',
                description: 'Fixed issues with map saving and circular reference errors during complex AI generations.',
            },
        ],
        content: [
            "A focused polish release that improves the visual quality of the toolbar and fixes several data persistence bugs.",
            "## Redesigned Toolbar",
            "The mind map toolbar has been completely refreshed with distinct color-coded sections. The Imaging tools use violet, Challenge/Quiz uses amber, and Summary uses blue. Each tool now has a more prominent icon and label with hover effects that feel premium.",
            "## Persistence Fixes",
            "We fixed a critical bug where complex mind maps with deeply nested sub-maps would fail to save due to circular reference errors in the JSON serialization. The fix uses a custom serializer that strips circular references before saving to Firestore.",
        ],
    },
];

export const CURRENT_VERSION = CHANGELOG_DATA[0].version;
export const STORAGE_KEY = 'mindscape_changelog_version';
