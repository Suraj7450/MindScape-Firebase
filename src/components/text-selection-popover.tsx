
'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Languages, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useToast } from '@/hooks/use-toast';
import { translateTextAction } from '@/app/actions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

const DRAG_THRESHOLD = 5; // pixels

/**
 * A popover component that appears when text is selected on the page.
 * It provides a button to translate the selected text.
 * @returns {JSX.Element} The text selection popover component.
 */
export function TextSelectionPopover() {
  const {
    selectedText,
    setSelectedText,
    targetLanguage,
    setTranslationResult,
    setIsTranslationDialogOpen,
  } = useTranslation();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const tooltipTriggerRef = useRef<HTMLDivElement>(null);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    /**
     * Handles the mouseup event to detect text selection.
     * @param {MouseEvent} event - The mouse event.
     */
    const handleMouseUp = (event: MouseEvent) => {
      const target = event.target as Element;

      // Do not show tooltip if clicking inside an existing tooltip or dialog
      if (
        target.closest('[data-radix-tooltip-content]') ||
        target.closest('[data-radix-dialog-content]')
      ) {
        return;
      }
      
      const startPos = mouseDownPos.current;
      // Check if it was a drag or a click
      if (startPos) {
        const distance = Math.sqrt(
          Math.pow(event.clientX - startPos.x, 2) +
          Math.pow(event.clientY - startPos.y, 2)
        );
        // If it's just a click (not a drag), hide tooltip and do nothing
        if (distance < DRAG_THRESHOLD) {
          setTooltipOpen(false);
          setSelectedText('');
          return;
        }
      }

      const selection = window.getSelection();
      const text = selection?.toString().trim() ?? '';

      if (text) {
        const range = selection!.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (tooltipTriggerRef.current) {
          tooltipTriggerRef.current.style.top = `${
            rect.top + window.scrollY - 38
          }px`;
          tooltipTriggerRef.current.style.left = `${
            rect.left + window.scrollX + rect.width / 2 - 45
          }px`;
        }

        setSelectedText(text);
        setTooltipOpen(true);
      } else {
        // If no text is selected, ensure the tooltip is closed, unless the click was on the tooltip content itself.
        if (!target.closest('[data-radix-tooltip-content]')) {
          setTooltipOpen(false);
          setSelectedText('');
        }
      }
    };

    /**
     * Handles the mousedown event to track the start of a potential drag.
     * @param {MouseEvent} event - The mouse event.
     */
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Element;
      // If the click is on the tooltip content, don't do anything
      if (target.closest('[data-radix-tooltip-content]')) {
        return;
      }
      // Otherwise, close the tooltip and record the click position
      setTooltipOpen(false);
      mouseDownPos.current = { x: event.clientX, y: event.clientY };
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [setSelectedText]);

  /**
   * Handles the translation of the selected text.
   * Calls the translate server action and displays the result in a dialog.
   * @param {React.MouseEvent} e - The mouse event from the translate button.
   */
  const handleTranslate = async (e: React.MouseEvent) => {
    if (!selectedText) return;

    setIsLoading(true);
    const { translation, error } = await translateTextAction({
      text: selectedText,
      targetLang: targetLanguage,
    });
    setIsLoading(false);
    setTooltipOpen(false); // Close tooltip after action

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Translation Failed',
        description: error,
      });
    } else if (translation) {
      setTranslationResult({
        original: selectedText,
        translated: translation.translatedText,
      });
      setIsTranslationDialogOpen(true);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <div ref={tooltipTriggerRef} className="absolute z-[100]" />
        </TooltipTrigger>
        <TooltipContent className="p-1">
          <Button
            size="sm"
            onMouseDown={handleTranslate} // Use onMouseDown to capture single click
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Languages className="h-4 w-4" />
            )}
            <span>Translate</span>
          </Button>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
