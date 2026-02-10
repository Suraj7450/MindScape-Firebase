'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Zap, Palette, PartyPopper, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this exists

// --- Changelog Data ---
// In a real app, this could come from a JSON file or API.
const CHANGELOG_DATA = [
    {
        version: '1.2.0',
        date: 'February 2026', // Contextual date
        title: 'Visual Polish & Stability',
        highlights: [
            {
                icon: Palette,
                color: 'text-pink-400 bg-pink-500/10',
                title: 'New Toolbar Colors',
                description: 'Fresh look for the MindMap toolbar with distinct colors for Challenge, Transform, and Summary.',
            },
            {
                icon: Zap,
                color: 'text-purple-400 bg-purple-500/10',
                title: 'Transform Stability',
                description: 'Enhanced reliability for generating dossiers and quizzes, with better error handling for large maps.',
            },
            {
                icon: Sparkles,
                color: 'text-amber-400 bg-amber-500/10',
                title: 'Library Grid Fix',
                description: 'Improved layout for saved mind maps to ensure all your creations are visible.',
            },
        ],
    },
    // Add older versions here if needed
];

const CURRENT_VERSION = CHANGELOG_DATA[0].version;
const STORAGE_KEY = 'mindscape_changelog_version';

export function ChangelogDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        // Check local storage on mount
        const lastSeenVersion = localStorage.getItem(STORAGE_KEY);

        if (lastSeenVersion !== CURRENT_VERSION) {
            // Small delay for better UX (don't pop up immediately on load)
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1500);
            return () => clearTimeout(timer);
        }

        setHasChecked(true);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    };

    // Allow manual trigger via custom event or global state if needed later
    // For now, it just auto-shows on new version.

    if (!CHANGELOG_DATA.length) return null;
    const latest = CHANGELOG_DATA[0];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-[#0a0a0b] border-zinc-800 text-white gap-0 shadow-2xl">

                {/* Header with Gradient Background */}
                <div className="relative p-6 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/20 to-transparent pointer-events-none" />
                    <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/3 -translate-y-1/3">
                        <PartyPopper className="w-32 h-32 text-purple-500" />
                    </div>

                    <DialogHeader className="relative z-10 space-y-2 text-left">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 backdrop-blur-md px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold">
                                New Update
                            </Badge>
                            <span className="text-xs text-zinc-500 font-mono tracking-tight">v{latest.version}</span>
                        </div>
                        <DialogTitle className="text-2xl font-black tracking-tight text-white">
                            {latest.title}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 text-sm">
                            We've just pushed some updates to improve your experience. Here's what's new.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Content Scroll Area */}
                <ScrollArea className="max-h-[60vh] px-6 pb-2">
                    <div className="space-y-4 py-2">
                        {latest.highlights.map((item, idx) => (
                            <div key={idx} className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group">
                                <div className={cn("flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center", item.color)}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-zinc-100 group-hover:text-purple-300 transition-colors">
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <DialogFooter className="p-6 pt-2">
                    <Button
                        onClick={handleClose}
                        className="w-full bg-white text-black hover:bg-zinc-200 font-bold rounded-xl"
                    >
                        Start Exploring
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
