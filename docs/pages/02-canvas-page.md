# Canvas Page (`/canvas`) – MindScape-Firebase

> **Code-Verified**: All elements traced from `src/app/canvas/page.tsx` (861 lines) and `src/components/mind-map.tsx` (1257 lines)

---

## Page Overview

**Route**: `/canvas`  
**File**: `src/app/canvas/page.tsx`  
**Type**: Client Component with Suspense  
**Access**: Protected (triggers onboarding if missing auth/API key)

### Purpose
Core mind map generation, visualization, and interaction interface. Handles all generation modes and provides rich editing capabilities.

### Page Architecture
```
MindMapPageContent
├─ Generation Logic (fetchMindMapData)
├─ MindMap Component
│  ├─ TopicHeader
│  ├─ MindMapToolbar
│  ├─ MindMapAccordion / MindMapRadialView
│  ├─ CompareView (compare mode)
│  └─ LeafNodeCard (individual nodes)
├─ SearchReferencesPanel (if web search used)
├─ ChatPanel (floating)
└─ Regeneration Dialog
```

---

## Generation Modes

### 1. Single Topic Mode
**Trigger**: `?topic={topic}&lang={lang}&depth={depth}&persona={persona}`

**Flow**:
```
URL params → generateMindMapAction()
  → AI generates structured mind map
  → Display in accordion/radial view
  → Auto-save to Firestore (if authenticated)
```

**Example**: `/canvas?topic=Quantum%20Physics&lang=en&depth=medium&persona=teacher`

---

### 2. Compare Mode
**Trigger**: `?topic1={topic1}&topic2={topic2}&lang={lang}&depth={depth}&persona={persona}`

**Flow**:
```
URL params → generateComparisonMapAction()
  → AI generates comparison dimensions
  → Display in CompareView component
  → Show side-by-side analysis
```

**Example**: `/canvas?topic1=React&topic2=Vue&lang=en&depth=low&persona=concise`

**Special Features**:
- Debate mode (AI clash between topics)
- Hybrid generation (fusion of both topics)
- Contrast quiz
- Dimension drill-down
- Timeline view

---

### 3. Vision Mode (Image/PDF)
**Trigger**: `?sessionId=vision-{timestamp}&lang={lang}&depth={depth}`

**Flow**:
```
sessionStorage → Read file content
  → generateMindMapFromImageAction() OR generateMindMapFromTextAction()
  → AI extracts concepts from visual/text
  → Display as mind map
  → Clear sessionStorage
```

**Supported Formats**: Images (JPEG, PNG), PDF, TXT, MD

---

### 4. Saved Map Mode
**Trigger**: `?mapId={mapId}`

**Flow**:
```
Firestore query: users/{uid}/mindmaps/{mapId}
  → Load metadata
  → If hasSplitContent: Load from content/tree subcollection
  → Load nested expansions (sub-maps)
  → Display with full edit capabilities
```

---

### 5. Self-Reference Mode
**Trigger**: `?selfReference=true&lang={lang}`

**Flow**:
```
Load hardcoded mindscapeMap from lib/mindscape-data.ts
  → Display special MindScape meta-map
  → Cannot regenerate (canRegenerate = false)
```

---

### 6. Regeneration Mode
**Trigger**: `?mapId={mapId}&_r={timestamp}&persona={persona}&depth={depth}`

**Flow**:
```
User clicks Regenerate → Dialog opens
  → Select new persona + depth
  → Add _r param to URL
  → Re-generate with new settings
  → Overwrite existing map in Firestore
```

---

## Interactive Elements

### Toolbar Actions

