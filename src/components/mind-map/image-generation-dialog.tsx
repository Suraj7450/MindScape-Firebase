'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sparkles,
    Wand2,
    Monitor,
    Smartphone,
    Square as SquareIcon,
    Palette,
    Loader2,
    Image as ImageIcon,
    Camera,
    CloudRain,
    Sun,
    Zap,
    Wind,
    Moon,
    Flame
} from 'lucide-react';
import { ModelSelector } from '@/components/model-selector';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ImageGenerationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (settings: ImageSettings) => void;
    nodeName: string;
    nodeDescription: string;
    initialPrompt: string;
    onEnhancePrompt: (prompt: string, style?: string, composition?: string, mood?: string) => Promise<string>;
    isEnhancing: boolean;
}

export interface ImageSettings {
    initialPrompt: string;
    enhancedPrompt: string;
    model: string;
    aspectRatio: '1:1' | '16:9' | '9:16';
    style: string;
    composition?: string;
    mood?: string;
    width: number;
    height: number;
}

const ASPECT_RATIOS = [
    { label: 'SQ', fullLabel: 'Square', value: '1:1', icon: SquareIcon, width: 1024, height: 1024 },
    { label: 'LS', fullLabel: 'Landscape', value: '16:9', icon: Monitor, width: 1024, height: 576 },
    { label: 'PT', fullLabel: 'Portrait', value: '9:16', icon: Smartphone, width: 576, height: 1024 },
] as const;

const STYLE_PRESETS = [
    { id: 'cinematic', label: 'Cinematic', description: 'High-end movie lighting and atmosphere' },
    { id: '3d-render', label: '3D Render', description: 'Hyper-realistic CGI with Octane/Unreal Engine' },
    { id: 'anime', label: 'Anime', description: 'Hand-painted Studio Ghibli aesthetic' },
    { id: 'minimalist', label: 'Minimalist', description: 'Clean, modern, and elegant design' },
    { id: 'cyberpunk', label: 'Cyberpunk', description: 'Neon lights, rainy streets, and high-tech' },
    { id: 'watercolor', label: 'Watercolor', description: 'Organic paper textures and soft washes' },
    { id: 'pencil', label: 'Pencil Sketch', description: 'Detailed graphite hand-drawn sketch' },
    { id: 'polaroid', label: 'Polaroid', description: 'Vintage film grain and nostalgic colors' },
    { id: 'pop-art', label: 'Pop Art', description: 'Bold halftone and vibrant comic style' },
    { id: 'oil-painting', label: 'Oil Painting', description: 'Classic canvas textures and brushstrokes' },
    { id: 'pixel-art', label: 'Pixel Art', description: 'Retro 16-bit gaming aesthetic' },
] as const;

const COMPOSITIONS = [
    { id: 'none', label: 'Default' },
    { id: 'close-up', label: 'Close-up' },
    { id: 'wide-shot', label: 'Wide Shot' },
    { id: 'bird-eye', label: 'Bird\'s Eye View' },
    { id: 'macro', label: 'Macro' },
    { id: 'low-angle', label: 'Low Angle' },
] as const;

const MOODS = [
    { id: 'none', label: 'Default', icon: Zap },
    { id: 'golden-hour', label: 'Golden Hour', icon: Sun },
    { id: 'rainy', label: 'Rainy', icon: CloudRain },
    { id: 'foggy', label: 'Foggy', icon: Wind },
    { id: 'neon', label: 'Neon Glow', icon: Zap },
    { id: 'mystical', label: 'Mystical', icon: Flame },
    { id: 'nocturnal', label: 'Nocturnal', icon: Moon },
] as const;

