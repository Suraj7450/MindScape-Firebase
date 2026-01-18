
'use client';

import React from 'react';
import { Clock, Eye, User } from 'lucide-react';
import { MindMapWithId } from '@/types/mind-map';
import { formatShortDistanceToNow } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DepthBadge } from '@/components/mind-map/depth-badge';

interface CommunityCardProps {
    map: MindMapWithId;
    onClick: (id: string) => void;
}

export const CommunityCard = ({ map, onClick }: CommunityCardProps) => {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const updatedAt = typeof map.updatedAt === 'number'
        ? new Date(map.updatedAt)
        : (map.updatedAt as any)?.toDate?.() || new Date();

    return (
        <Card
            onClick={() => onClick(map.id!)}
            className="group relative cursor-pointer rounded-2xl bg-white/5 backdrop-blur-xl p-4 flex flex-col h-full overflow-hidden border border-white/10 transition-all duration-500 hover:border-purple-600/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1"
        >
            <div className="w-full aspect-video relative mb-4 overflow-hidden rounded-xl bg-[#0A0A0A] group/image">
                <img
                    src={map.thumbnailUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(`A detailed 3D visualization representing ${map.topic}, cinematic lighting, purple tones, high resolution`)}?width=400&height=225&nologo=true`}
                    alt={`Thumbnail for ${map.topic}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
                <div className="absolute top-2 left-2 z-10">
                    <DepthBadge depth={map.depth} className="backdrop-blur-md bg-black/40 border-white/10" />
                </div>
                {/* Glassmorphism overlay with button on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/image:opacity-100 group-hover/image:bg-black/40 transition-all duration-300">
                    <div className="rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 text-white text-[10px] h-9 px-6 font-black uppercase tracking-widest shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open Full Map
                    </div>
                </div>
            </div>

            <h3 className="font-bold text-lg text-white mb-2 line-clamp-1 group-hover:text-purple-400 transition-colors font-orbitron tracking-tight pt-2">{map.shortTitle || map.topic}</h3>

            <div className="flex flex-wrap gap-2 mb-4 min-h-[40px] items-center">
                {map.publicCategories?.map(cat => (
                    <span
                        key={cat}
                        className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[9px] text-purple-300 font-semibold uppercase tracking-widest font-orbitron shadow-[0_0_10px_rgba(168,85,247,0.05)]"
                    >
                        {cat}
                    </span>
                ))}
            </div>

            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-white/10">
                        <AvatarImage src={map.authorAvatar} />
                        <AvatarFallback className="bg-purple-900/50 text-[10px]"><User className="h-3 w-3" /></AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-gray-300 truncate max-w-[80px]">
                        {map.authorName || 'Explorer'}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <Eye className="h-3.5 w-3.5" />
                        {map.views || 0}
                    </div>
                </div>
            </div>
        </Card>
    );
};
