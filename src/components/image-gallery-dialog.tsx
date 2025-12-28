
'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Download, Expand, X, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { GeneratedImage } from '@/types/mind-map';
import { cn } from '@/lib/utils';

interface ImageGalleryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  images: GeneratedImage[];
  onDownload: (url: string, name: string) => void;
  onRegenerate: (subCategory: { name: string; description: string }) => void;
  onDelete: (id: string) => void;
}

export function ImageGalleryDialog({
  isOpen,
  onClose,
  images,
  onDownload,
  onRegenerate,
  onDelete,
}: ImageGalleryDialogProps) {
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);

  const handleDownloadClick = (
    e: React.MouseEvent,
    image: GeneratedImage
  ) => {
    e.stopPropagation();
    if (image.status === 'completed') {
      onDownload(image.url, image.name);
    }
  };

  const handleRegenerateClick = (
    e: React.MouseEvent,
    image: GeneratedImage
  ) => {
    e.stopPropagation();
    onRegenerate({ name: image.name, description: image.description });
  };

  const handleDeleteClick = (
    e: React.MouseEvent,
    image: GeneratedImage
  ) => {
    e.stopPropagation();
    onDelete(image.id);
  };

  const GalleryItem = ({ image }: { image: GeneratedImage }) => {
    return (
      <Card
        className={cn(
          "group relative overflow-hidden aspect-square",
          image.status === 'completed' && "cursor-pointer"
        )}
        onClick={() => image.status === 'completed' && setPreviewImage(image)}
      >
        <Image
          src={image.url}
          alt={image.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cn(
            "object-cover transition-transform duration-300",
            image.status === 'completed' && "group-hover:scale-105",
            image.status !== 'completed' && "blur-sm opacity-60"
          )}
        />
        {image.status === 'generating' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        {image.status === 'failed' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
        <div className="absolute bottom-0 left-0 p-3">
          <p className="text-white text-sm font-semibold truncate">
            {image.name}
          </p>
        </div>
        {(image.status === 'completed' || image.status === 'failed') && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 hover:bg-purple-500 hover:text-white transition-colors"
              onClick={(e) => handleRegenerateClick(e, image)}
              title="Regenerate"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {image.status === 'completed' && (
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 hover:bg-emerald-500 hover:text-white transition-colors"
                onClick={(e) => handleDownloadClick(e, image)}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 hover:bg-red-500 hover:text-white transition-colors"
              onClick={(e) => handleDeleteClick(e, image)}
              title="Delete"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    );
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="sm:max-w-4xl h-[80vh] flex flex-col glassmorphism"
          showCloseButton={false}
        >
          <DialogHeader className="flex-row justify-between items-center">
            <div className="space-y-1">
              <DialogTitle>Image Gallery</DialogTitle>
              <DialogDescription>
                Images generated for the current mind map.
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>
          <ScrollArea className="flex-grow">
            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                {images.map((image) => (
                  <GalleryItem key={image.id} image={image} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No images generated yet.
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className="max-w-5xl w-[90vw] h-[90vh] p-0 border-0 glassmorphism">
          {previewImage && (
            <>
              <DialogTitle className="sr-only">{`Image Preview: ${previewImage.name}`}</DialogTitle>
              <DialogDescription className="sr-only">
                A larger view of the generated image for {previewImage.name}.
              </DialogDescription>
              <Image
                src={previewImage.url}
                alt={previewImage.name}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