export function ImageGenerationDialog({
    isOpen,
    onClose,
    onGenerate,
    nodeName,
    nodeDescription,
    initialPrompt,
    onEnhancePrompt,
    isEnhancing
}: ImageGenerationDialogProps) {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [model, setModel] = useState('klein');
    const [aspectRatio, setAspectRatio] = useState<typeof ASPECT_RATIOS[number]>(ASPECT_RATIOS[0]);
    const [selectedStyle, setSelectedStyle] = useState<string>('cinematic');
    const [composition, setComposition] = useState<string>('none');
    const [mood, setMood] = useState<string>('none');

    // Sync prompt with initialPrompt when it changes
    React.useEffect(() => {
        if (isOpen) {
            setPrompt(initialPrompt);
            setSelectedStyle('cinematic');
            setAspectRatio(ASPECT_RATIOS[0]);
            setModel('klein');
            setComposition('none');
            setMood('none');
        }
    }, [initialPrompt, isOpen]);

    const handleEnhance = async () => {
        const enhanced = await onEnhancePrompt(prompt, selectedStyle, composition, mood);
        if (enhanced) setPrompt(enhanced);
    };

    const handleGenerate = () => {
        onGenerate({
            initialPrompt,
            enhancedPrompt: prompt,
            model,
            aspectRatio: aspectRatio.value,
            style: selectedStyle,
            composition,
            mood,
            width: aspectRatio.width,
            height: aspectRatio.height
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden rounded-[2.5rem] max-h-[92vh] flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="bg-gradient-to-br from-violet-500/10 via-transparent to-emerald-500/10 p-8">
                        <DialogHeader className="mb-6">
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                                            Visual Insight Lab
                                        </DialogTitle>
                                        <DialogDescription className="text-zinc-500 text-sm mt-1">
                                            Generating for <span className="text-violet-400 font-semibold italic">"{nodeName}"</span>
                                        </DialogDescription>
                                    </div>
                                </div>
                                <div className="hidden sm:flex flex-col items-end gap-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">AI Model</Label>
                                    <ModelSelector
                                        value={model}
                                        onChange={setModel}
                                        className="h-10 bg-zinc-900/50 border-zinc-800 rounded-xl"
                                    />
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                            <div className="space-y-8">
                                {/* Prompt Input Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" />
                                            Prompt Engineering
                                        </Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "h-9 px-4 text-[10px] font-bold uppercase tracking-widest transition-all gap-2 rounded-full border shadow-sm",
                                                selectedStyle
                                                    ? "bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20"
                                                    : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700"
                                            )}
                                            onClick={handleEnhance}
                                            disabled={isEnhancing}
                                        >
                                            {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                                            {selectedStyle ? `Enhance (${selectedStyle})` : 'Enhance with AI'}
                                        </Button>
                                    </div>
                                    <div className="relative group">
                                        <Textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder="Describe your vision..."
                                            className="min-h-[140px] bg-zinc-900/40 border-zinc-800 focus:border-violet-500/50 focus:ring-violet-500/20 rounded-[2rem] resize-none text-zinc-200 placeholder:text-zinc-700 transition-all text-base leading-relaxed p-6"
                                        />
                                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Badge variant="outline" className="text-[10px] bg-zinc-950/80 border-zinc-800 text-zinc-500 font-mono py-1 px-3 rounded-full">
                                                {prompt.length} chars
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Creative Controls Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Style Switcher */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 flex items-center gap-2">
                                            <Palette className="w-3.5 h-3.5" />
                                            Artistic DNA
                                        </Label>
                                        <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                                            <SelectTrigger className="h-12 bg-zinc-900/30 border-zinc-800 rounded-2xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-zinc-800 z-[250]">
                                                {STYLE_PRESETS.map((s) => (
                                                    <SelectItem key={s.id} value={s.id} className="focus:bg-zinc-900">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-bold text-xs">{s.label}</span>
                                                            <span className="text-[10px] text-zinc-500 truncate">{s.description}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Composition Selector */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 flex items-center gap-2">
                                            <Camera className="w-3.5 h-3.5" />
                                            Composition
                                        </Label>
                                        <Select value={composition} onValueChange={setComposition}>
                                            <SelectTrigger className="h-12 bg-zinc-900/30 border-zinc-800 rounded-2xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-zinc-800 z-[250]">
                                                {COMPOSITIONS.map((c) => (
                                                    <SelectItem key={c.id} value={c.id} className="focus:bg-zinc-900 text-xs">
                                                        {c.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Mood Toggles */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Atmosphere & Mood</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {MOODS.map((m) => (
                                            <button
                                                key={m.id}
                                                onClick={() => setMood(m.id)}
                                                className={cn(
                                                    "px-4 py-2.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-2",
                                                    mood === m.id
                                                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                                                        : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                                                )}
                                            >
                                                <m.icon className="w-3.5 h-3.5" />
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Sidebar: Aspect Ratio & Final Actions */}
                            <div className="space-y-8 lg:border-l lg:border-zinc-800/50 lg:pl-8">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Canvas Ratio</Label>
                                    <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
                                        {ASPECT_RATIOS.map((ratio) => (
                                            <button
                                                key={ratio.value}
                                                onClick={() => setAspectRatio(ratio)}
                                                className={cn(
                                                    "flex items-center lg:justify-start justify-center gap-3 p-3 rounded-2xl border transition-all group",
                                                    aspectRatio.value === ratio.value
                                                        ? "bg-violet-500/10 border-violet-500/40 text-violet-400"
                                                        : "bg-zinc-900/30 border-zinc-800/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
                                                )}
                                            >
                                                <ratio.icon className={cn(
                                                    "w-5 h-5",
                                                    aspectRatio.value === ratio.value ? "text-violet-400" : "text-zinc-600 group-hover:text-zinc-400"
                                                )} />
                                                <div className="hidden lg:block text-left">
                                                    <div className="font-bold text-xs">{ratio.fullLabel}</div>
                                                    <div className="text-[10px] opacity-40">{ratio.value}</div>
                                                </div>
                                                <div className="lg:hidden text-[10px] font-black">{ratio.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:pt-8 lg:border-t lg:border-zinc-900 flex flex-col gap-3">
                                    <div className="flex flex-col gap-1 mb-2 lg:hidden">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Model</Label>
                                        <ModelSelector
                                            value={model}
                                            onChange={setModel}
                                            className="h-10 bg-zinc-900/50 border-zinc-800 rounded-xl"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleGenerate}
                                        className="w-full h-14 bg-violet-600 hover:bg-violet-500 text-white font-black uppercase tracking-widest rounded-3xl shadow-[0_10px_40px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                                    >
                                        Launch Render
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={onClose}
                                        className="w-full h-12 rounded-2xl bg-transparent border border-red-500/20 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/40 font-bold uppercase tracking-widest text-[10px] transition-all duration-300"
                                    >
                                        Abort Mission
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
