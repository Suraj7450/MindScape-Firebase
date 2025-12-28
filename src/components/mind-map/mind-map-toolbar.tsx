'use client';

import React from 'react';
import {
    Languages,
    Zap,
    Minimize2,
    Maximize2,
    Check,
    Share2,
    Save,
    Rocket,
    Library,
    Network,
    Image as ImageIcon,
    TestTube2,
    Database,
    Loader2,
    RefreshCw,
    Copy,
    Activity,
    AlertCircle as AlertIcon,
    Table,
    Layers,
    Share,
    BookOpen
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { languages } from '@/lib/languages';
import { MindMapStatus } from '@/hooks/use-mind-map-stack';
import { cn } from '@/lib/utils';

interface MindMapToolbarProps {
    languageUI: string;
    onLanguageChange: (lang: string) => void;
    isTranslating: boolean;
    personaUI: string;
    onPersonaChange: (persona: string) => void;
    isAllExpanded: boolean;
    onToggleExpandAll: () => void;
    isCopied: boolean;
    onCopyPath: () => void;
    isSaved: boolean;
    onSave: () => void;
    isPublished: boolean;
    isPublishing: boolean;
    onPublish: () => void;
    onOpenAiContent: () => void;
    onOpenNestedMaps: () => void;
    onOpenGallery: () => void;
    onOpenQuiz: () => void;
    onDuplicate: () => void;
    isDuplicating: boolean;
    onRegenerate: () => void;
    isRegenerating: boolean;
    canRegenerate: boolean;
    nestedExpansionsCount: number;
    imagesCount: number;
    status: MindMapStatus;
    aiHealth?: { name: string, status: string }[];
    viewMode: 'accordion' | 'map';
    onViewModeChange: (mode: 'accordion' | 'map') => void;
}

export const MindMapToolbar = ({
    languageUI,
    onLanguageChange,
    isTranslating,
    personaUI,
    onPersonaChange,
    isAllExpanded,
    onToggleExpandAll,
    isCopied,
    onCopyPath,
    isSaved,
    onSave,
    isPublished,
    isPublishing,
    onPublish,
    onOpenAiContent,
    onOpenNestedMaps,
    onOpenGallery,
    onOpenQuiz,
    onDuplicate,
    isDuplicating,
    onRegenerate,
    isRegenerating,
    canRegenerate,
    nestedExpansionsCount,
    imagesCount,
    status,
    aiHealth = [],
    viewMode,
    onViewModeChange
}: MindMapToolbarProps) => {
    const isBusy = status !== 'idle';
    const isSyncing = status === 'syncing';

    // Derived state for AI health
    const isDegraded = React.useMemo(
        () => aiHealth.some(h => h.status !== 'healthy'),
        [aiHealth]
    );

    return (
        <div className="fixed top-[84px] left-0 z-50 px-4 w-full flex justify-center pointer-events-none">
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl ring-1 ring-white/5 pointer-events-auto">
                {/* Health Indicator */}
                {isDegraded && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 animate-pulse cursor-help">
                                <Activity className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">System Degraded</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-zinc-900 border-zinc-800 text-white p-3 rounded-xl max-w-xs transition-all duration-300">
                            <div className="space-y-2">
                                <p className="font-bold flex items-center gap-2 text-red-400">
                                    <AlertIcon className="h-4 w-4" />
                                    Auto-Healing Active
                                </p>
                                <p className="text-xs text-zinc-400">
                                    Some AI neurons are firing inconsistently. We have automatically diverted your requests to healthy backups.
                                </p>
                                <div className="pt-2 border-t border-white/10">
                                    {aiHealth.map(h => (
                                        <div key={h.name} className="flex justify-between text-[10px] uppercase font-mono">
                                            <span>{h.name}</span>
                                            <span className={h.status === 'healthy' ? 'text-emerald-400' : 'text-red-400'}>{h.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                )}

                {/* Main Controls Group */}
                {viewMode === 'accordion' && (
                    <div className="flex items-center gap-1.5 px-1.5 pr-3 border-r border-white/10">
                        <Select value={languageUI} onValueChange={onLanguageChange} disabled={isTranslating || isBusy}>
                            <SelectTrigger className="h-9 w-[110px] bg-white/5 border-none text-xs rounded-xl hover:bg-white/10 transition-all font-bold text-zinc-200 disabled:opacity-50">
                                <Languages className="w-4 h-4 mr-2 text-primary" />
                                <SelectValue placeholder="Lang" />
                            </SelectTrigger>
                            <SelectContent className="glassmorphism rounded-2xl overflow-hidden">
                                {languages.map(l => (
                                    <SelectItem key={l.code} value={l.code} className="text-xs">{l.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={personaUI} onValueChange={onPersonaChange} disabled={isBusy}>
                            <SelectTrigger className="h-9 w-[110px] bg-white/5 border-none text-xs rounded-xl hover:bg-white/10 transition-all font-bold text-zinc-200 disabled:opacity-50">
                                <Zap className="w-4 h-4 mr-2 text-amber-400" />
                                <SelectValue placeholder="Mode" />
                            </SelectTrigger>
                            <SelectContent className="glassmorphism rounded-2xl overflow-hidden">
                                {['Standard', 'Teacher', 'Concise', 'Creative'].map(p => (
                                    <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Action Group */}
                <div className="flex items-center gap-1.5 px-1">
                    <div className="flex items-center gap-1.5">
                        {viewMode === 'accordion' && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onToggleExpandAll}
                                    className="h-9 gap-2 text-xs font-bold px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all hover:scale-105 active:scale-95"
                                >
                                    {isAllExpanded ? (
                                        <>
                                            <Minimize2 className="h-4 w-4" />
                                            Collapse All
                                        </>
                                    ) : (
                                        <>
                                            <Maximize2 className="h-4 w-4" />
                                            Expand All
                                        </>
                                    )}
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onCopyPath}
                                    className="h-9 gap-2 text-xs font-bold px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all hover:scale-105 active:scale-95"
                                >
                                    {isCopied ? (
                                        <>
                                            <Check className="h-4 w-4 text-emerald-400" />
                                            Shared
                                        </>
                                    ) : (
                                        <>
                                            <Share2 className="h-4 w-4" />
                                            Share
                                        </>
                                    )}
                                </Button>
                            </>
                        )}

                        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl ml-2 border border-white/5">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewModeChange('accordion')}
                                className={cn(
                                    "h-7 text-[10px] font-black uppercase tracking-widest px-3 rounded-lg transition-all",
                                    viewMode === 'accordion' ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                <Table className="w-3 h-3 mr-1.5" />
                                Explore
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewModeChange('map')}
                                className={cn(
                                    "h-7 text-[10px] font-black uppercase tracking-widest px-3 rounded-lg transition-all",
                                    viewMode === 'map' ? "bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                <Layers className="w-3 h-3 mr-1.5" />
                                Map
                            </Button>
                        </div>

                        {!isSaved ? (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={onSave}
                                disabled={isBusy}
                                className="h-9 gap-2 text-xs font-bold px-5 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
                            >
                                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {isSyncing ? 'Saving...' : 'Save Map'}
                            </Button>
                        ) : !isPublished && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onPublish}
                                disabled={isPublishing || isBusy}
                                className="h-9 gap-2 text-xs font-bold px-5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                                {isPublishing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Rocket className="h-4 w-4" />
                                )}
                                {isPublishing ? 'Publishing...' : 'Go Public'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tools Group */}
                <div className="flex items-center gap-1 px-1 pl-3 border-l border-white/10">
                    {viewMode === 'accordion' && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={onOpenAiContent} className="h-9 w-9 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-blue-400">
                                    <Library className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="glassmorphism"><p>Data View</p></TooltipContent>
                        </Tooltip>
                    )}

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={onOpenNestedMaps} className="h-9 w-9 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-purple-400 relative">
                                <Network className="h-4 w-4" />
                                {nestedExpansionsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
                                        {nestedExpansionsCount}
                                    </span>
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="glassmorphism"><p>Nested Maps</p></TooltipContent>
                    </Tooltip>

                    {viewMode === 'accordion' && (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={onOpenGallery} className="h-9 w-9 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-pink-400 relative">
                                        <ImageIcon className="h-4 w-4" />
                                        {imagesCount > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white">
                                                {imagesCount}
                                            </span>
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="glassmorphism"><p>Image Gallery</p></TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={onOpenQuiz} className="h-9 w-9 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-amber-400">
                                        <TestTube2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="glassmorphism"><p>Quiz Me</p></TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onDuplicate}
                                        disabled={isDuplicating || isBusy}
                                        className="h-9 w-9 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-cyan-400 disabled:opacity-50"
                                    >
                                        {isDuplicating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="glassmorphism"><p>Duplicate Map</p></TooltipContent>
                            </Tooltip>
                        </>
                    )}

                    {canRegenerate && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onRegenerate}
                                    disabled={isRegenerating || isBusy}
                                    className="h-9 w-9 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-red-400 disabled:opacity-50"
                                >
                                    {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="glassmorphism"><p>Regenerate Map</p></TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </div>
        </div>
    );
};
