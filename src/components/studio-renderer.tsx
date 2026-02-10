'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain,
    Calendar,
    FileText,
    Presentation,
    GraduationCap,
    ShieldAlert,
    Share2,
    Code2,
    Check,
    ChevronRight,
    ArrowLeft,
    Download,
    Copy,
    Eye,
    Folder,
    FileCode,
    Sparkles,
    ChevronLeft,
    RotateCw,
    Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { cn, cleanCitations } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { QuizRenderer } from './quiz-renderer';

interface StudioRendererProps {
    data: any;
    type: string;
    topic: string;
    onClose?: () => void;
}

export function StudioRenderer({ data, type, topic, onClose }: StudioRendererProps) {
    const { toast } = useToast();

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard", description: "Content ready to paste." });
    };

    const renderMarkdown = (content: string) => {
        // Remove citation markers like [1], [2], [12], etc.
        const cleanContent = cleanCitations(content);

        return (
            <div className="prose prose-invert max-w-none prose-p:text-zinc-400 prose-headings:text-white prose-a:text-primary prose-strong:text-white prose-code:text-emerald-400">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanContent}</ReactMarkdown>
            </div>
        );
    };

    const renderQuiz = (quizData: any) => {
        const [view, setView] = useState<'questions' | 'flashcards'>('questions');

        // Flashcard State
        const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

        // Quiz State
        const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

        const toggleFlip = (index: number) => {
            setFlippedIndex(prev => (prev === index ? null : index));
        };

        const handleQuizSelect = (questionIndex: number, optionIndex: number) => {
            if (selectedAnswers[questionIndex] !== undefined) return; // Prevent changing answer
            setSelectedAnswers(prev => ({
                ...prev,
                [questionIndex]: optionIndex
            }));
        };

        // Calculate score
        const score = Object.keys(selectedAnswers).reduce((acc, key) => {
            const index = parseInt(key);
            const userIndex = selectedAnswers[index];

            // Handle both legacy (string) and new (index) data formats
            const currentQuestion = quizData.questions[index];
            // Robust answer validation
            let isCorrect = false;

            // 1. Try index-based validation (Priority)
            if (typeof currentQuestion.answerIndex === 'number') {
                isCorrect = userIndex === currentQuestion.answerIndex;
            }
            // 2. Fallback to string-based validation (Legacy/Safety)
            else if (currentQuestion.answer) {
                const selectedOptionText = currentQuestion.options[userIndex];
                // Normalize both strings: trim and lowercase for loose comparison
                const normalizedSelected = selectedOptionText?.toLowerCase().trim();
                const normalizedAnswer = currentQuestion.answer.toLowerCase().trim();

                // Check partial matches (e.g. "A. Option" containing "Option")
                isCorrect = normalizedSelected === normalizedAnswer ||
                    normalizedSelected?.includes(normalizedAnswer) ||
                    normalizedAnswer?.includes(normalizedSelected);
            }

            if (isCorrect) {
                return acc + 1;
            }
            return acc;
        }, 0);

        return (
            <div className="space-y-8">
                {/* Mode Toggles */}
                <div className="flex justify-center p-1 bg-white/5 rounded-full w-fit mx-auto border border-white/10">
                    <button
                        onClick={() => setView('questions')}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-medium transition-all",
                            view === 'questions'
                                ? "bg-primary text-white shadow-lg"
                                : "text-zinc-400 hover:text-white"
                        )}
                    >
                        Questions
                    </button>
                    <button
                        onClick={() => setView('flashcards')}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-medium transition-all",
                            view === 'flashcards'
                                ? "bg-primary text-white shadow-lg"
                                : "text-zinc-400 hover:text-white"
                        )}
                    >
                        Flashcards
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {view === 'questions' ? (
                        <motion.div
                            key="questions"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6 max-w-3xl mx-auto"
                        >
                            {/* Score Banner (shows after answering all) */}
                            {Object.keys(selectedAnswers).length === quizData.questions.length && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-full bg-green-500/20">
                                            <Trophy className="w-6 h-6 text-green-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">Quiz Completed!</h3>
                                            <p className="text-green-200">You scored {score} out of {quizData.questions.length}</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setSelectedAnswers({})}
                                        variant="outline"
                                        className="border-green-500/30 hover:bg-green-500/10 text-green-400"
                                    >
                                        <RotateCw className="w-4 h-4 mr-2" /> Retry
                                    </Button>
                                </motion.div>
                            )}

                            {quizData.questions.map((q: any, i: number) => {
                                const userAnswerIndex = selectedAnswers[i];
                                const hasAnswered = userAnswerIndex !== undefined;

                                // Fallback for legacy data that might have string answers
                                const correctIndex = typeof q.answerIndex === 'number'
                                    ? q.answerIndex
                                    : q.options.indexOf(q.answer);

                                const isCorrect = hasAnswered && userAnswerIndex === correctIndex;

                                return (
                                    <div key={i} className={cn(
                                        "p-6 border transition-all duration-300 rounded-2xl",
                                        hasAnswered
                                            ? isCorrect
                                                ? "bg-green-500/5 border-green-500/30"
                                                : "bg-red-500/5 border-red-500/30"
                                            : "bg-white/5 border-white/10 hover:border-white/20"
                                    )}>
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <h4 className="text-lg font-bold text-white leading-relaxed">
                                                <span className="text-primary mr-2">{i + 1}.</span>
                                                {cleanCitations(q.question)}
                                            </h4>
                                            {hasAnswered && (
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                                    isCorrect ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                                )}>
                                                    {isCorrect ? 'Correct' : 'Incorrect'}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {q.options.map((opt: string, j: number) => {
                                                const isSelected = userAnswerIndex === j;
                                                const isAnswer = correctIndex === j;

                                                let buttonStyle = "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-zinc-400";

                                                if (hasAnswered) {
                                                    if (isSelected && isCorrect) buttonStyle = "border-green-500/50 bg-green-500/20 text-green-100";
                                                    else if (isSelected && !isCorrect) buttonStyle = "border-red-500/50 bg-red-500/20 text-red-100";
                                                    else if (isAnswer && !isCorrect) buttonStyle = "border-green-500/30 bg-green-500/10 text-green-200 border-dashed";
                                                    else buttonStyle = "opacity-50 border-transparent bg-transparent text-zinc-600";
                                                }

                                                return (
                                                    <button
                                                        key={j}
                                                        disabled={hasAnswered}
                                                        onClick={() => handleQuizSelect(i, j)}
                                                        className={cn(
                                                            "p-4 text-left rounded-xl border transition-all duration-200 text-sm font-medium relative overflow-hidden",
                                                            buttonStyle
                                                        )}
                                                    >
                                                        <div className="relative z-10 flex items-center justify-between">
                                                            <span>{cleanCitations(opt)}</span>
                                                            {hasAnswered && isSelected && (isCorrect ? <Check className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />)}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="flashcards"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {quizData.flashcards.map((card: any, index: number) => {
                                const isFlipped = flippedIndex === index;
                                return (
                                    <div
                                        key={index}
                                        className="perspective-1000 h-[300px] w-full relative group cursor-pointer"
                                        onClick={() => toggleFlip(index)}
                                    >
                                        <motion.div
                                            className="relative w-full h-full text-center transition-all duration-300 preserve-3d"
                                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                                            transition={{ duration: 0.15, type: "spring", stiffness: 260, damping: 20 }}
                                        >
                                            {/* Front */}
                                            <div className="absolute w-full h-full backface-hidden bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 shadow-xl hover:border-white/20 hover:bg-white/10 transition-colors">
                                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shadow-inner mb-2">
                                                    <Brain className="w-6 h-6 text-primary" />
                                                </div>
                                                <h3 className="text-white font-bold text-lg leading-snug">
                                                    {cleanCitations(card.front)}
                                                </h3>
                                                <span className="absolute bottom-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                                    Tap to Flip
                                                </span>
                                            </div>

                                            {/* Back */}
                                            <div className="absolute w-full h-full backface-hidden bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center rotate-y-180 shadow-xl overflow-y-auto hover:border-white/20 hover:bg-white/10 transition-colors">
                                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                                                    <Sparkles className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <p className="text-zinc-300 font-medium text-sm leading-relaxed">
                                                    {cleanCitations(card.back)}
                                                </p>
                                            </div>
                                        </motion.div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    const renderSocial = (posts: any[]) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
                <Card key={i} className="p-6 bg-white/5 border-white/10 flex flex-col hover:border-white/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Share2 className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="font-bold text-zinc-300">{post.platform}</span>
                        <span className="ml-auto text-[10px] bg-white/5 px-2 py-1 rounded-full text-zinc-500 uppercase font-bold">{post.purpose}</span>
                    </div>
                    <ScrollArea className="flex-grow mb-4 h-48">
                        <p className="text-zinc-400 text-sm whitespace-pre-wrap">{post.content}</p>
                    </ScrollArea>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(post.content)}
                        className="mt-auto w-full text-zinc-500 hover:text-white"
                    >
                        <Copy className="w-3 h-3 mr-2" /> Copy Content
                    </Button>
                </Card>
            ))}
        </div>
    );



    const getIcon = () => {
        switch (type) {
            case 'mindmap': return Brain;
            case 'roadmap': return Calendar;
            case 'dossier': return FileText;
            case 'pitch': return Presentation;
            case 'quiz': return GraduationCap;
            case 'premortem': return ShieldAlert;
            case 'social': return Share2;
            default: return Sparkles;
        }
    };

    const Icon = getIcon();

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl overflow-y-auto px-4 py-12 md:px-8 print-content-wrapper">
            <div className="max-w-6xl mx-auto print-content">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl shadow-primary/20">
                            <Icon className="w-10 h-10 text-white" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black text-white tracking-tight">{topic}</h1>
                            <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-widest text-[10px] font-orbitron">
                                <Sparkles className="w-3 h-3 text-primary" />
                                <span>Knowledge Studio Output: {type}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 no-print">
                        <Button
                            variant="outline"
                            className="rounded-2xl border-white/10 hover:bg-white/5 h-12 px-6"
                            onClick={() => window.print()}
                        >
                            <Download className="w-4 h-4 mr-2" /> Export
                        </Button>
                        <Button
                            variant="secondary"
                            className="rounded-2xl bg-white text-black hover:bg-zinc-200 h-12 px-8 font-black"
                            onClick={onClose}
                        >
                            Close Studio
                        </Button>
                    </div>
                </div>

                <div className="min-h-[60vh] pb-24">
                    {type === 'dossier' || type === 'pitch' || type === 'premortem' ? (
                        <div className="max-w-4xl mx-auto rounded-[3rem] border border-white/5 bg-white/[0.02] p-8 md:p-16 shadow-2xl">
                            {renderMarkdown(data)}
                        </div>
                    ) : type === 'quiz' ? (
                        renderQuiz(data)
                    ) : type === 'social' ? (
                        renderSocial(data)
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <h2 className="text-2xl font-bold text-white">This format renders in the Canvas</h2>
                            <p className="text-zinc-500">Close this view to see your {type} on the mind map.</p>
                            <Button onClick={onClose} variant="secondary">Go to Canvas</Button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                pre { margin: 0; }
            `}</style>
        </div>
    );
}
