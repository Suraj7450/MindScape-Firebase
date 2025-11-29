
export type GenerationMode = 'single' | 'compare';

export interface SearchHistoryItem {
  mode: GenerationMode;
  topic1: string;
  topic2?: string;
  displayText: string;
  timestamp: number;
}
