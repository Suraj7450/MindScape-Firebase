'use client';

import { Globe, ExternalLink } from 'lucide-react';
import type { SearchSource } from '@/types/mind-map';

interface SearchReferencesPanelProps {
    sources?: SearchSource[];
    timestamp?: string;
}

/**
 * Displays search sources/references for mind maps generated with web search enabled
 */
export function SearchReferencesPanel({ sources, timestamp }: SearchReferencesPanelProps) {
    if (!sources || sources.length === 0) return null;

    return (
        <aside className="mt-6 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">
                    Live References
                </h3>
                {timestamp && (
                    <span className="ml-auto text-xs text-zinc-500">
                        {new Date(timestamp).toLocaleDateString()}
                    </span>
                )}
            </div>

            <div className="space-y-3">
                {sources.map((source, index) => (
                    <a
                        key={`${source.url}-${index}`}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                    >
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-white/5 hover:border-primary/30 hover:bg-black/60 transition-all">
                            <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-primary transition-colors mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white group-hover:text-primary transition-colors line-clamp-1">
                                    {source.title}
                                </p>
                                {source.snippet && (
                                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                                        {source.snippet}
                                    </p>
                                )}
                                <p className="text-xs text-zinc-500 mt-1 truncate">
                                    {new URL(source.url).hostname}
                                </p>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </aside>
    );
}
