import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Crown, Palette, Monitor, Cloud } from 'lucide-react';

export const POLLINATIONS_MODELS = [
    {
        value: 'klein-large',
        label: 'FLUX.2 Klein 9B',
        cost: 0.0118,
        badge: 'Ultra',
        icon: Crown,
        description: 'Ultra Cinematic Quality - Highest detail and fidelity',
        isNew: true
    },
    {
        value: 'klein',
        label: 'FLUX.2 Klein 4B',
        cost: 0.0067,
        badge: 'Premium',
        icon: Sparkles,
        description: 'Premium Professional - Sharp details and realistic lighting',
        isNew: true
    },
    {
        value: 'kontext',
        label: 'FLUX.1 Kontext',
        cost: 0.04,
        badge: 'Contextual',
        icon: Palette,
        description: 'High Contextual Awareness - Best for complex scene descriptions',
        isNew: false
    },
    {
        value: 'seedream',
        label: 'Seedream 4.0',
        cost: 0.0286,
        badge: 'Creative',
        icon: Cloud,
        description: 'Artistic & Creative Flair - Vivid, imaginative dream-like styles',
        isNew: true
    },
    {
        value: 'gptimage',
        label: 'GPT Image 1 Mini',
        cost: 0.0133,
        badge: 'Balanced',
        icon: Monitor,
        description: 'Balanced & Logical - Consistent and reliable composition',
        isNew: true
    },
    {
        value: 'flux',
        label: 'Flux Schnell',
        cost: 0.0002,
        badge: 'Fast',
        icon: Zap,
        description: 'High Quality & Rapid Speed - Instant generation for quick iterations',
        isNew: false
    },
    {
        value: 'zimage',
        label: 'Z-Image Turbo',
        cost: 0.0002,
        badge: 'Fast',
        icon: Zap,
        description: 'Maximum Performance - Optimized for raw processing speed',
        isNew: false
    },
    {
        value: 'nanobanana',
        label: 'NanoBanana',
        cost: 0.04,
        badge: 'Niche',
        icon: Zap,
        description: 'Niche Specialist - Specialized creative generation',
        isNew: true
    }
] as const;

export type ModelValue = typeof POLLINATIONS_MODELS[number]['value'];

interface ModelSelectorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    showCost?: boolean;
    freeOnly?: boolean;
}

export function ModelSelector({
    value,
    onChange,
    className,
    showCost = true,
    freeOnly = false
}: ModelSelectorProps) {
    const models = freeOnly ? POLLINATIONS_MODELS.filter(m => m.cost < 0.005) : POLLINATIONS_MODELS;
    const selectedModel = models.find(m => m.value === value) || models[0];

    return (
        <Select value={selectedModel.value} onValueChange={onChange}>
            <SelectTrigger className={className}>
                <SelectValue>
                    <div className="flex items-center gap-2">
                        {selectedModel && (
                            <>
                                <selectedModel.icon className="w-4 h-4" />
                                <span>{selectedModel.label}</span>
                                {selectedModel.isNew && (
                                    <Badge variant="secondary" className="text-xs">NEW</Badge>
                                )}
                            </>
                        )}
                    </div>
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="min-w-[450px] z-[250]">
                {models.map(model => {
                    const Icon = model.icon;
                    return (
                        <SelectItem
                            key={model.value}
                            value={model.value}
                            className="focus:bg-zinc-800/80 focus:text-white transition-all duration-200 border-l-2 border-l-transparent focus:border-l-violet-500 rounded-none cursor-pointer"
                        >
                            <div className="grid grid-cols-[24px_180px_100px_80px] items-center gap-4 py-2 px-1 w-full">
                                <Icon className="w-4 h-4 text-zinc-400 shrink-0 group-hover:text-violet-400 transition-colors" />

                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-zinc-200 text-[13px] whitespace-nowrap">{model.label}</span>
                                        {model.isNew && (
                                            <Badge variant="secondary" className="text-[9px] h-3.5 px-1 bg-violet-500/10 text-violet-400 border-violet-500/20 leading-none font-bold uppercase tracking-widest">
                                                NEW
                                            </Badge>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-zinc-500 truncate mt-0.5 opacity-80 leading-tight">
                                        {model.description}
                                    </span>
                                </div>

                                <div className="flex justify-center">
                                    <Badge
                                        variant="outline"
                                        className="text-[9px] px-2 h-4.5 font-bold bg-zinc-950/50 border-zinc-700/50 text-zinc-500 uppercase tracking-widest w-[85px] justify-center"
                                    >
                                        {model.badge}
                                    </Badge>
                                </div>

                                <div className="flex justify-end pr-1">
                                    {showCost && (
                                        <span className="text-[11px] font-mono text-zinc-400 font-medium whitespace-nowrap">
                                            {model.cost < 0.01 ? model.cost.toFixed(4) : model.cost.toFixed(2)}/img
                                        </span>
                                    )}
                                </div>
                            </div>
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
}

/**
 * Compact model selector for inline use
 */
export function CompactModelSelector({ value, onChange, className, freeOnly = false }: ModelSelectorProps) {
    const models = freeOnly ? POLLINATIONS_MODELS.filter(m => m.cost < 0.005) : POLLINATIONS_MODELS;
    const selectedModel = models.find(m => m.value === value) || models[0];

    return (
        <Select value={selectedModel.value} onValueChange={onChange}>
            <SelectTrigger className={className}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[250]">
                {models.map(model => (
                    <SelectItem
                        key={model.value}
                        value={model.value}
                        className="focus:bg-zinc-800 focus:text-white"
                    >
                        <div className="grid grid-cols-[16px_1fr_60px] items-center w-full gap-2 py-1">
                            <model.icon className="w-3 h-3 text-zinc-400 group-hover:text-violet-400" />
                            <span className="text-xs truncate">{model.label}</span>
                            <div className="flex justify-end pr-1">
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-zinc-900 border-zinc-800 text-zinc-500 font-bold opacity-80">
                                    {model.cost < 0.01 ? model.cost.toFixed(4) : model.cost}
                                </Badge>
                            </div>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
