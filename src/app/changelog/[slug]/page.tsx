'use client';

import { useParams, notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import { CHANGELOG_DATA } from '@/lib/changelog-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
    ArrowLeft,
    Calendar,
    Tag,
    ChevronLeft,
    ChevronRight,
    Sparkles,
} from 'lucide-react';

const impactConfig = {
    major: { label: 'Major Release', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    minor: { label: 'Minor Release', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    patch: { label: 'Patch', color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' },
};

export default function ChangelogArticlePage() {
    const params = useParams();
    const slug = params.slug as string;

    const entryIndex = CHANGELOG_DATA.findIndex(e => e.slug === slug);
    if (entryIndex === -1) {
        notFound();
    }

    const entry = CHANGELOG_DATA[entryIndex];
    const impact = impactConfig[entry.impact];
    const prevEntry = entryIndex < CHANGELOG_DATA.length - 1 ? CHANGELOG_DATA[entryIndex + 1] : null;
    const nextEntry = entryIndex > 0 ? CHANGELOG_DATA[entryIndex - 1] : null;

    return (
        <div className="min-h-screen bg-[#0D0D0D]">
            {/* Hero Image */}
            <div className="relative h-[320px] md:h-[420px] overflow-hidden">
                <img
                    src={entry.coverImage}
                    alt={entry.title}
                    className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-transparent pointer-events-none" />

                {/* Back Button */}
                <div className="absolute top-6 left-6 z-20">
                    <Link href="/changelog">
                        <Button
                            variant="ghost"
                            className="rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:text-white gap-2 px-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            All Updates
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Article Content */}
            <div className="max-w-3xl mx-auto px-6 -mt-24 relative z-10">
                <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-white/20 text-white text-xs uppercase tracking-widest font-black">
                            v{entry.version}
                        </Badge>
                        <Badge variant="outline" className={cn("backdrop-blur-md text-xs uppercase tracking-widest font-black", impact.color)}>
                            {impact.label}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{entry.date}</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight font-orbitron mb-4 leading-tight">
                        {entry.title}
                    </h1>

                    <p className="text-lg text-zinc-400 leading-relaxed mb-8">
                        {entry.summary}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-10">
                        {entry.tags.map(tag => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-300 uppercase tracking-widest font-bold"
                            >
                                <Tag className="h-3 w-3 text-zinc-500" />
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Highlights Section */}
                    <div className="mb-12">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-purple-400 mb-5 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Key Highlights
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {entry.highlights.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
                                    className="flex gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors group"
                                >
                                    <div className={cn("flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center", item.color)}>
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
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Article Body */}
                    <div className="prose-custom">
                        {entry.content.map((paragraph, idx) => {
                            if (paragraph.startsWith('## ')) {
                                return (
                                    <h2
                                        key={idx}
                                        className="text-xl md:text-2xl font-black text-white mt-10 mb-4 tracking-tight"
                                    >
                                        {paragraph.replace('## ', '')}
                                    </h2>
                                );
                            }
                            return (
                                <p
                                    key={idx}
                                    className="text-[15px] text-zinc-400 leading-[1.8] mb-5"
                                >
                                    {paragraph}
                                </p>
                            );
                        })}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-12" />

                    {/* Previous / Next Navigation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
                        {prevEntry ? (
                            <Link href={`/changelog/${prevEntry.slug}`} className="group">
                                <div className="p-5 rounded-xl border border-white/10 bg-zinc-950/60 hover:border-purple-500/30 hover:bg-zinc-900/60 transition-all duration-300">
                                    <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-2">
                                        <ChevronLeft className="h-3 w-3" />
                                        Older
                                    </div>
                                    <p className="text-sm font-bold text-zinc-200 group-hover:text-purple-300 transition-colors truncate">
                                        {prevEntry.title}
                                    </p>
                                    <span className="text-[10px] text-zinc-500 font-mono">v{prevEntry.version}</span>
                                </div>
                            </Link>
                        ) : <div />}

                        {nextEntry ? (
                            <Link href={`/changelog/${nextEntry.slug}`} className="group">
                                <div className="p-5 rounded-xl border border-white/10 bg-zinc-950/60 hover:border-purple-500/30 hover:bg-zinc-900/60 transition-all duration-300 text-right">
                                    <div className="flex items-center justify-end gap-1.5 text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-2">
                                        Newer
                                        <ChevronRight className="h-3 w-3" />
                                    </div>
                                    <p className="text-sm font-bold text-zinc-200 group-hover:text-purple-300 transition-colors truncate">
                                        {nextEntry.title}
                                    </p>
                                    <span className="text-[10px] text-zinc-500 font-mono">v{nextEntry.version}</span>
                                </div>
                            </Link>
                        ) : <div />}
                    </div>
                </motion.article>
            </div>
        </div>
    );
}