| Button | Icon | Action | Trigger | Result |
|--------|------|--------|---------|--------|
| **Save** | Save / Check | Manual save | Click | `onSaveMap()` → Firestore update |
| **Language** | Languages | Change language | Select | Translate entire map via AI |
| **Persona** | Bot | Change AI persona | Select | Update persona (affects future generations) |
| **Regenerate** | RefreshCw | Regenerate map | Click | Open regeneration dialog |
| **View Mode** | Minimize2 / Maximize2 | Toggle view | Click | Accordion ↔ Radial view |
| **Gallery** | Images | Open image gallery | Click | Show all generated images |
| **Summary** | FileText | View summary | Click | AI-generated topic summary |
| **Nested Maps** | Network | View sub-maps | Click | Show nested expansions dialog |
| **Share** | Share2 | Copy link | Click | Copy canvas URL to clipboard |
| **Publish** | UploadCloud | Publish to community | Click | Categorize + publish to `publicMindmaps` |
| **Duplicate** | Copy | Duplicate map | Click | Create copy in Firestore |
| **Download** | Download | Export options | Dropdown | PDF summary / Full data pack |

---

### Node-Level Actions

#### Sub-Topic Node
| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Expand Icon** | Button | Expand accordion | Click | Show categories |
| **Quiz Icon** | TestTube2 | Start quiz | Click | Open ChatPanel in quiz mode |
| **Explain Icon** | MessageCircle | Explain in chat | Click | Open ChatPanel with explanation prompt |

#### Category Node
| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Expand Icon** | Button | Expand accordion | Click | Show sub-categories |
| **Lightbulb Icon** | Lightbulb | Get explanation | Click | Open ExplanationDialog with AI explanation |

#### Sub-Category (Leaf) Node
| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Card Click** | Card | Get explanation | Click | Open ExplanationDialog |
| **Dropdown Menu** | MoreVertical | Show actions | Click | Explain / Example / Image / Expand |
| **Explain** | MessageCircle | Detailed explanation | Menu click | Open ExplanationDialog |
| **Example** | BookOpen | Get example | Menu click | Open ExampleDialog with real-world example |
| **Generate Image** | ImageIcon | Create visual | Menu click | AI image generation → Gallery |
| **Expand** | GitBranch | Create sub-map | Menu click | Generate nested mind map |

---

### Explanation Dialog

**Trigger**: Click on any leaf node or category

**Features**:
- **Mode Toggle**: Simple / Intermediate / Expert
- **Caching**: Explanations cached per node + mode
- **Chat Integration**: "Explain in Chat" button
- **Persistence**: Saved to Firestore in `explanations` field

**Flow**:
```
User clicks node
  → Check cache: explanations[{nodeName}-{mode}]
  → If cached: Display immediately
  → If not: explainNodeAction() → AI generates explanation
  → Save to cache → Display
```

---

### Example Dialog

**Trigger**: Dropdown menu → "Example"

**Features**:
- Real-world examples for concepts
- Mode-aware (Simple/Intermediate/Expert)
- Chat integration

**Flow**:
```
User clicks "Example"
  → explainWithExampleAction()
  → AI generates contextual example
  → Display in dialog
```

---

### Image Generation

**Trigger**: Dropdown menu → "Generate Image"

**Flow**:
```
User clicks "Generate Image"
  → enhanceImagePromptAction() (improve prompt)
  → POST /api/generate-image
  → Pollinations AI generates image
  → Add to generatedImages array
  → Save to Firestore savedImages field
  → Track activity: trackImageGenerated()
```

**Image Gallery**:
- View all generated images
- Download individual images
- Delete images
- Fullscreen preview

---

### Nested Expansion (Sub-Maps)

**Trigger**: Dropdown menu → "Expand" OR Compare mode → "Drill Down"

**Modes**:
- **Foreground**: Generate and immediately switch to sub-map
- **Background**: Generate silently, add to nested maps list

**Flow**:
```
User clicks "Expand"
  → Check if sub-map already exists (Firestore query)
  → If exists: Link to existing map
  → If not: expandNode() → Generate new map
  → Save as sub-map with parentMapId
  → Add to nestedExpansions array
  → Track activity: trackNestedExpansion()
```

**Nested Maps Dialog**:
- List all sub-maps for current topic
- Click to navigate to sub-map
- Shows topic, icon, timestamp, depth

---

### Compare Mode Special Actions

