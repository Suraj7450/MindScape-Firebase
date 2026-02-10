'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Check, ShieldAlert, Trophy, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuizRendererProps {
    quizData: {
        questions: Array<{
            question: string;
            options: string[];
            answerIndex?: number;
            answer?: string; // Legacy fallback
        }>;
        flashcards: Array<{
            front: string;
            back: string;
        }>;
    };
}

export function QuizRenderer({ quizData }: QuizRendererProps) {
    const [view, setView] = useState<'questions' | 'flashcards'>('questions');
    const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

    const toggleFlip = (index: number) => {
        setFlippedIndex(prev => (prev === index ? null : index));
    };

    const handleQuizSelect = (questionIndex: number, optionIndex: number) => {
        if (selectedAnswers[questionIndex] !== undefined) return;
        setSelectedAnswers(prev => ({
            ...prev,
            [questionIndex]: optionIndex
        }));
    };

    // Calculate score
    const score = Object.keys(selectedAnswers).reduce((acc, key) => {
        const index = parseInt(key);
        const userIndex = selectedAnswers[index];
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
            const normalizedSelected = selectedOptionText?.toLowerCase().trim();
            const normalizedAnswer = currentQuestion.answer.toLowerCase().trim();

            isCorrect = normalizedSelected === normalizedAnswer ||
                normalizedSelected?.includes(normalizedAnswer) ||
                normalizedAnswer?.includes(normalizedSelected);
        }

        if (isCorrect) return acc + 1;
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
                        view === 'questions' ? "bg-primary text-white shadow-lg" : "text-zinc-400 hover:text-white"
                    )}
                >
                    Questions
                </button>
                <button
                    onClick={() => setView('flashcards')}
                    className={cn(
                        "px-6 py-2 rounded-full text-sm font-medium transition-all",
                        view === 'flashcards' ? "bg-primary text-white shadow-lg" : "text-zinc-400 hover:text-white"
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
                        {/* Score Banner */}
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

                        {quizData.questions.map((q, i) => {
                            const userAnswerIndex = selectedAnswers[i];
                            const hasAnswered = userAnswerIndex !== undefined;

                            // Determine correct index for display logic
                            let correctIndex = -1;
                            if (typeof q.answerIndex === 'number') {
                                correctIndex = q.answerIndex;
                            } else if (q.answer) {
                                // Best effort for legacy display
                                correctIndex = q.options.findIndex(opt =>
                                    opt.toLowerCase().trim() === q.answer!.toLowerCase().trim()
                                );
                            }

                            const isCorrect = hasAnswered && (
                                typeof q.answerIndex === 'number'
                                    ? userAnswerIndex === q.answerIndex
                                    : (q.options[userAnswerIndex]?.toLowerCase().trim() === q.answer?.toLowerCase().trim())
                            );

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
                                            {q.question}
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
                                        {q.options.map((opt, j) => {
                                            const isSelected = userAnswerIndex === j;
                                            // Show green if this option matches the correct answer (even if user didn't select it)
                                            // BUT only if user has answered
                                            const isAnswer = correctIndex === j; // Simple check for visualization

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
                                                        <span>{opt}</span>
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
                        {quizData.flashcards.map((card, index) => {
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
                                                {card.front}
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
                                                {card.back}
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
}
