
import { Search, Gauge, BoxSelect, Cpu } from 'lucide-react';

interface QueryIntelProps {
    topic: string;
    depth?: string;
    persona?: string;
    modelType?: 'creative' | 'reasoning' | 'fast';
}

export function QueryIntel({ topic, depth = 'medium', persona = 'standard', modelType = 'creative' }: QueryIntelProps) {
    // Determine tech capability label
    let capabilityLabel = 'Standard Engine';
    let capabilityColor = 'text-blue-400';
    let capabilityIcon = <BoxSelect className="w-3 h-3" />;

    if (depth === 'deep' || depth === 'detailed') {
        capabilityLabel = 'Deep Reasoner (Qwen-Coder)';
        capabilityColor = 'text-purple-400';
        capabilityIcon = <Cpu className="w-3 h-3" />;
    } else if (modelType === 'fast') {
        capabilityLabel = 'Flash Synthesis';
        capabilityColor = 'text-amber-400';
        capabilityIcon = <Gauge className="w-3 h-3" />;
    }

    return (
        <div className="absolute top-24 left-4 z-20 flex flex-col gap-2 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Main Query Pill */}
            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full pl-4 pr-6 py-2 shadow-2xl group hover:border-white/20 transition-all">
                <div className="p-1.5 bg-white/5 rounded-full group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                    <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-purple-400" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-orbitron leading-none mb-0.5">
                        Mission Objective
                    </span>
                    <span className="text-sm font-bold text-zinc-100 tracking-tight capitalize truncate max-w-[200px] sm:max-w-[400px]">
                        {topic}
                    </span>
                </div>
            </div>

            {/* Tech Specs Pill */}
            <div className="self-start flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/5 rounded-full px-3 py-1.5 ml-2 hover:bg-black/60 transition-colors">
                <div className={`p-0.5 ${capabilityColor}`}>
                    {capabilityIcon}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider font-orbitron ${capabilityColor}`}>
                    {capabilityLabel} • {depth} • {persona}
                </span>
            </div>
        </div>
    );
}
