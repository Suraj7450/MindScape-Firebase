'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  X,
  Volume2,
  VolumeX,
  Download,
  Loader2,
  Music,
  List,
  AlignLeft,
  FastForward,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function VoiceWaveform({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-6 px-2">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className={cn(
            "w-[3px] bg-gradient-to-t from-purple-500 to-pink-500 rounded-full transition-all duration-300",
            isPlaying ? "animate-pulse" : "h-1 opacity-30"
          )}
          style={{
            height: isPlaying ? `${Math.random() * 80 + 20}%` : '4px',
            animationDelay: `${i * 0.1}s`,
            animationDuration: isPlaying ? `${0.5 + Math.random()}s` : '0s'
          }}
        />
      ))}
    </div>
  );
}

interface SummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  summary: string;
  isLoading?: boolean;
  onReload?: () => void;
}

export function SummaryDialog({
  isOpen,
  onClose,
  title,
  summary,
  isLoading = false,
  onReload
}: SummaryDialogProps) {
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [viewMode, setViewMode] = useState<'paragraph' | 'bullets'>('bullets');
  const [speechRate, setSpeechRate] = useState(1);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Parse summary into bullets - Handle markdown lists and sentences
  const bulletPoints = summary
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('- ') || line.startsWith('* ') || line.match(/^\d+\./))
    .map(line => line.replace(/^[-*\d.]+\s+/, ''))
    .concat(
      // fallback to sentence splitting if no markdown bullets found
      summary.split(/\n/).every(line => !line.startsWith('- ') && !line.startsWith('* '))
        ? summary.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 20)
        : []
    )
    .filter(s => s.length > 0);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));
      setVoices(englishVoices.length > 0 ? englishVoices : allVoices);

      if (!selectedVoiceName) {
        const preferred = englishVoices.find(v => v.name.includes('Google') || v.name.includes('Premium')) || englishVoices[0] || allVoices[0];
        if (preferred) setSelectedVoiceName(preferred.name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoiceName]);

  // Stop speaking when dialog closes
  useEffect(() => {
    if (!isOpen) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!summary) return;

    // Clean text for speech (remove markdown artifacts)
    const cleanText = summary.replace(/\*|_|#/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechRate;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // Use selected voice
    const selectedVoice = voices.find(v => v.name === selectedVoiceName);
    if (selectedVoice) utterance.voice = selectedVoice;

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleDownloadMp3 = async () => {
    if (!summary) return;
    setIsDownloading(true);

    try {
      const blob = new Blob([summary], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_Summary.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Summary Saved",
        description: "Your text summary has been downloaded.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not save the summary.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-[2.5rem] glassmorphism p-0 shadow-2xl shadow-purple-900/40 border border-white/10 overflow-hidden outline-none ring-0" showCloseButton={false}>
        <DialogClose asChild>
          <Button variant="ghost" size="icon" className="rounded-full absolute top-5 right-5 z-20 hover:bg-white/10 text-zinc-400">
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>

        {/* Minimalist Audio-First Header */}
        <div className="relative pt-8 pb-4 px-8 text-center bg-gradient-to-b from-purple-500/10 via-transparent to-transparent">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-purple-500/50" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400/80">AI Synthesis</span>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-purple-500/50" />
          </div>
          <DialogTitle className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white tracking-tight leading-none uppercase italic">
            {title}
          </DialogTitle>
        </div>

        <div className="px-6 pb-8 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 animate-pulse" />
                <Loader2 className="h-12 w-12 text-purple-500 animate-spin relative z-10" />
              </div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">Distilling Intelligence...</p>
            </div>
          ) : (
            <>
              {/* Content View Selector */}
              <div className="flex justify-center -mt-2">
                <div className="flex p-1 bg-white/5 rounded-full border border-white/5 scale-90">
                  <button
                    onClick={() => setViewMode('bullets')}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all",
                      viewMode === 'bullets' ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <List className="w-3 h-3" />
                    Key Points
                  </button>
                  <button
                    onClick={() => setViewMode('paragraph')}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all",
                      viewMode === 'paragraph' ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <AlignLeft className="w-3 h-3" />
                    Narrative
                  </button>
                </div>
              </div>

              {/* Enhanced Content Area */}
              <div className="relative group mx-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative w-full bg-[#0B0B12]/80 rounded-3xl border border-white/10 shadow-[inset_0_2px_20px_rgba(0,0,0,0.4)] overflow-hidden">
                  <ScrollArea className="h-[220px] p-6 lg:p-7">
                    {viewMode === 'bullets' ? (
                      <ul className="space-y-4 pr-2">
                        {bulletPoints.map((point, i) => (
                          <li key={i} className="flex gap-3 text-zinc-300 text-[14px] leading-relaxed group/item">
                            <div className="mt-2 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 shadow-[0_0_8px_rgba(168,85,247,0.5)] shrink-0" />
                            <span className="group-hover/item:text-white transition-colors">{point}.</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[15px] leading-[1.8] text-zinc-300 font-medium font-space-grotesk tracking-wide">
                        {summary}
                      </p>
                    )}
                  </ScrollArea>
                </div>
              </div>

              {/* Narrator Settings Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <span className="px-1 text-zinc-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Music className="w-2.5 h-2.5 text-purple-500" /> Narrator
                  </span>
                  <Select value={selectedVoiceName} onValueChange={setSelectedVoiceName}>
                    <SelectTrigger className="h-10 bg-white/5 border-white/5 rounded-2xl text-[11px] text-zinc-400 hover:bg-white/10 transition-all border-none shadow-inner ring-1 ring-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glassmorphism rounded-2xl border-white/10 max-h-[180px]">
                      {voices.map((v) => (
                        <SelectItem key={v.name} value={v.name} className="text-[11px] text-zinc-300 py-2">{v.name.split('-')[0]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <span className="px-1 text-zinc-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <FastForward className="w-2.5 h-2.5 text-pink-500" /> Speed
                  </span>
                  <div className="flex bg-white/5 rounded-2xl p-1 gap-1 ring-1 ring-white/10">
                    {[1, 1.25, 1.5].map(rate => (
                      <button
                        key={rate}
                        onClick={() => setSpeechRate(rate)}
                        className={cn(
                          "flex-1 h-8 rounded-xl text-[10px] font-bold transition-all",
                          speechRate === rate ? "bg-white/10 text-white shadow-xl" : "text-zinc-600 hover:text-zinc-400"
                        )}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* HERO ACTION AREA */}
              <div className="flex flex-col items-center gap-4 pt-4">
                <div className="flex items-center gap-3 w-full">
                  <Button
                    className={cn(
                      "flex-1 h-14 rounded-2xl text-[15px] font-black uppercase tracking-[0.1em] transition-all active:scale-95 shadow-xl border-none group relative overflow-hidden",
                      isSpeaking
                        ? "bg-zinc-800 text-zinc-400"
                        : "bg-gradient-to-r from-[#9B5CFF] to-[#FF4FC3] text-white hover:brightness-110 shadow-purple-600/20"
                    )}
                    onClick={handleToggleSpeech}
                  >
                    <div className="relative z-10 flex items-center justify-center gap-3">
                      {isSpeaking ? <Pause className="h-5 w-5 fill-zinc-400" /> : <Play className="h-5 w-5 fill-white" />}
                      <span>{isSpeaking ? 'Pause' : 'Listen'}</span>
                      {isSpeaking && <VoiceWaveform isPlaying={isSpeaking} />}
                    </div>
                    {/* Glossy Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-50" />
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-14 h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-all hover:scale-105 active:scale-95 group shrink-0"
                      onClick={handleDownloadMp3}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                      ) : (
                        <Download className="h-4 w-4 text-zinc-400 group-hover:text-purple-400" />
                      )}
                    </Button>

                    {onReload && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-14 h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-all hover:scale-105 active:scale-95 group shrink-0"
                        onClick={onReload}
                        disabled={isLoading}
                      >
                        <RotateCcw className={cn("h-4 w-4 text-zinc-400 group-hover:text-blue-400", isLoading && "animate-spin")} />
                      </Button>
                    )}
                  </div>
                </div>

                {isSpeaking && (
                  <p className="text-[9px] text-purple-500 font-bold uppercase tracking-widest animate-pulse">
                    Live AI Transcription...
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
