
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card } from './ui/card';

/**
 * A list of steps displayed to the user during mind map generation.
 * Option A: Technical & Accurate - reflects detailed background tasks.
 * @const {string[]}
 */
const generationSteps = [
  'Initializing AI & Configuring Depth...',
  'Gathering Context & Research...',
  'Constructing AI Prompt...',
  'Generating Mind Map Structure...',
  'Validating & Processing...',
  'Creating Thumbnail & Saving...',
];

/**
 * The duration for each step of the generation animation.
 * Adjusted to match actual processing times for each detailed step.
 * @const {number[]}
 */
const stepDurations = [1500, 2500, 1000, 6000, 1500, 2000];

/**
 * A component that displays an animated loading sequence for mind map generation.
 * It cycles through a series of steps with a progress bar and a book animation.
 * @returns {JSX.Element} The generation loading component.
 */
export function GenerationLoading() {
  const [currentStep, setCurrentStep] = useState(0);
  const [seconds, setSeconds] = useState(0);

  // Timer interval to track total elapsed time (ChatGPT style)
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // We only want to time the first 4 steps. The last step is controlled by the parent component.
    if (currentStep < generationSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, stepDurations[currentStep]);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Format seconds into M:SS
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
      <Card className="w-full p-8 flex flex-col items-center justify-center gap-8 glassmorphism relative overflow-hidden">
        {/* ChatGPT Style Floating Timer */}
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-mono font-medium text-primary tabular-nums">
            {formatTime(seconds)}
          </span>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Building Your Mind Map
          </h2>
          <p className="text-muted-foreground mt-2">
            Please wait while our AI brings your ideas to life.
          </p>
        </div>

        <div className="book">
          <div className="book-cover"></div>
          <div className="page"></div>
          <div className="page"></div>
          <div className="page"></div>
          <div className="page-3d"></div> {/* Enhanced page animation indicator */}
          <div className="page"></div>
          <div className="page"></div>
          <div className="last-page"></div>
        </div>

        <div className="w-full max-w-md">
          <div className="flex w-full h-2 rounded-full overflow-hidden bg-muted/50 backdrop-blur-sm shadow-inner">
            {generationSteps.map((_, index) => (
              <div
                key={index}
                className="flex-1 h-full border-r border-background/20 last:border-r-0"
              >
                <div
                  className={cn(
                    'h-full w-0 bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000 ease-in-out',
                    // A step is considered "complete" if the current step index is greater than it.
                    index < currentStep && 'w-full',
                    // The currently active step gets a pulsing animation.
                    index === currentStep && 'w-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                  )}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <p className="text-center text-primary font-medium h-6">
              {generationSteps[currentStep]}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
