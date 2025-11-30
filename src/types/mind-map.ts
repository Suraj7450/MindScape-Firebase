
export interface SubCategory {
  name: string;
  description: string;
  icon: string;
  tags: string[];
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

export interface MindMapData {
  topic: string;
  icon: string;
  subTopics: SubTopic[];
}
