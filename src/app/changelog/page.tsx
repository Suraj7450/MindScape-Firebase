'use client';

import { motion } from 'framer-motion';
import { CHANGELOG_DATA } from '@/lib/changelog-data';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
    Sparkles,
    ArrowRight,
    Calendar,
    Tag,
    Rocket,
    ChevronRight,
} from 'lucide-react';

const impactConfig = {
    major: { label: 'Major', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    minor: { label: 'Minor', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    patch: { label: 'Patch', color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' },
};

export default function ChangelogPage() {
    return (
        <div className="min-h-screen bg-[#0D0D0D]">
            {/* Hero */}
            <div className="relative overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/10 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,50,255,0.15),transparent_70%)] pointer-events-none" />

                <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                            <Rocket className="h-4 w-4 text-purple-400" />
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-300">Product Updates</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight font-orbitron mb-4">
                            What&apos;s New in{' '}
                            Mind<span className="text-primary">Scape</span>
                        </h1>
                        <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                            Every improvement, feature, and fix — documented with impact and context.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Timeline / Cards Grid */}
            <div className="max-w-6xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {CHANGELOG_DATA.map((entry, idx) => {
                        const impact = impactConfig[entry.impact];

                        return (
                            <motion.div
                                key={entry.slug}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                            >
                                <Link href={`/changelog/${entry.slug}`} className="block group">
                                    <div className="h-full rounded-2xl border border-white/10 bg-zinc-950/80 overflow-hidden transition-all duration-500 hover:border-purple-500/40 hover:shadow-[0_0_40px_rgba(120,50,255,0.1)] hover:-translate-y-1">
                                        {/* Cover Image */}
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={entry.coverImage}
                                                alt={entry.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-90"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />

                                            {/* Version + Impact Badge */}
                                            <div className="absolute top-4 left-4 flex items-center gap-2">
                                                <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-white/20 text-white text-[10px] uppercase tracking-widest font-black shadow-xl">
                                                    v{entry.version}
                                                </Badge>
                                                <Badge variant="outline" className={cn("backdrop-blur-md text-[10px] uppercase tracking-widest font-black shadow-xl", impact.color)}>
                                                    {impact.label}
                                                </Badge>
                                            </div>

                                            {/* Latest Badge */}
                                            {idx === 0 && (
                                                <div className="absolute top-4 right-4">
                                                    <Badge className="bg-purple-500 text-white text-[10px] uppercase tracking-widest font-black shadow-[0_0_20px_rgba(168,85,247,0.5)] border-0 animate-pulse">
                                                        <Sparkles className="h-3 w-3 mr-1" /> Latest
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 flex flex-col gap-3">
                                            <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                                <Calendar className="h-3 w-3" />
                                                <span>{entry.date}</span>
                                            </div>

                                            <h2 className="text-xl font-black text-white group-hover:text-purple-300 transition-colors leading-tight tracking-tight">
                                                {entry.title}
                                            </h2>

                                            <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">
                                                {entry.summary}
                                            </p>

                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {entry.tags.map(tag => (
                                                    <span
                                                        key={tag}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-zinc-400 uppercase tracking-widest font-bold"
                                                    >
                                                        <Tag className="h-2.5 w-2.5" />
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Read More */}
                                            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-purple-400 group-hover:text-purple-300 transition-colors uppercase tracking-widest">
                                                Read Full Article
                                                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
