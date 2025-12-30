
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
}

export interface SubTopic {
  name: string;
  icon: string;
  categories: Category[];
}

export interface MindMap {
  topic: string;
  shortTitle: string;
  icon: string;
  subTopics: SubTopic[];
  heroImages?: {
    left: string;
    right: string;
  };
  isSubMap?: boolean;
  parentMapId?: string;
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
  fullData?: MindMapWithId;
}

export type MindMapWithId = MindMap & {
  id?: string;
  uid?: string;
  userId?: string;
  isPublic?: boolean;
  originalAuthorId?: string;
  authorName?: string;
  lastPublishedAt?: Timestamp | number;
  unpublishedAt?: Timestamp | number;
  createdAt?: Timestamp | number;
  updatedAt?: Timestamp | number;
  summary?: string;
  thumbnailUrl?: string;
  thumbnailPrompt?: string;
  nestedExpansions?: NestedExpansionItem[];
  savedImages?: GeneratedImage[];
};

export type MindMapData = MindMapWithId;

export interface SubCategoryInfo {
  name: string;
  description: string;
}

export interface ExplainableNode {
  name: string;
  type: 'subTopic' | 'category';
}

export type ExplanationMode = 'Beginner' | 'Intermediate' | 'Expert';
