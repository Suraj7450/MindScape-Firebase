
'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from './ui/separator';
import { useTranslation } from '@/hooks/use-translation';
import { languages } from '@/lib/languages';
import { ScrollArea } from './ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { translateTextAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

/**
 * A dialog component that displays the original and translated text.
 * It allows the user to change the target language and automatically re-translates the text.
 * @returns {JSX.Element} The translation dialog component.
 */
export function TranslationDialog() {
  const {
    isTranslationDialogOpen,
    setIsTranslationDialogOpen,
    translationResult,
    setTranslationResult,
    targetLanguage,
    setTargetLanguage,
  } = useTranslation();
  const { toast } = useToast();

  const targetLanguageName =
    languages.find((lang) => lang.code === targetLanguage)?.name || 'language';

  useEffect(() => {
    // When the dialog is open and the target language changes, re-translate.
    if (isTranslationDialogOpen && translationResult.original) {
      /**
       * Asynchronously re-translates the original text to the new target language.
       */
      const reTranslate = async () => {
        const { translation, error } = await translateTextAction({
          text: translationResult.original,
          targetLang: targetLanguage,
        });

        if (error) {
          toast({
            variant: 'destructive',
            title: 'Translation Failed',
            description: error,
          });
        } else if (translation) {
          // Update the translated text part of the result
          setTranslationResult({
            original: translationResult.original,
            translated: translation.translatedText,
          });
        }
      };
      reTranslate();
    }
  }, [
    targetLanguage,
    isTranslationDialogOpen,
    translationResult.original,
    setTranslationResult,
    toast,
  ]);

  return (
    <Dialog
      open={isTranslationDialogOpen}
      onOpenChange={setIsTranslationDialogOpen}
    >
      <DialogContent className="sm:max-w-2xl glassmorphism">
        <DialogHeader className="flex-row justify-between items-center">
          <div>
            <DialogTitle>Translation</DialogTitle>
            <DialogDescription>
              Your text has been translated to {targetLanguageName}.
            </DialogDescription>
          </div>
          <div className="w-48 mr-4">
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger id="target-language">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="grid gap-6 py-4">
            <Separator />
            <div>
              <h3 className="font-semibold text-muted-foreground mb-2">
                Original Text (English)
              </h3>
              <div className="p-4 bg-secondary/30 rounded-md">
                <p>{translationResult.original}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-muted-foreground mb-2">
                Translated Text ({targetLanguageName})
              </h3>
              <div className="p-4 bg-secondary/30 rounded-md">
                <p>{translationResult.translated}</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