| Action | Icon | Purpose | Result |
|--------|------|---------|--------|
| **Start Debate** | MessageCircle | AI clash | ChatPanel with debate prompt |
| **Generate Hybrid** | GitBranch | Fusion concept | New mind map combining both topics |
| **Contrast Quiz** | TestTube2 | Interactive quiz | ChatPanel quiz mode |
| **Dimension Drill-Down** | Target | Deep dive | New map for specific dimension |
| **Show Timeline** | Clock | Historical view | Timeline mind map |
| **Mentor Roleplay** | GraduationCap | Project advice | ChatPanel with mentor persona |
| **Warp Perspective** | Palette | Creative view | Switch to Creative persona + regenerate |

---

## Data Flow

### Initial Load Flow
```
URL params → fetchMindMapData()
  ├─ mapId? → Load from Firestore
  │   ├─ Metadata: users/{uid}/mindmaps/{mapId}
  │   ├─ Content: users/{uid}/mindmaps/{mapId}/content/tree (if hasSplitContent)
  │   └─ Nested: Query where parentMapId == mapId
  ├─ sessionId? → Load from sessionStorage → AI generation
  ├─ topic1 & topic2? → Compare mode AI generation
  ├─ topic? → Single mode AI generation
  └─ selfReference? → Load hardcoded map
```

### Auto-Save Flow
```
User makes change → onUpdate() callback
  → handleUpdateCurrentMap() (debounced)
  → setupAutoSave() (3-second delay)
  → handleSaveMap()
  → Firestore update: users/{uid}/mindmaps/{mapId}
  → If large (>1MB): Split to content/tree subcollection
```

### Real-Time Sync Flow
```
Firestore listener: users/{uid}/mindmaps/{mapId}
  → onSnapshot() detects remote change
  → subscribeToMap() callback
  → handleUpdateCurrentMap()
  → UI updates automatically
```

---

## State Management

### URL Parameters
| Param | Type | Purpose | Example |
|-------|------|---------|---------|
| `topic` | string | Single topic | `Quantum Physics` |
| `topic1` | string | Compare topic A | `React` |
| `topic2` | string | Compare topic B | `Vue` |
| `lang` | string | Language code | `en`, `es`, `fr` |
| `depth` | string | Complexity | `low`, `medium`, `deep` |
| `persona` | string | AI style | `teacher`, `concise`, `creative`, `sage` |
| `useSearch` | string | Web search | `true` / `false` |
| `mapId` | string | Saved map ID | `abc123` |
| `sessionId` | string | Vision mode | `vision-1738357676000` |
| `selfReference` | string | MindScape map | `true` |
| `_r` | string | Regenerate flag | `1738357676000` |
| `parent` | string | Parent topic | For nested maps |

### Component State
| State | Type | Purpose |
|-------|------|---------|
| `mindMaps` | MindMapData[] | Stack of loaded maps |
| `activeMindMapIndex` | number | Current map in stack |
| `isLoading` | boolean | Generation in progress |
| `error` | string \| null | Error message |
| `generatingNodeId` | string \| null | Node being expanded |
| `hasUnsavedChanges` | boolean | Dirty flag for auto-save |
| `viewMode` | 'accordion' \| 'map' | Display mode |
| `openSubTopics` | string[] | Expanded accordion items |
| `generatedImages` | GeneratedImage[] | Image gallery |
| `nestedExpansions` | NestedExpansionItem[] | Sub-maps list |
| `explanations` | Record<string, string[]> | Cached explanations |

---

## Firestore Schema

### Mind Map Document
**Path**: `users/{uid}/mindmaps/{mapId}`

```typescript
{
  topic: string;
  summary?: string;
  mode: 'single' | 'compare';
  subTopics?: SubTopic[];
  compareDimensions?: CompareDimension[];
  savedImages?: GeneratedImage[];
  nestedExpansions?: NestedExpansionItem[];
  explanations?: Record<string, string[]>;
  searchSources?: SearchSource[];
  searchImages?: SearchImage[];
  searchTimestamp?: number;
  icon?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isPublic?: boolean;
  isSubMap?: boolean;
  parentMapId?: string;
  hasSplitContent?: boolean; // If true, load from content/tree
}
```

