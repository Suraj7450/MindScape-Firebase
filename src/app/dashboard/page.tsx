
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogIn, Search, Share2, Trash2, Eye, Loader2, Clock, FileText } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GenerateMindMapOutput } from '@/ai/flows/generate-mind-map';
import { Icons } from '@/components/icons';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, deleteDoc, addDoc, serverTimestamp, Timestamp, query, where, orderBy, limit } from 'firebase/firestore';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { formatShortDistanceToNow } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


import { Skeleton } from '@/components/ui/skeleton';

function DashboardLoadingSkeleton() {
  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="text-center mb-12">
        <Skeleton className="h-10 w-1/2 mx-auto mb-4" />
        <Skeleton className="h-5 w-3/4 mx-auto" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl glassmorphism" />
        ))}
      </div>
    </div>
  );
}

type SavedMindMap = GenerateMindMapOutput & {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  summary: string;
  thumbnailUrl?: string;
  thumbnailPrompt?: string;
  isSubMap?: boolean;
};
type SortOption = 'recent' | 'alphabetical' | 'oldest';

function NotLoggedIn() {
  const router = useRouter();
  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <LogIn className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Please Log In</h3>
        <p className="mt-2 text-sm text-muted-foreground">You need to be logged in to view your saved mind maps.</p>
        <Button className="mt-6" onClick={() => router.push('/login')}>Log In</Button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [mapToDelete, setMapToDelete] = useState<string | null>(null);
  const [mapToPublish, setMapToPublish] = useState<SavedMindMap | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [deletingMapIds, setDeletingMapIds] = useState<Set<string>>(new Set());



  const mindMapsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'mindmaps'),
      orderBy('updatedAt', 'desc'), // Default sort by recent
      limit(50)
    );
  }, [firestore, user]);

  const { data: savedMaps, isLoading: isMindMapsLoading } = useCollection<SavedMindMap>(mindMapsQuery);

  const filteredAndSortedMaps = useMemo(() => {
    // Filter out sub-maps: either explicitly marked OR has a parentMapId
    let maps = (savedMaps || []).filter(map => {
      // Exclude if explicitly marked as sub-map
      if (map.isSubMap === true) return false;
      // Exclude if it has a parentMapId (legacy sub-maps)
      if ((map as any).parentMapId) return false;
      return true;
    });

    if (searchQuery) {
      maps = maps.filter((map) => map.topic.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    switch (sortOption) {
      case 'alphabetical':
        maps.sort((a, b) => a.topic.localeCompare(b.topic));
        break;
      case 'oldest':
        maps.sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));
        break;
      case 'recent':
      default:
        maps.sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0));
        break;
    }

    // Strip heavy fields for dashboard metadata (Phase 1 Performance Improvement)
    return maps
      .filter(map => !deletingMapIds.has(map.id))
      .map(({ nodes, edges, subTopics, ...meta }: any) => meta);
  }, [savedMaps, searchQuery, sortOption, deletingMapIds]);

  const handleMindMapClick = (mapId: string) => {
    router.push(`/mindmap?mapId=${mapId}`);
  };

  const handleDeleteMap = async () => {
    if (!user || !mapToDelete) return;

    // Optimistic UI: tracking deleting maps locally
    const idToRemove = mapToDelete;
    setDeletingMapIds(prev => new Set(prev).add(idToRemove));
    setMapToDelete(null);

    const docRef = doc(firestore, 'users', user.uid, 'mindmaps', idToRemove);
    try {
      await deleteDoc(docRef);
      // Successful delete will eventually be reflected by useCollection snapshot
    } catch (serverError) {
      const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'delete' });
      errorEmitter.emit('permission-error', permissionError);
      // Revert optimistic UI on error
      setDeletingMapIds(prev => {
        const next = new Set(prev);
        next.delete(idToRemove);
        return next;
      });
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'You do not have permission to delete this map or a network error occurred.'
      });
    }
  };

  const handleConfirmPublish = async () => {
    if (!user || !mapToPublish) return;
    setIsPublishing(true);

    try {
      const publicMapsCollection = collection(firestore, 'publicMindmaps');
      // The summary is already available in mapToPublish
      const { id, createdAt, updatedAt, ...plainMindMapData } = mapToPublish;

      await addDoc(publicMapsCollection, {
        ...plainMindMapData,
        originalAuthorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Map Published!',
        description: `"${mapToPublish.topic}" is now available for the community to view.`,
      });
    } catch (error: any) {
      console.error('Failed to publish mind map:', error);
      toast({
        variant: 'destructive',
        title: 'Publishing Failed',
        description: error.message || 'An error occurred while trying to publish your map.',
      });
    } finally {
      setIsPublishing(false);
      setMapToPublish(null);
    }
  };

  if (isUserLoading) {
    return <DashboardLoadingSkeleton />;
  }

  if (!user) {
    return <NotLoggedIn />;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="container mx-auto p-4 sm:p-8">
        <div
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold tracking-tight mb-2">Your Saved Mind Maps</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Easily access, organize and continue your knowledge maps.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search maps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glassmorphism"
            />
          </div>
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-[180px] glassmorphism">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isMindMapsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl glassmorphism" />
            ))}
          </div>
        ) : filteredAndSortedMaps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredAndSortedMaps.map((map) => {
              const updatedAt = map.updatedAt?.toDate();

              return (
                <div
                  key={map.id}
                  className="group relative cursor-pointer rounded-2xl bg-[#1C1C1E] p-4 flex flex-col h-full overflow-hidden border border-white/10 transition-all duration-300 hover:border-purple-600/50 hover:shadow-glow hover:-translate-y-1"
                >
                  <div className="w-full aspect-video relative mb-4 overflow-hidden rounded-xl bg-[#0A0A0A]" onClick={() => handleMindMapClick(map.id)}>
                    <img
                      src={map.thumbnailUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(`A detailed 3D visualization representing ${map.topic}, cinematic lighting, purple tones, high resolution`)}?width=400&height=225&nologo=true`}
                      alt={`Thumbnail for ${map.topic}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback to placeholder on error
                        e.currentTarget.src = `https://placehold.co/400x225/1a1a1a/666666?text=${encodeURIComponent(map.topic)}`;
                      }}
                    />
                  </div>

                  <h3 className="font-bold text-lg text-white mb-2 truncate" onClick={() => handleMindMapClick(map.id)}>{map.topic}</h3>

                  <div className="flex-grow"></div>

                  <div className="mt-auto flex justify-between items-center">
                    {updatedAt && (
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {formatShortDistanceToNow(updatedAt)}
                      </p>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-white"
                            onClick={() => setMapToPublish(map)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Publish</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-destructive"
                            onClick={() => setMapToDelete(map.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg mt-12">
            <Icons.logo className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              {searchQuery ? 'No Mind Maps Found' : 'No Saved Mind Maps'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery ? 'Try a different search term.' : "You haven't saved any mind maps yet."}
            </p>
            <Button className="mt-6" onClick={() => router.push('/')}>
              Generate a Mind Map
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={!!mapToDelete} onOpenChange={(open) => !open && setMapToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this mind map.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMap}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!mapToPublish} onOpenChange={(open) => !open && setMapToPublish(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Mind Map</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to publish "{mapToPublish?.topic}"? It will be visible to everyone in the Public Maps gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPublish} disabled={isPublishing}>
              {isPublishing ? 'Publishing...' : 'Publish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </TooltipProvider>
  );
}
