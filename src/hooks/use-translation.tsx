
'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react';
import { useLocalStorage } from './use-local-storage';

/**
 * The shape of the translation result object.
 * @interface TranslationResult
 * @property {string} original - The original text.
 * @property {string} translated - The translated text.
 */
interface TranslationResult {
  original: string;
  translated: string;
}

/**
 * The state shape for the TranslationContext.
 * @interface TranslationContextState
 * @property {string} targetLanguage - The current target language code.
 * @property {(language: string) => void} setTargetLanguage - Function to set the target language.
 * @property {string} selectedText - The currently selected text on the page.
 * @property {(text: string) => void} setSelectedText - Function to set the selected text.
 * @property {boolean} isTranslationDialogOpen - Whether the translation dialog is open.
 * @property {(isOpen: boolean) => void} setIsTranslationDialogOpen - Function to open/close the dialog.
 * @property {TranslationResult} translationResult - The result of the last translation.
 * @property {(result: TranslationResult) => void} setTranslationResult - Function to set the translation result.
 */
interface TranslationContextState {
  targetLanguage: string;
  setTargetLanguage: (language: string) => void;
  selectedText: string;
  setSelectedText: (text: string) => void;
  isTranslationDialogOpen: boolean;
  setIsTranslationDialogOpen: (isOpen: boolean) => void;
  translationResult: TranslationResult;
  setTranslationResult: (result: TranslationResult) => void;
}

const TranslationContext = createContext<TranslationContextState | undefined>(
  undefined
);

/**
 * A provider component that manages the state for the text translation feature.
 * It provides context for the target language, selected text, and translation results.
 * @param {{ children: ReactNode }} props - The props for the component.
 * @returns {JSX.Element} The provider component.
 */
export function TranslationProvider({ children }: { children: ReactNode }) {
  const [targetLanguage, setTargetLanguage] = useLocalStorage<string>(
    'targetLanguage',
    'en'
  );
  const [selectedText, setSelectedText] = useState<string>('');
  const [isTranslationDialogOpen, setIsTranslationDialogOpen] =
    useState(false);
  const [translationResult, setTranslationResult] = useState<TranslationResult>(
    {
      original: '',
      translated: '',
    }
  );

  const value = {
    targetLanguage,
    setTargetLanguage,
    selectedText,
    setSelectedText,
    isTranslationDialogOpen,
    setIsTranslationDialogOpen,
    translationResult,
    setTranslationResult,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

/**
 * A custom hook to access the translation context.
 * Throws an error if used outside of a TranslationProvider.
 * @returns {TranslationContextState} The translation context state and setters.
 */
export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
