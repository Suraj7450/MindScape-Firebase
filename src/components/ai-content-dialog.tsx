
'use client';

import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { MindMapSchema } from '@/ai/mind-map-schema';
import { z } from 'zod';
import { Button } from './ui/button';
import { Download, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

/**
 * Type alias for the inferred MindMap schema from Zod.
 * @typedef {z.infer<typeof MindMapSchema>} MindMapData
 */
type MindMapData = z.infer<typeof MindMapSchema>;

/**
 * Props for the AiContentDialog component.
 * @interface AiContentDialogProps
 * @property {boolean} isOpen - Whether the dialog is open.
 * @property {() => void} onClose - Function to call when the dialog should be closed.
 * @property {MindMapData} mindMap - The mind map data to display.
 */
interface AiContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mindMap: MindMapData;
}

/**
 * A dialog component that displays the raw AI-generated content of a mind map
 * in a structured, readable format. It also provides an option to download the content as a PNG.
 * @param {AiContentDialogProps} props - The props for the component.
 * @returns {JSX.Element | null} The dialog component or null if no mind map data is provided.
 */
export function AiContentDialog({
  isOpen,
  onClose,
  mindMap,
}: AiContentDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  /**
   * Handles the PNG download process. It uses html2canvas to capture the content
   * of the dialog and prompts the user to save it as an image.
   */
  const handleDownload = async () => {
    if (!contentRef.current) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#141414', // Dark background for the capture
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${mindMap.topic.replace(/ /g, '_')}_Content.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Failed to download PNG:", error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'An error occurred while generating the PNG.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!mindMap) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl h-[90vh] flex flex-col glassmorphism" showCloseButton={false}>
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <DialogTitle className="text-2xl">AI-Generated Content</DialogTitle>
              <DialogDescription>
                Raw structured data for the "{mindMap.topic}" mind map.
              </DialogDescription>
            </div>
             <div className="flex items-center gap-2">
              <Button onClick={handleDownload} disabled={isDownloading} variant="outline" size="icon">
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="sr-only">Download PNG</span>
              </Button>
              <DialogClose asChild>
                <Button variant="ghost" size="icon">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            </div>
        </DialogHeader>
        <ScrollArea className="flex-grow -mx-6 px-6">
          <div ref={contentRef} className="space-y-4 py-4">
            {mindMap.subTopics.map((subTopic, subIndex) => (
              <Card key={`sub-${subIndex}`} className="bg-secondary/30 break-inside-avoid">
                <CardHeader>
                  <CardTitle className="text-xl">{subTopic.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pl-10">
                  {subTopic.categories.map((category, catIndex) => (
                    <div key={`cat-${catIndex}`} className="break-inside-avoid">
                      <h4 className="font-semibold text-lg text-primary">
                        {category.name}
                      </h4>
                      <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
                        {category.subCategories.map(
                          (subCategory, subCatIndex) => (
                            <li key={`subcat-${subCatIndex}`}>
                              <strong className="text-foreground">
                                {subCategory.name}:
                              </strong>{' '}
                              {subCategory.description}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
