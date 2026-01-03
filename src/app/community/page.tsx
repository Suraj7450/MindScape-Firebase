
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Rocket, Filter, SortAsc, Users, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { MindMapWithId } from '@/types/mind-map';
import { CommunityCard } from '@/components/community/community-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type SortOption = 'recent' | 'views';

export default function CommunityPage() {
    const router = useRouter();
    const firestore = useFirestore();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [sortOption, setSortOption] = useState<SortOption>('recent');

    const publicMapsQuery = useMemoFirebase(() => {
        let q = collection(firestore, 'publicMindmaps');

        // Sorting
        if (sortOption === 'recent') {
            return query(q, orderBy('updatedAt', 'desc'), limit(50));
        } else {
            return query(q, orderBy('views', 'desc'), limit(50));
        }
    }, [firestore, sortOption]);

    const { data: publicMaps, isLoading } = useCollection<MindMapWithId>(publicMapsQuery);

    // Categories extraction
    const categories = useMemo(() => {
        const cats = new Set<string>(['All']);
        publicMaps?.forEach(map => {
            map.publicCategories?.forEach(cat => cats.add(cat));
        });
        return Array.from(cats);
    }, [publicMaps]);

    const filteredMaps = useMemo(() => {
        let maps = publicMaps || [];

        if (selectedCategory !== 'All') {
            maps = maps.filter(map => map.publicCategories?.includes(selectedCategory));
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            maps = maps.filter(map =>
                map.topic.toLowerCase().includes(lowerQuery) ||
                map.summary?.toLowerCase().includes(lowerQuery)
            );
        }

        return maps;
    }, [publicMaps, selectedCategory, searchQuery]);

    const handleMapClick = (id: string) => {
        router.push(`/mindmap?mapId=${id}`);
    };

    return (
        <div className="min-h-screen text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden pt-24 pb-16">
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <Badge variant="outline" className="mb-4 border-purple-500/30 bg-purple-500/10 text-purple-400 gap-1.5 py-1 px-3">
                        <Users className="h-3 w-3" />
                        Community Hub
                    </Badge>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">
                        Explore Public MindMaps
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Discover and learn from the collective knowledge of the MindScape community.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search public mindmaps..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 bg-white/5 border-white/10 rounded-xl focus:ring-purple-600/50"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                            <SelectTrigger className="w-[140px] h-11 bg-white/5 border-white/10 rounded-xl">
                                <SelectValue placeholder="Sort" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl">
                                <SelectItem value="recent">Latest</SelectItem>
                                <SelectItem value="views">Trending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                    <Filter className="h-4 w-4 text-gray-500 mr-2 shrink-0" />
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 border font-orbitron",
                                selectedCategory === cat
                                    ? "bg-purple-600/20 border-purple-500/50 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)] scale-105"
                                    : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:text-zinc-200 hover:border-white/10 hover:bg-zinc-800/50"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-48 w-full rounded-2xl bg-white/5" />
                                <Skeleton className="h-4 w-3/4 bg-white/5" />
                                <Skeleton className="h-4 w-1/2 bg-white/5" />
                            </div>
                        ))}
                    </div>
                ) : filteredMaps.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredMaps.map(map => (
                            <CommunityCard key={map.id} map={map} onClick={handleMapClick} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <Sparkles className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-300">No MindMaps Found</h3>
                        <p className="text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
                        <Button
                            variant="link"
                            className="mt-4 text-purple-400"
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory('All');
                            }}
                        >
                            Reset all filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
