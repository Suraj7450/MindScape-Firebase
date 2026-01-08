
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
import { MindMapData } from '@/types/mind-map';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { FileText, Copy as CopyIcon, CheckCircle2, Download, Loader2, X, FileMinus } from 'lucide-react';


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
  isGlobalBusy?: boolean;
}

/**
 * A dialog component that displays the raw AI-generated content of a mind map
 * in a structured, readable format. It also provides an option to download the content as a PDF.
 * @param {AiContentDialogProps} props - The props for the component.
 * @returns {JSX.Element | null} The dialog component or null if no mind map data is provided.
 */
export function AiContentDialog({
  isOpen,
  onClose,
  mindMap,
  isGlobalBusy = false,
}: AiContentDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopyingMarkdown, setIsCopyingMarkdown] = useState(false);

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsDownloading(true);

    try {
      const dataUrl = await toPng(contentRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#09090b', // zinc-950
        style: {
          padding: '40px',
          borderRadius: '0px',
        }
      });

      const pdf = new jsPDF('p', 'px', [contentRef.current.scrollWidth, contentRef.current.scrollHeight]);
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.setProperties({
        title: `MindScape - ${mindMap.topic}`,
        subject: 'AI Generated Mind Map Knowledge Package',
        author: 'MindScape AI',
        keywords: 'mindmap, education, ai, learning',
        creator: 'MindScape'
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${mindMap.topic.replace(/ /g, '_')}_Study_Pack.pdf`);

      toast({
        title: 'Export Successful',
        description: 'Your knowledge package has been saved as a high-quality PDF.',
      });
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'An error occurred while generating the PDF.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToMarkdown = () => {
    setIsCopyingMarkdown(true);
    let md = `# ${mindMap.topic}\n\n`;

    if (mindMap.mode === 'compare') {
      const { compareData } = mindMap;
      md += `> ${compareData.root.description || 'Comparison Analysis'}\n\n`;

      md += `## Core Commonalities\n\n`;
      compareData.similarities.forEach(node => {
        md += `### ${node.title}\n${node.description || ''}\n\n`;
      });

      md += `## Topic Differences\n\n`;
      md += `### Unique to ${compareData.root.title.split(' vs ')[0]}\n`;
      compareData.differences.topicA.forEach(node => {
        md += `- **${node.title}**: ${node.description || ''}\n`;
      });

      md += `\n### Unique to ${compareData.root.title.split(' vs ')[1]}\n`;
      compareData.differences.topicB.forEach(node => {
        md += `- **${node.title}**: ${node.description || ''}\n`;
      });

      md += `\n## Structured Deep Dives\n\n`;
      md += `### Exploration of ${compareData.root.title.split(' vs ')[0]}\n`;
      compareData.topicADeepDive.forEach(node => {
        md += `#### ${node.title}\n${node.description || ''}\n`;
      });

      md += `\n### Exploration of ${compareData.root.title.split(' vs ')[1]}\n`;
      compareData.topicBDeepDive.forEach(node => {
        md += `#### ${node.title}\n${node.description || ''}\n`;
      });
    } else {
      mindMap.subTopics.forEach(st => {
        md += `## ${st.name}\n\n`;
        st.categories.forEach(cat => {
          md += `### ${cat.name}\n\n`;
          cat.subCategories.forEach(sc => {
            md += `- **${sc.name}**: ${sc.description}\n`;
          });
          md += `\n`;
        });
      });
    }

    navigator.clipboard.writeText(md);
    toast({
      title: 'Copied to Clipboard',
      description: 'Knowledge package copied as Markdown.',
    });
    setTimeout(() => setIsCopyingMarkdown(false), 2000);
  };

  if (!mindMap) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl h-[90vh] flex flex-col glassmorphism" showCloseButton={false}>
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <DialogTitle className="text-2xl">Knowledge Package</DialogTitle>
            <DialogDescription>
              High-fidelity {mindMap.mode === 'compare' ? 'comparison analysis' : 'knowledge structure'} for "{mindMap.topic}".
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={copyToMarkdown} disabled={isCopyingMarkdown || isGlobalBusy} variant="outline" size="sm" className="hidden md:flex gap-2 rounded-xl">
              {isCopyingMarkdown ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <CopyIcon className="h-4 w-4" />}
              {isCopyingMarkdown ? 'Copied' : 'Copy MD'}
            </Button>
            <Button onClick={handleDownloadPDF} disabled={isDownloading || isGlobalBusy} variant="outline" size="sm" className="hidden md:flex gap-2 rounded-xl">
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {isDownloading ? 'Processing...' : 'Export PDF'}
            </Button>
            <Button onClick={handleDownloadPDF} disabled={isDownloading || isGlobalBusy} variant="outline" size="icon" className="md:hidden">
              <Download className="h-4 w-4" />
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <ScrollArea className="flex-grow -mx-6 px-6 bg-zinc-950/20">
          <div ref={contentRef} className="space-y-6 py-8">
            <div className="mb-10 text-center">
              <h1 className="text-4xl font-black mb-2 text-white">{mindMap.topic}</h1>
              <p className="text-zinc-500 font-medium">
                {mindMap.mode === 'compare' ? 'Side-by-Side Comparison' : 'Comprehensive Knowledge Pack'} • Generated by MindScape AI
              </p>
            </div>

            {mindMap.mode === 'compare' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Similarities */}
                <div className="md:col-span-2">
                  <h2 className="text-2xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6" /> Core Commonalities
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {mindMap.compareData.similarities.map((node, i) => (
                      <Card key={i} className="bg-zinc-900/50 border-white/5">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{node.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-zinc-400">
                          {node.description}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Differences */}
                <Card className="bg-zinc-900/50 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary font-bold uppercase tracking-tight">
                      {mindMap.compareData.root.title.split(' vs ')[0] || 'Topic A'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mindMap.compareData.differences.topicA.map((node, i) => (
                      <div key={i} className="border-l-2 border-primary/20 pl-4 py-1">
                        <h4 className="font-bold text-zinc-100">{node.title}</h4>
                        <p className="text-sm text-zinc-500">{node.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary font-bold uppercase tracking-tight">
                      {mindMap.compareData.root.title.split(' vs ')[1] || 'Topic B'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mindMap.compareData.differences.topicB.map((node, i) => (
                      <div key={i} className="border-l-2 border-primary/20 pl-4 py-1">
                        <h4 className="font-bold text-zinc-100">{node.title}</h4>
                        <p className="text-sm text-zinc-500">{node.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : (
              mindMap.subTopics.map((subTopic, subIndex) => (
                <Card key={`sub-${subIndex}`} className="bg-zinc-900/50 border-white/5 shadow-2xl overflow-hidden rounded-[2rem] break-inside-avoid">
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
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
