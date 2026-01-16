
import { Timestamp } from 'firebase/firestore';

export interface SubCategory {
  name: string;
  description: string;
  icon: string;
  tags: string[];
  isExpanded: boolean;
  nestedExpansion?: {
    id: string;
    topic: string;
    icon: string;
    subCategories: any[];
    createdAt?: number;
  };
}

export interface Category {
  name: string;
  icon: string;
  subCategories: SubCategory[];
  insight?: string;
}

export interface SubTopic {
  name: string;
  icon: string;
  categories: Category[];
  insight?: string;
}

export interface MindMap {
  subTopics: SubTopic[];
  isSubMap?: boolean;
  parentMapId?: string;
}

export interface CompareNode {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  children?: CompareNode[];
  tags?: string[];
}

export interface CompareData {
  root: {
    title: string;
    description?: string;
    icon?: string;
  };
  similarities: CompareNode[];
  differences: {
    topicA: CompareNode[];
    topicB: CompareNode[];
  };
  relevantLinks: Array<{
    title: string;
    url: string;
    description?: string;
  }>;
  topicADeepDive: CompareNode[];
  topicBDeepDive: CompareNode[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  name: string;
  description: string;
  status: 'generating' | 'completed' | 'failed';
}

export interface NestedExpansionItem {
  id: string;
  parentName: string;
  topic: string;
  icon: string;
  subCategories: Array<{ name: string; description: string; icon: string; tags: string[] }>;
  createdAt: number;
  depth: number;
  path?: string;
  status?: 'generating' | 'completed' | 'failed';
  fullData?: MindMapData;
}

export interface BaseMindMapData {
  id?: string;
  topic: string;
  shortTitle?: string;
  icon?: string;
  uid?: string;
  userId?: string;
  createdAt?: Timestamp | number;
  updatedAt?: Timestamp | number;
  summary?: string;
  thumbnailUrl?: string;
  thumbnailPrompt?: string;
  explanations?: Record<string, string[]>;
  nestedExpansions?: NestedExpansionItem[];
  savedImages?: GeneratedImage[];
  isPublic?: boolean;
  publicCategories?: string[];
  views?: number;
  originalAuthorId?: string;
  authorName?: string;
  authorAvatar?: string;
  depth?: 'low' | 'medium' | 'deep';
}

export interface SingleMindMapData extends BaseMindMapData, MindMap {
  mode: 'single';
}

export interface CompareMindMapData extends BaseMindMapData {
  mode: 'compare';
  compareData: CompareData;
}

export type MindMapData = SingleMindMapData | CompareMindMapData;

export type MindMapWithId = MindMapData & { id: string };

export interface SubCategoryInfo {
  name: string;
  description: string;
}

export interface ExplainableNode {
  name: string;
  type: 'subTopic' | 'category';
}

export type ExplanationMode = 'Beginner' | 'Intermediate' | 'Expert';
