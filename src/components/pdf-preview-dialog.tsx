
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

/**
 * Props for the PdfPreviewDialog component.
 * @interface PdfPreviewDialogProps
 * @property {boolean} isOpen - Whether the dialog is open.
 * @property {() => void} onClose - Function to call when the dialog should be closed.
 * @property {string} pdfDataUri - The data URI of the PDF file to display.
 */
interface PdfPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pdfDataUri: string;
}

/**
 * A dialog component for previewing a PDF file.
 * It includes controls for pagination and zooming.
 * @param {PdfPreviewDialogProps} props - The props for the component.
 * @returns {JSX.Element} The PDF preview dialog component.
 */
export function PdfPreviewDialog({ isOpen, onClose, pdfDataUri }: PdfPreviewDialogProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  /**
   * Callback function for when the PDF document is successfully loaded.
   * @param {{ numPages: number }} { numPages } - An object containing the total number of pages.
   */
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }
  
  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col glassmorphism">
        <DialogHeader>
          <DialogTitle>PDF Preview</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
          <ScrollArea className="h-full w-full">
            <Document
              file={pdfDataUri}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}
              error={<div className="text-destructive text-center p-4">Failed to load PDF file.</div>}
            >
              <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} />
            </Document>
          </ScrollArea>
        </div>
        <DialogFooter className="flex-shrink-0 justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={zoomOut} disabled={scale <= 0.5}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">{(scale * 100).toFixed(0)}%</span>
            <Button variant="outline" size="icon" onClick={zoomIn} disabled={scale >= 2.0}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          {numPages && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                Page {pageNumber} of {numPages}
              </span>
              <Button variant="outline" size="icon" onClick={goToNextPage} disabled={pageNumber >= numPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
