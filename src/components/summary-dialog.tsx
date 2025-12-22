
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { FileText, X } from 'lucide-react';

interface SummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  summary: string;
}

export function SummaryDialog({
  isOpen,
  onClose,
  title,
  summary,
}: SummaryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-2xl glassmorphism p-8 shadow-2xl shadow-purple-900/20" showCloseButton={false}>
        <DialogClose asChild>
          <Button variant="ghost" size="icon" className="rounded-full absolute top-4 right-4">
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>

        <DialogHeader className="text-center items-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mb-4">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Summary for: {title}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 min-h-[100px] flex items-center justify-center">
          <p className="text-lg text-center leading-relaxed text-zinc-300">{summary}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
