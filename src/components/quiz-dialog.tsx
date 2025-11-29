
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import type { QuizQuestion } from '@/ai/flows/generate-quiz';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';

/**
 * Props for the QuizDialog component.
 * @interface QuizDialogProps
 * @property {boolean} isOpen - Whether the dialog is open.
 * @property {() => void} onClose - Function to call when the dialog should be closed.
 * @property {string} topic - The topic of the quiz.
 * @property {QuizQuestion[]} questions - The array of quiz questions.
 * @property {boolean} isLoading - Indicates if the quiz is currently being generated.
 * @property {() => void} onRestart - Function to call to restart the quiz with new questions.
 */
interface QuizDialogProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  questions: QuizQuestion[];
  isLoading: boolean;
  onRestart: () => void;
}

/**
 * A dialog component that presents a multiple-choice quiz to the user.
 * It manages the quiz state, including question progression, scoring, and results.
 * @param {QuizDialogProps} props - The props for the component.
 * @returns {JSX.Element} The quiz dialog component.
 */
export function QuizDialog({
  isOpen,
  onClose,
  topic,
  questions,
  isLoading,
  onRestart,
}: QuizDialogProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  /**
   * Handles the selection of an answer for the current question.
   * @param {number} answerIndex - The index of the selected answer.
   */
  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return;
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    if (answerIndex === currentQuestion.correctAnswerIndex) {
      setScore(score + 1);
    }
  };

  /**
   * Moves to the next question or finishes the quiz if it's the last question.
   */
  const handleNextQuestion = () => {
    setIsAnswered(false);
    setSelectedAnswer(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsQuizFinished(true);
    }
  };

  /**
   * Resets the local state of the quiz.
   */
  const resetLocalState = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setIsQuizFinished(false);
  };

  /**
   * Handles restarting the quiz, which resets the state and fetches new questions.
   */
  const handleRestartQuiz = () => {
    resetLocalState();
    onRestart();
  };

  /**
   * Handles closing the dialog, which also resets the local state.
   */
  const handleClose = () => {
    resetLocalState();
    onClose();
  };

  const progress =
    ((currentQuestionIndex + (isQuizFinished ? 1 : 0)) /
      (questions.length || 1)) *
    100;

  /**
   * Renders the main content of the dialog based on the current state (loading, in-progress, finished).
   * @returns {JSX.Element | null} The content to be rendered.
   */
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin" />
          <p className="ml-4 text-lg">
            {questions.length > 0
              ? 'Generating new questions...'
              : 'Generating your quiz...'}
          </p>
        </div>
      );
    }

    if (isQuizFinished) {
      return (
        <div className="text-center py-8">
          <h2 className="text-3xl font-bold mb-4">Quiz Complete!</h2>
          <p className="text-xl text-muted-foreground mb-2">
            Your final score is:
          </p>
          <p className="text-5xl font-bold text-primary mb-6">
            {score} / {questions.length}
          </p>
          <Button onClick={handleRestartQuiz}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Restart Quiz
          </Button>
        </div>
      );
    }

    if (currentQuestion) {
      return (
        <div>
          <div className="mb-4">
            <Progress value={progress} className="w-full" />
            <p className="text-right text-sm text-muted-foreground mt-1">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>

          <h3 className="text-lg font-semibold mb-4">
            {currentQuestion.question}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentQuestion.options.map((option, index) => {
              const isCorrect = index === currentQuestion.correctAnswerIndex;
              const isSelected = index === selectedAnswer;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className={cn(
                    'h-auto py-3 whitespace-normal justify-start text-left',
                    isAnswered &&
                      isCorrect &&
                      'bg-green-500/20 border-green-500 hover:bg-green-500/30',
                    isAnswered &&
                      isSelected &&
                      !isCorrect &&
                      'bg-red-500/20 border-red-500 hover:bg-red-500/30'
                  )}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered}
                >
                  <span className="mr-3 font-bold">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                  {isAnswered && isCorrect && (
                    <CheckCircle className="ml-auto h-5 w-5 text-green-500" />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <XCircle className="ml-auto h-5 w-5 text-red-500" />
                  )}
                </Button>
              );
            })}
          </div>
          {isAnswered && (
            <div className="mt-4 p-4 bg-secondary/50 rounded-md">
              <p className="font-bold">Explanation:</p>
              <p className="text-sm text-muted-foreground">
                {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl glassmorphism">
        <DialogHeader>
          <DialogTitle className="text-2xl">"{topic}" Quiz</DialogTitle>
          <DialogDescription>
            Test your knowledge on this topic.
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        <DialogFooter>
          {isAnswered && !isQuizFinished && (
            <Button onClick={handleNextQuestion}>
              {currentQuestionIndex < questions.length - 1
                ? 'Next Question'
                : 'Finish Quiz'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
