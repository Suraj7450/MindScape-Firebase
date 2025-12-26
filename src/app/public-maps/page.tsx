
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User as UserIcon, Trash2, Clock, BookOpen, Share2, Copy, ClipboardCheck, FileText, Eye } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { GenerateMindMapOutput } from '@/ai/flows/generate-mind-map';
import { useCollection, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, Timestamp, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { useFirestore } from '@/firebase';
import PublicDashboardLoading from './loading';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatShortDistanceToNow } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type PublicMindMap = GenerateMindMapOutput & {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  summary: string;
  thumbnailUrl?: string;
  authorName?: string;
  originalAuthorId?: string;
};

type SortOption = 'recent' | 'alphabetical' | 'oldest';
type MapFilter = 'all' | 'my-published' | 'others';

export default function PublicMapsPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [mapFilter, setMapFilter] = useState<MapFilter>('all');
  const [mapToUnpublish, setMapToUnpublish] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);



  const publicMapsQuery = useMemoFirebase(() => {
    return collection(firestore, 'publicMindmaps');
  }, [firestore]);

  const { data: publicMaps, isLoading: isMindMapsLoading } =
    useCollection<PublicMindMap>(publicMapsQuery);

  const { myPublishedMaps, communityMaps } = useMemo(() => {
    let maps = publicMaps || [];

    if (searchQuery) {
      maps = maps.filter((map) =>
        map.topic.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (sortOption) {
      case 'alphabetical':
        maps.sort((a, b) => a.topic.localeCompare(b.topic));
        break;
      case 'oldest':
        maps.sort(
          (a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0)
        );
        break;
      case 'recent':
      default:
        maps.sort(
          (a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0)
        );
        break;
    }

    const userMaps = user ? maps.filter(map => map.originalAuthorId === user.uid) : [];
    const otherMaps = user ? maps.filter(map => map.originalAuthorId !== user.uid) : maps;

    if (mapFilter === 'my-published') return { myPublishedMaps: userMaps, communityMaps: [] };
    if (mapFilter === 'others') return { myPublishedMaps: [], communityMaps: otherMaps };

    return { myPublishedMaps: userMaps, communityMaps: otherMaps };

  }, [publicMaps, searchQuery, sortOption, user, mapFilter]);

  const handleMindMapClick = (mapId: string) => {
    router.push(`/mindmap?mapId=${mapId}&public=true`);
  };

  const handleUnpublishMap = async () => {
    if (!mapToUnpublish || !user) return;
    const docRef = doc(firestore, 'publicMindmaps', mapToUnpublish);

    // Additional check to ensure only the owner can delete
    const mapToDel = publicMaps?.find(m => m.id === mapToUnpublish);
    if (mapToDel?.originalAuthorId !== user.uid) {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'You can only unpublish your own maps.' });
      setMapToUnpublish(null);
      return;
    }

    deleteDoc(docRef).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'delete' });
      errorEmitter.emit('permission-error', permissionError);
    });
    setMapToUnpublish(null);
  };

  const handleDuplicateMap = async (map: PublicMindMap) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Login Required',
        description: 'Please log in to save this mind map.',
      });
      router.push('/login');
      return;
    }
    if (!firestore) return;

    try {
      const mindMapsCollection = collection(firestore, 'users', user.uid, 'mindmaps');
      const { id, createdAt, updatedAt, originalAuthorId, authorName, ...plainMindMapData } = map as any;

      const docRef = await addDoc(mindMapsCollection, {
        ...plainMindMapData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        thumbnailUrl: map.thumbnailUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(map.topic)}?width=400&height=225&nologo=true`,
        thumbnailPrompt: `A cinematic 3D render of ${map.topic}, in futuristic purple tones, mind-map theme, highly detailed`
      });

      toast({
        title: 'Map Saved!',
        description: `A copy of "${map.topic}" has been added to your "My Maps".`,
      });

    } catch (error) {
      console.error('Failed to duplicate mind map:', error);
      toast({
        variant: 'destructive',
        title: 'Duplication Failed',
        description: 'An error occurred while trying to duplicate this map.',
      });
    }
  };

  const handleShare = (mapId: string) => {
    const url = `${window.location.origin}/mindmap?mapId=${mapId}&public=true`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast({
      title: 'Link Copied!',
      description: 'A shareable link has been copied to your clipboard.',
    });
    setTimeout(() => setIsCopied(false), 2000);
  };


  const renderMapCard = (map: PublicMindMap, isMyMap: boolean = false) => {
    const updatedAt = map.updatedAt?.toDate();

    return (
      <div
        key={map.id}
        className="group relative cursor-pointer rounded-2xl bg-[#1C1C1E] p-4 flex flex-col h-full overflow-hidden border border-white/10 transition-all duration-300 hover:border-purple-600/50 hover:shadow-glow hover:-translate-y-1"
      >
        <div className="w-full aspect-video relative mb-4" onClick={() => handleMindMapClick(map.id)}>
          <Image
            src={
              map.thumbnailUrl ||
              `https://image.pollinations.ai/prompt/${encodeURIComponent(
                map.topic
              )}?width=400&height=225&nologo=true`
            }
            alt={`Thumbnail for ${map.topic}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover rounded-xl"
            data-ai-hint="abstract concept"
          />
        </div>

        <h3 className="font-bold text-lg text-white mb-2 truncate" onClick={() => handleMindMapClick(map.id)}>
          {map.topic}
        </h3>

        {!isMyMap && (
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarFallback className='text-xs bg-primary text-primary-foreground'>
                {map.authorName ? map.authorName.charAt(0) : <UserIcon size={14} />}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-400">{map.authorName || 'Anonymous'}</span>
          </div>
        )}

        <div className="flex-grow min-h-[20px]"></div>

        <div className="mt-auto flex justify-between items-center">
          {updatedAt && (
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {formatShortDistanceToNow(updatedAt)}
            </p>
          )}

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>

            {isMyMap ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setMapToUnpublish(map.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Unpublish</p></TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white"
                    onClick={() => handleDuplicateMap(map)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save to My Maps</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => handleShare(map.id)}>
                  {isCopied ? <ClipboardCheck className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Share</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  };

  if (isMindMapsLoading) {
    return <PublicDashboardLoading />;
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 sm:p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Public Mind Maps
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover mind maps published by the MindScape community.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search public maps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glassmorphism"
            />
          </div>
          <Select
            value={sortOption}
            onValueChange={(value) => setSortOption(value as SortOption)}
          >
            <SelectTrigger className="w-full sm:w-[180px] glassmorphism">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
          {user && (
            <Select
              value={mapFilter}
              onValueChange={(value) => setMapFilter(value as MapFilter)}
            >
              <SelectTrigger className="w-full sm:w-[220px] glassmorphism">
                <SelectValue placeholder="Filter Maps" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Maps</SelectItem>
                <SelectItem value="my-published">My Published Maps</SelectItem>
                <SelectItem value="others">Other Users' Maps</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {user && myPublishedMaps.length > 0 && (mapFilter === 'all' || mapFilter === 'my-published') && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Your Published Maps</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {myPublishedMaps.map((map) => renderMapCard(map, true))}
            </div>
          </section>
        )}

        {(mapFilter === 'all' || mapFilter === 'others') && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Explore Community Maps</h2>
            {communityMaps.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {communityMaps.map((map) => renderMapCard(map))}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed rounded-lg mt-12">
                <h3 className="mt-4 text-lg font-semibold">
                  No Community Mind Maps Yet
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Be the first to share a mind map with the community!
                </p>
              </div>
            )}
          </section>
        )}
      </div>

      <AlertDialog open={!!mapToUnpublish} onOpenChange={(open) => !open && setMapToUnpublish(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove this mind map from the public gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnpublishMap}>Unpublish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </TooltipProvider>
  );
}
