
import { Sparkles, Zap, Palette, Layout, Network, Image as ImageIcon, FastForward, Info } from 'lucide-react';

export interface ChangelogHighlight {
    icon: any;
    color: string;
    title: string;
    description: string;
}

export interface ChangelogVersion {
    version: string;
    date: string;
    title: string;
    description?: string;
    highlights: ChangelogHighlight[];
}

export const CHANGELOG_DATA: ChangelogVersion[] = [
    {
        version: '1.3.0',
        date: 'February 26, 2026',
        title: 'Quantum Navigation & Skeletons',
        description: "Massive performance upgrade for navigation and loading states.",
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
    },
    {
        version: '1.2.5',
        date: 'February 20, 2026',
        title: 'Nested Maps: Miller Columns',
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
    },
    {
        version: '1.2.0',
        date: 'February 15, 2026',
        title: 'Visual Polish & Stability',
        highlights: [
            {
                icon: Palette,
                color: 'text-pink-400 bg-pink-500/10',
                title: 'Redesigned Toolbar',
                description: 'Fresh look for the MindMap toolbar with distinct colors for Knowledge Studio, Challenge, and Summary.',
            },
            {
                icon: Zap,
                color: 'text-amber-400 bg-amber-500/10',
                title: 'Better Persistence',
                description: 'Fixed issues with map saving and circular reference errors during complex AI generations.',
            },
        ],
    },
];

export const CURRENT_VERSION = CHANGELOG_DATA[0].version;
export const STORAGE_KEY = 'mindscape_changelog_version';
