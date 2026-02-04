# API Routes & Server Actions – MindScape-Firebase

> **Code-Verified**: All routes and actions traced from `src/app/api` and `src/ai/flows`

---

## API Routes

### 1. `/api/generate-image`

**File**: `src/app/api/generate-image/route.ts`  
**Method**: POST  
**Purpose**: Generate AI images using Pollinations API

#### Request
```typescript
{
  prompt: string;
  style?: string; // Default: 'photorealistic'
  provider?: string; // Default: 'pollinations'
}
```

#### Response
```typescript
{
  images: string[]; // Array of image URLs
}
```

#### Flow
```
POST /api/generate-image
  → Validate prompt (not empty)
  → Call Pollinations API
  → Return image URLs
```

#### Error Handling
- **400**: Missing prompt
- **500**: Image generation failed

---

### 2. `/api/generate-quiz-direct`

**File**: `src/app/api/generate-quiz-direct/route.ts`  
**Method**: POST  
**Purpose**: Generate interactive quizzes using Gemini AI

#### Request
```typescript
{
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number; // Default: 5
  apiKey?: string; // Optional, falls back to env
}
```

#### Response
```typescript
{
  quiz: {
    title: string;
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number; // Index of correct option
      explanation: string;
    }>;
  }
}
```

#### Flow
```
POST /api/generate-quiz-direct
  → Get API key (from request or env)
  → Call Gemini AI with quiz prompt
  → Parse structured output
  → Return quiz object
```

#### Error Handling
- **400**: Missing topic or invalid difficulty
- **500**: Quiz generation failed

---

### 3. `/api/search-images`

**File**: `src/app/api/search-images/route.ts`  
**Method**: GET  
**Purpose**: Search for images using Google Custom Search API

#### Request
```typescript
?query=string
```

#### Response
```typescript
{
  images: Array<{
    url: string;
    title: string;
    source: string;
  }>;
}
```

#### Flow
```
GET /api/search-images?query={query}
  → Call Google Custom Search API
  → Filter for image results
  → Return image URLs with metadata
```

#### Error Handling
- **400**: Missing query
- **500**: Search API failed

---

### 4. `/api/test-env`

**File**: `src/app/api/test-env/route.ts`  
**Method**: GET  
**Purpose**: Test environment variable configuration

#### Request
```typescript
// No parameters
```

#### Response
```typescript
{
  geminiConfigured: boolean;
  googleSearchConfigured: boolean;
}
```

#### Flow
```
GET /api/test-env
  → Check process.env.GEMINI_API_KEY
  → Check process.env.GOOGLE_SEARCH_API_KEY
  → Return configuration status
```

---

## Server Actions

All server actions are defined with `'use server'` directive and can be called from client components.

### Mind Map Generation

#### 1. `generateMindMapAction`
**File**: `src/ai/flows/generate-mind-map.ts`

**Purpose**: Generate a single-topic mind map

**Input**:
```typescript
{
  topic: string;
  language: string;
  depth: 'low' | 'medium' | 'deep';
  persona: 'teacher' | 'concise' | 'creative' | 'sage';
  apiKey?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: MindMapData;
  error?: string;
}
```

**Flow**:
```
generateMindMapAction()
  → Build Gemini prompt with persona + depth
  → Call Gemini AI with structured output schema
  → Parse response into MindMapData
  → Return result
```

---

#### 2. `generateComparisonMapAction`
**File**: `src/ai/flows/generate-comparison-map.ts`

**Purpose**: Generate comparison mind map for two topics

**Input**:
```typescript
{
  topic1: string;
  topic2: string;
  language: string;
  depth: 'low' | 'medium' | 'deep';
  persona: string;
  apiKey?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: MindMapData; // With compareDimensions
  error?: string;
}
```

**Flow**:
```
generateComparisonMapAction()
  → Build comparison prompt
  → Call Gemini AI with comparison schema
  → Parse dimensions and contrasts
  → Return comparison map
```

---

#### 3. `generateMindMapFromImageAction`
**File**: `src/ai/flows/generate-mind-map-from-image.ts`

