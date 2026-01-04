'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    CheckCircle2,
    XCircle,
    ArrowRight,
    RotateCcw,
    Trophy,
    Loader2,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Quiz, QuizQuestion } from '@/ai/schemas/quiz-schema';

interface QuizComponentProps {
    quiz: Quiz;
    onClose: () => void;
    onRestart: (wrongConcepts?: string[]) => void;
}

export const QuizComponent = ({ quiz, onClose, onRestart }: QuizComponentProps) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswershowing, setIsAnswerShowing] = useState(false);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [answers, setAnswers] = useState<{ questionId: string, selected: string, isCorrect: boolean }[]>([]);

    const resetQuiz = () => {
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setIsAnswerShowing(false);
        setScore(0);
        setShowResults(false);
        setAnswers([]);
    };

    useEffect(() => {
        resetQuiz();
    }, [quiz]);

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

    const handleOptionSelect = (option: string) => {
        if (isAnswershowing) return;
        setSelectedOption(option);
    };

    const handleConfirmAnswer = () => {
        if (!selectedOption) return;

        const isCorrect = selectedOption === currentQuestion.correctAnswer;
        if (isCorrect) setScore(prev => prev + 1);

        setAnswers(prev => [...prev, {
            questionId: currentQuestion.id,
            selected: selectedOption,
            isCorrect
        }]);

        setIsAnswerShowing(true);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswerShowing(false);
        } else {
            setShowResults(true);
        }
    };

    return (
        <div className="w-full max-w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm shadow-xl">
            {/* compact Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-white tracking-tight">Active Quiz</span>
                </div>
                <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                    {currentQuestionIndex + 1} / {quiz.questions.length}
                </div>
            </div>

            <div className="p-4 sm:p-5 space-y-5">
                <AnimatePresence mode="wait">
                    {!showResults ? (
                        <motion.div
                            key={currentQuestionIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-5"
                        >
                            {/* Question */}
                            <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
                                {currentQuestion.question}
                            </h4>

                            {/* Options */}
                            <div className="grid gap-2">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = selectedOption === option;
                                    const isCorrect = isAnswershowing && option === currentQuestion.correctAnswer;
                                    const isWrong = isAnswershowing && isSelected && option !== currentQuestion.correctAnswer;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleOptionSelect(option)}
                                            disabled={isAnswershowing}
                                            className={cn(
                                                "group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-left relative",
                                                isSelected ? "bg-primary/10 border-primary/40" : "bg-white/[0.03] border-white/5 hover:border-white/10",
                                                isCorrect && "bg-emerald-500/10 border-emerald-500/40",
                                                isWrong && "bg-red-500/10 border-red-500/40"
                                            )}
                                        >
                                            <span className={cn(
                                                "text-sm transition-colors",
                                                isSelected ? "text-white font-medium" : "text-zinc-400 group-hover:text-zinc-200",
                                                isCorrect && "text-emerald-400",
                                                isWrong && "text-red-400"
                                            )}>
                                                {option}
                                            </span>

                                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                                            {isWrong && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Explanation (Compact) */}
                            <AnimatePresence>
                                {isAnswershowing && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-400 leading-relaxed italic">
                                            <span className="text-zinc-200 font-bold not-italic mr-1.5 underline decoration-primary/30">Explanation:</span>
                                            {currentQuestion.explanation}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Actions */}
                            <div className="flex justify-end pt-1">
                                {!isAnswershowing ? (
                                    <Button
                                        onClick={handleConfirmAnswer}
                                        disabled={!selectedOption}
                                        size="sm"
                                        className="rounded-lg bg-primary hover:bg-primary/90 text-white font-bold h-10 px-6 shadow-md shadow-primary/10"
                                    >
                                        Confirm
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleNextQuestion}
                                        size="sm"
                                        className="rounded-lg bg-white text-black hover:bg-zinc-200 font-bold h-10 px-6 gap-2"
                                    >
                                        {currentQuestionIndex < quiz.questions.length - 1 ? 'Next' : 'Results'}
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6 py-2"
                        >
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-primary/20 blur-[30px] rounded-full" />
                                <div className="relative w-16 h-16 mx-auto bg-gradient-to-b from-primary to-accent rounded-2xl flex items-center justify-center shadow-xl border border-white/10">
                                    <Trophy className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-white tracking-tight">Well Done!</h3>
                                <p className="text-zinc-400 text-sm">Score: <span className="text-primary font-bold">{score}</span> / {quiz.questions.length}</p>
                            </div>

                            {answers.some(a => !a.isCorrect) && (
                                <div className="space-y-2 text-left">
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 px-1">Focus Areas</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[...new Set(answers
                                            .filter(a => !a.isCorrect)
                                            .map(a => quiz.questions.find(q => q.id === a.questionId)?.conceptTag)
                                            .filter(Boolean)
                                        )].map((concept, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-medium"
                                            >
                                                {concept}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                                    <span>Accuracy</span>
                                    <span className="text-white">{Math.round((score / quiz.questions.length) * 100)}%</span>
                                </div>
                                <Progress value={(score / quiz.questions.length) * 100} className="h-1.5 bg-white/5" />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={resetQuiz}
                                    variant="outline"
                                    className="flex-1 rounded-xl h-11 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 gap-1.5 text-xs font-bold"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" /> Retake
                                </Button>
                                <Button
                                    onClick={onClose}
                                    className="flex-1 rounded-xl h-11 bg-primary text-white hover:bg-primary/90 text-xs font-bold shadow-lg shadow-primary/10"
                                >
                                    Finish
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
