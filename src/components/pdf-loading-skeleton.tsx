
'use client';

import { FileText, Loader2 } from 'lucide-react';
import { Card } from './ui/card';

/**
 * A loading skeleton component displayed while a PDF is being processed.
 * It shows a file icon with a spinner and a progress animation to provide feedback to the user.
 * @returns {JSX.Element} The PDF loading skeleton UI.
 */
export function PdfLoadingSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
      <Card className="w-full p-8 flex flex-col items-center justify-center gap-6 glassmorphism animate-pulse">
        <div className="relative">
          <FileText className="h-24 w-24 text-muted-foreground" />
          <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 text-primary animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">Analyzing Your Document</h2>
          <p className="text-muted-foreground mt-2">
            Extracting insights and building your mind map...
          </p>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <div className="bg-primary h-2.5 rounded-full w-full animate-loader-progress"></div>
        </div>
      </Card>
      <style jsx>{`
        @keyframes loader-progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-loader-progress {
          animation: loader-progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