**Purpose**: Extract concepts from image/PDF and generate mind map

**Input**:
```typescript
{
  imageDataUri: string; // Base64 data URI
  language: string;
  depth: 'low' | 'medium' | 'deep';
  apiKey?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: MindMapData;
  error?: string;
}
```

**Flow**:
```
generateMindMapFromImageAction()
  → Send image to Gemini Vision API
  → Extract key concepts
  → Generate mind map structure
  → Return result
```

---

#### 4. `generateMindMapFromTextAction`
**File**: `src/ai/flows/generate-mind-map-from-text.ts`

**Purpose**: Generate mind map from text content (TXT, MD files)

**Input**:
```typescript
{
  text: string;
  context?: string;
  language: string;
  depth: 'low' | 'medium' | 'deep';
  apiKey?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: MindMapData;
  error?: string;
}
```

---

### Node Expansion & Explanation

#### 5. `expandNode`
**File**: `src/ai/flows/expand-node.ts`

**Purpose**: Create nested mind map for a specific node

**Input**:
```typescript
{
  topic: string;
  nodeName: string;
  language: string;
  depth: 'low' | 'medium' | 'deep';
  apiKey?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: MindMapData; // Sub-map
  error?: string;
}
```

---

#### 6. `explainNodeAction`
**File**: `src/ai/flows/explain-mind-map-node.ts`

**Purpose**: Generate detailed explanation for a node

**Input**:
```typescript
{
  topic: string;
  nodeName: string;
  mode: 'simple' | 'intermediate' | 'expert';
  apiKey?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: string[]; // Array of explanation points
  error?: string;
}
```

---

#### 7. `explainWithExampleAction`
**File**: `src/ai/flows/explain-with-example.ts`

**Purpose**: Generate real-world example for a concept

**Input**:
```typescript
{
  topic: string;
  nodeName: string;
  mode: 'simple' | 'intermediate' | 'expert';
  apiKey?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: string; // Example text
  error?: string;
}
```

---

### Translation & Summarization

#### 8. `translateMindMapAction`
**File**: `src/ai/flows/translate-mind-map.ts`

**Purpose**: Translate entire mind map to target language

**Input**:
```typescript
{
  mindMapData: MindMapData;
  targetLanguage: string;
  apiKey?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: MindMapData; // Translated
  error?: string;
}
```

**Flow**:
```
translateMindMapAction()
  → Serialize mind map to JSON
  → Send to Gemini with translation prompt
  → Parse translated structure
  → Return translated map
```

---

#### 9. `summarizeTopicAction`
**File**: `src/ai/flows/summarize-topic.ts`

**Purpose**: Generate AI summary of mind map

**Input**:
```typescript
{
  mindMapData: MindMapData;
  apiKey?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: string; // Summary text
  error?: string;
}
```

---

#### 10. `summarizeChatAction`
**File**: `src/ai/flows/summarize-chat.ts`

**Purpose**: Summarize chat conversation

**Input**:
```typescript
{
  messages: ChatMessage[];
  apiKey?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: string; // Summary
  error?: string;
}
```

---

### Image & Recommendations

#### 11. `enhanceImagePromptAction`
**File**: `src/ai/flows/enhance-image-prompt.ts`

**Purpose**: Improve image generation prompt

**Input**:
```typescript
{
  prompt: string;
  style?: string;
  apiKey?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: string; // Enhanced prompt
  error?: string;
}
```

---

#### 12. `suggestRelatedTopicsAction`
**File**: `src/ai/flows/generate-related-questions.ts`

**Purpose**: Suggest related topics for exploration

**Input**:
```typescript
{
  topic: string;
  count?: number; // Default: 5
  apiKey?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: string[]; // Related topics
  error?: string;
}
```

---

#### 13. `categorizeMindMapAction`
**File**: `src/ai/flows/categorize-mind-map.ts`

**Purpose**: AI categorization for publishing

**Input**:
```typescript
{
  mindMapData: MindMapData;
  apiKey?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: string[]; // Categories (e.g., ['Science', 'Physics'])
  error?: string;
}
```

---

### Chat & Conversational

