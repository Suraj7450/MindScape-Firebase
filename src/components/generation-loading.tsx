
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card } from './ui/card';

/**
 * A list of steps displayed to the user during mind map generation.
 * @const {string[]}
 */
const generationSteps = [
  'Initiating Generation...',
  'Brainstorming Core Ideas...',
  'Structuring Categories...',
  'Creating Detailed Content...',
  'Finalizing & Rendering...',
];

/**
 * The duration for each step of the generation animation.
 * @const {number[]}
 */
const stepDurations = [1200, 2500, 2500, 3000, 1500];

/**
 * A component that displays an animated loading sequence for mind map generation.
 * It cycles through a series of steps with a progress bar and a book animation.
 * @returns {JSX.Element} The generation loading component.
 */
export function GenerationLoading() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // We only want to time the first 4 steps. The last step is controlled by the parent component.
    if (currentStep < generationSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, stepDurations[currentStep]);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
      <Card className="w-full p-8 flex flex-col items-center justify-center gap-8 glassmorphism">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Building Your Mind Map</h2>
          <p className="text-muted-foreground mt-2">
            Please wait while our AI brings your ideas to life.
          </p>
        </div>

        <div className="book">
          <div className="book-cover"></div>
          <div className="page"></div>
          <div className="page"></div>
          <div className="page"></div>
          <div className="page"></div>
          <div className="page"></div>
          <div className="last-page"></div>
        </div>

        <div className="w-full max-w-md">
          <div className="flex w-full h-4 rounded-full overflow-hidden bg-muted">
            {generationSteps.map((_, index) => (
              <div
                key={index}
                className="flex-1 h-full first:rounded-l-full last:rounded-r-full border-r-2 border-background last:border-r-0"
              >
                <div
                  className={cn(
                    'h-full w-0 bg-green-500 transition-all duration-500 ease-in-out',
                    // A step is considered "complete" if the current step index is greater than it.
                    index < currentStep && 'w-full',
                    // The currently active step gets a pulsing animation.
                    index === currentStep && 'w-full animate-pulse'
                  )}
                />
              </div>
            ))}
          </div>
          <p className="text-center text-primary font-medium mt-4 h-6">
            {generationSteps[currentStep]}
          </p>
        </div>
      </Card>
    </div>
  );
}