### Split Content Document (for large maps)
**Path**: `users/{uid}/mindmaps/{mapId}/content/tree`

```typescript
{
  subTopics?: SubTopic[];
  compareDimensions?: CompareDimension[];
  // Heavy data fields moved here
}
```

### Nested Map Reference
```typescript
interface NestedExpansionItem {
  id: string;
  topic: string;
  parentName: string;
  icon: string;
  status: 'completed' | 'generating';
  timestamp: number;
  fullData?: MindMapWithId;
  createdAt: number;
  depth: number;
  subCategories: any[];
}
```

---

## API Calls

### Server Actions

| Action | Purpose | Input | Output |
|--------|---------|-------|--------|
| `generateMindMapAction` | Generate single topic | topic, lang, depth, persona | MindMapData |
| `generateComparisonMapAction` | Generate comparison | topic1, topic2, lang, depth | MindMapData |
| `generateMindMapFromImageAction` | Vision mode (image/PDF) | imageDataUri, lang, depth | MindMapData |
| `generateMindMapFromTextAction` | Vision mode (text) | text, context, lang, depth | MindMapData |
| `translateMindMapAction` | Translate map | mindMapData, targetLang | Translated MindMapData |
| `explainNodeAction` | Explain concept | topic, node, mode | Explanation points |
| `explainWithExampleAction` | Get example | topic, node, mode | Example text |
| `summarizeTopicAction` | Generate summary | mindMapData | Summary text |
| `enhanceImagePromptAction` | Improve image prompt | prompt, style | Enhanced prompt |
| `categorizeMindMapAction` | Categorize for publishing | mindMapData | Categories array |

### API Routes

| Route | Method | Purpose | Input | Output |
|-------|--------|---------|-------|--------|
| `/api/generate-image` | POST | Generate AI image | prompt, style, provider | { images: [url] } |
| `/api/generate-quiz-direct` | POST | Generate quiz | topic, difficulty, count | { quiz: {...} } |

---

## User Flows

### Flow 1: First-Time Generation
```
1. User lands from home page with topic params
2. fetchMindMapData() detects topic param
3. Call generateMindMapAction()
4. AI generates mind map structure
5. Display in accordion view
6. Auto-save to Firestore (if authenticated)
7. Navigate to /canvas?mapId={savedId}
```

### Flow 2: Exploring a Node
```
1. User clicks sub-category card
2. ExplanationDialog opens
3. Check cache for explanation
4. If not cached: Call explainNodeAction()
5. Display explanation points
6. User can switch mode (Simple/Intermediate/Expert)
7. Each mode triggers new AI call (if not cached)
```

### Flow 3: Generating an Image
```
1. User clicks dropdown → "Generate Image"
2. Placeholder image added to gallery
3. Call enhanceImagePromptAction() to improve prompt
4. POST /api/generate-image
5. Pollinations AI generates image
6. Replace placeholder with real image
7. Save to Firestore savedImages
8. Track activity in user stats
```

### Flow 4: Creating a Sub-Map
```
1. User clicks dropdown → "Expand"
2. Check Firestore for existing sub-map
3. If exists: Link and navigate
4. If not: Call expandNode()
5. Generate new mind map via AI
6. Save with parentMapId reference
7. Add to nestedExpansions array
8. Show in Nested Maps dialog
9. User can click to navigate
```

### Flow 5: Publishing to Community
```
1. User clicks "Publish" button
2. Call categorizeMindMapAction() for AI categorization
3. AI returns suggested categories
4. Create document in publicMindmaps collection
5. Set isPublic = true in user's map
6. Toast: "Published successfully"
7. Map appears in /community page
```

### Flow 6: Translating a Map
```
1. User selects new language from dropdown
2. Call translateMindMapAction()
3. AI translates all text fields
4. Update map data via onUpdate()
5. Save to Firestore
6. UI re-renders with translated content
```