#### 14. `chatWithAssistantAction`
**File**: `src/ai/flows/chat-with-assistant.ts`

**Purpose**: Chat with AI assistant about mind map

**Input**:
```typescript
{
  messages: ChatMessage[];
  mindMapContext?: MindMapData;
  apiKey?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: string; // AI response
  error?: string;
}
```

---

#### 15. `conversationalMindMapAction`
**File**: `src/ai/flows/conversational-mind-map.ts`

**Purpose**: Generate mind map from conversational input

**Input**:
```typescript
{
  conversation: string;
  language: string;
  depth: 'low' | 'medium' | 'deep';
  apiKey?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: MindMapData;
  error?: string;
}
```

---

### Search Integration

#### 16. `generateSearchContextAction`
**File**: `src/app/actions/generateSearchContext.ts`

**Purpose**: Generate web search context for topic

**Input**:
```typescript
{
  topic: string;
  apiKey?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: {
    searchSources: SearchSource[];
    searchImages: SearchImage[];
  };
  error?: string;
}
```

**Flow**:
```
generateSearchContextAction()
  → Call Google Custom Search API
  → Extract snippets and images
  → Return search context
```

---

### Community Actions

#### 17. `publishMindMapAction`
**File**: `src/app/actions/community.ts`

**Purpose**: Publish mind map to community

**Input**:
```typescript
{
  mapId: string;
  userId: string;
  mindMapData: MindMapData;
}
```

**Output**:
```typescript
{
  success: boolean;
  error?: string;
}
```

**Flow**:
```
publishMindMapAction()
  → Call categorizeMindMapAction() for categories
  → Create document in publicMindmaps collection
  → Set isPublic = true in user's map
  → Return success
```

---

#### 18. `unpublishMindMapAction`
**File**: `src/app/actions/community.ts`

**Purpose**: Remove mind map from community

**Input**:
```typescript
{
  mapId: string;
  userId: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  error?: string;
}
```

**Flow**:
```
unpublishMindMapAction()
  → Delete from publicMindmaps collection
  → Set isPublic = false in user's map
  → Return success
```

---

## Common Patterns

### Error Handling
All server actions follow this pattern:
```typescript
try {
  // Action logic
  return { success: true, data: result };
} catch (error) {
  console.error('Action failed:', error);
  return { success: false, error: error.message };
}
```

### API Key Resolution
```typescript
const apiKey = providedApiKey || process.env.GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
```

### Structured Output
Most AI calls use Gemini's structured output mode:
```typescript
const result = await model.generateContent({
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: mindMapSchema
  }
});
```

---

## Rate Limiting

### Gemini API
- **Free tier**: 15 requests/minute
- **Paid tier**: 60 requests/minute

### Pollinations API
- **Free**: Unlimited (community-supported)

### Google Custom Search
- **Free tier**: 100 queries/day
- **Paid tier**: 10,000 queries/day

---

## Code References

### API Routes
- [generate-image/route.ts](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/app/api/generate-image/route.ts)
- [generate-quiz-direct/route.ts](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/app/api/generate-quiz-direct/route.ts)
- [search-images/route.ts](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/app/api/search-images/route.ts)
- [test-env/route.ts](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/app/api/test-env/route.ts)

### Server Actions
- [generate-mind-map.ts](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/ai/flows/generate-mind-map.ts)
- [generate-comparison-map.ts](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/ai/flows/generate-comparison-map.ts)
- [expand-node.ts](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/ai/flows/expand-node.ts)
- [explain-mind-map-node.ts](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/ai/flows/explain-mind-map-node.ts)
- [translate-mind-map.ts](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/ai/flows/translate-mind-map.ts)

---

## Summary

MindScape uses **4 API routes** and **18+ server actions** for:
- **Mind map generation**: Single, compare, vision, conversational modes
- **Node operations**: Expand, explain, examples
- **Translation**: Multi-language support
- **Image generation**: AI-powered visuals
- **Search integration**: Web context and images
- **Community features**: Publish/unpublish
- **Chat**: Conversational AI assistant

All actions use Gemini AI with structured output for reliability.