### Flow 7: Regenerating with New Settings
```
1. User clicks "Regenerate" button
2. Dialog opens with persona + depth selectors
3. User selects new settings
4. Add _r param to URL with timestamp
5. fetchMindMapData() detects regeneration
6. Call generateMindMapAction() with new settings
7. Overwrite existing map in Firestore
8. Display new version
```

---

## Error Handling

### Error States

| Error Type | Detection | Display | Actions |
|------------|-----------|---------|---------|
| **API Key Missing** | `error.includes('api key')` | Red error card | "Try Again" / "Go Home" |
| **Rate Limit** | `error.includes('rate limit')` | Red error card | "Try Again" / "Go Home" |
| **Structure Mismatch** | `error.includes('StructuredOutputError')` | Red error card | "Try Again" / "Go Home" |
| **Map Not Found** | `!result.data && mapId` | Error message | "Map not found or no permission" |
| **Generation Failed** | AI action returns error | Toast notification | Retry or fallback |

### Error Recovery
```
Try Again button → window.location.reload()
Go Home button → router.push('/')
```

---

## Performance Optimizations

### 1. Dynamic Imports
```typescript
const ChatPanel = dynamic(() => import('@/components/chat-panel'), {
  ssr: false,
  loading: () => null
});
```

### 2. Debounced Auto-Save
```typescript
setupAutoSave() → 3-second delay → Firestore update
```

### 3. Explanation Caching
```typescript
explanations[{nodeName}-{mode}] → Avoid redundant AI calls
```

### 4. Split Content for Large Maps
```typescript
if (dataSize > 1MB) → Save to content/tree subcollection
```

### 5. Optimistic UI Updates
```typescript
Add placeholder → Make API call → Replace with real data
```

### 6. Memoized Callbacks
```typescript
useMemo(), useCallback() for expensive operations
```

---

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate through nodes
- **Enter**: Expand/collapse accordions
- **Escape**: Close dialogs

### Screen Readers
- **ARIA labels**: All interactive elements
- **Semantic HTML**: Proper heading hierarchy
- **Focus management**: Dialogs trap focus

### Visual Indicators
- **Loading states**: Spinners, skeletons
- **Success states**: Check icons, green toasts
- **Error states**: Red borders, error icons

---

## Mobile Responsiveness

### Breakpoints
- **Mobile**: Single column, stacked layout
- **Tablet**: 2-column grid for nodes
- **Desktop**: Full toolbar, side-by-side compare

### Touch Optimizations
- **Large tap targets**: Minimum 44x44px
- **Swipe gestures**: None (avoid conflicts)
- **Scroll areas**: Custom scrollbars

---

## Code References

### Main Files
- [canvas/page.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/app/canvas/page.tsx) - Page wrapper
- [mind-map.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/components/mind-map.tsx) - Main component
- [mind-map-toolbar.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/components/mind-map/mind-map-toolbar.tsx) - Toolbar
- [mind-map-accordion.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/components/mind-map/mind-map-accordion.tsx) - Accordion view
- [compare-view.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/components/mind-map/compare-view.tsx) - Compare mode

### Key Hooks
- [use-mind-map-stack.ts](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/hooks/use-mind-map-stack.ts) - Stack management
- [use-mind-map-router.ts](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/hooks/use-mind-map-router.ts) - URL params
- [use-mind-map-persistence.ts](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/hooks/use-mind-map-persistence.ts) - Auto-save

---

## Summary

The Canvas page is the **core interface** of MindScape, featuring:
- **6 generation modes**: Single, Compare, Vision (image/PDF/text), Saved, Self-reference, Regeneration
- **Rich interactions**: Explanations, examples, images, sub-maps, quizzes
- **Real-time sync**: Firestore listeners for collaborative editing
- **Auto-save**: Debounced persistence with split content for large maps
- **AI-powered features**: Translation, summarization, categorization, image generation
- **Compare mode extras**: Debate, hybrid, timeline, mentor roleplay

All features are code-verified with no assumptions.
