# MindScape — Product Requirements Document (PRD)

> **Generated from**: 100% codebase audit  
> **Date**: January 2025  
> **Application URL**: `mindscape-free.vercel.app`  
> **Framework**: Next.js 15 (App Router) + Tailwind CSS + Firebase

---

## 1. Product Overview

MindScape is a **web-based AI-powered mind map generation and knowledge exploration tool**. Users input a topic (text, file upload, or comparison pair), and the application generates a structured, multi-layered mind map using AI (Pollinations.ai API). Users can explore, expand, save, share, and export their mind maps.

### 1.1 Core Value Proposition (as implemented)
- AI-generated structured mind maps from any topic
- Infinite nested node expansion (sub-maps)
- Dual-topic comparison mind maps
- File-to-mindmap conversion (PDF, images, text)
- Community sharing and discovery
- User engagement via achievements and streaks

---

## 2. User Roles & Authentication

### 2.1 Authentication Methods
| Method | Implementation | File |
|--------|---------------|------|
| Email/Password | `createUserWithEmailAndPassword`, `signInWithEmailAndPassword` | `src/components/auth-form.tsx` |
| Google OAuth | `signInWithPopup` with `GoogleAuthProvider` | `src/components/auth-form.tsx` |
| Password Reset | `sendPasswordResetEmail` | `src/components/auth-form.tsx`, `src/app/profile/page.tsx` |

### 2.2 User Types (from Firestore Rules)
| Role | Definition | Source |
|------|-----------|--------|
| **Authenticated User** | `request.auth != null` | `firestore.rules:5-7` |
| **Owner** | `request.auth.uid == userId` | `firestore.rules:9-11` |
| **Admin** | Hardcoded UID: `ykLjl8seAmc3DUevXHheLSIYety1` | `firestore.rules:13-15` |
| **Anonymous Viewer** | Unauthenticated — can view public/shared maps, use homepage generation | Canvas page logic |

### 2.3 Access Control Matrix (from Firestore Rules)

| Collection | Read | Create | Update | Delete |
|-----------|------|--------|--------|--------|
| `users/{userId}` | Owner | Owner | Owner | Owner |
| `users/{userId}/mindmaps/{id}` | Owner or `isPublic==true` | Owner + `userId` match | Owner + `userId` match | Owner |
| `users/{userId}/mindmaps/{id}/content/{docId}` | Owner | Owner | Owner | Owner |
| `users/{userId}/settings/{id}` | Owner | Owner | Owner | Owner |
| `publicMindmaps/{id}` | **Anyone** | Signed-in + `originalAuthorId` match | Author (full) or anyone (`views` only) | Author or Admin |
| `sharedMindmaps/{id}` | **Anyone** | Signed-in + `originalAuthorId` match | Author only | Author or Admin |

---

## 3. Feature Inventory

### 3.1 Mind Map Generation

#### 3.1.1 Single Topic Generation
- **Input**: Topic string (text input on homepage Hero section)
- **Parameters**: `depth` (low/medium/deep), `persona` (teacher/concise/creative/sage), `useSearch` (boolean for web search context)
- **Output**: Structured `MindMapData` with `subTopics → categories → subCategories` hierarchy
- **Server Action**: `generateMindMapAction` → `src/app/actions.ts`
- **AI Flow**: `src/ai/flows/generate-mind-map.ts`
- **Schema Validation**: Zod schema in `src/ai/schemas/mind-map-schemas.ts`
- **Partial Salvage**: Accepts data with ≥4 subTopics if full validation fails

#### 3.1.2 Comparison Generation
- **Input**: Two topic strings (`topicA`, `topicB`)
- **Mode**: `compare`
- **Output**: `ComparisonMindMapData` with `unityNexus`, `dimensions`, `topicADeepDive`, `topicBDeepDive`, `relevantLinks`
- **Server Action**: `generateComparisonMindMapAction`
- **AI Flow**: `src/ai/flows/generate-comparison-mind-map.ts`

#### 3.1.3 File-Based Generation
- **Supported Formats**: Images (JPEG, PNG, GIF, WebP), PDF, Text files
- **Flow**: File → client-side parsing → `sessionStorage` → redirect to `/canvas?session=...` → server action
- **Image Processing**: `FileReader.readAsDataURL()` → base64 → inline in AI prompt
- **PDF Processing**: `pdfjs-dist` for text extraction
- **Server Action**: `generateFromFileAction`

#### 3.1.4 Nested Expansion (Sub-Maps)
- **Hook**: `useMindMapStack` (`src/hooks/use-mind-map-stack.ts`)
- **Behavior**: Click a node → generates a full sub-map for that subtopic → pushes to stack
- **Parent Auto-Save**: Parent map is automatically saved before sub-map creation if unsaved
- **Navigation**: Stack-based breadcrumb navigation between parent and child maps
- **Modes**: `foreground` (navigate immediately) or `background` (generate silently)
- **Persistence**: Sub-maps saved with `isSubMap: true` and `parentMapId` reference

### 3.2 AI Configuration

#### 3.2.1 Provider Architecture
- **Primary Provider**: Pollinations.ai (exclusively used)
- **Client**: `src/ai/pollinations-client.ts` (524 lines)
- **Dispatcher**: `src/ai/client-dispatcher.ts` (269 lines)
- **Supported Text Models**: `gemini-fast`, `openai`, `deepseek`, `sur`, `mistral`, `llama-vision`, `claude-hybridspace`, `gemini`, `qwen-coder`
- **Model Selection**: Based on `ModelCapability` enum (`fast`, `accurate`, `vision`, `reasoning`, `cheap`, `longContext`)
- **Resilience**: Retry with exponential backoff (3 retries, base delay 2s), model rotation on failure, circuit breaker (disables service after consecutive failures)

#### 3.2.2 API Key Resolution Chain
1. Explicit client-provided key (from `AIConfigContext`)
2. User's Firestore settings (`users/{uid}/apiSettings/pollinationsApiKey`)
3. Server environment variable (`POLLINATIONS_API_KEY`)

#### 3.2.3 User AI Settings (stored in Firestore `users/{uid}`)
| Setting | Type | Default |
|---------|------|---------|
| `provider` | `'pollinations'` | `'pollinations'` |
| `pollinationsApiKey` | string | empty |
| `pollinationsModel` | string | empty |

### 3.3 Mind Map Visualization & Interaction

#### 3.3.1 Core Component
- **File**: `src/components/mind-map.tsx` (1558 lines)
- **Features**:
  - Accordion-based hierarchical display of subTopics/categories/subCategories
  - Radial view mode (`MindMapRadialView`)
  - Compare view for comparison maps (`CompareView`)
  - Language translation (client-side via AI)
  - AI-powered node explanations (3 modes via `ExplanationMode`)
  - AI-powered examples for concepts
  - Practice question generation per topic
  - AI image generation per subcategory
  - Summary dialog (auto-triggered or manual)
  - Download as PNG image (`html-to-image`)
  - Breadcrumb navigation for sub-map stacks
  - Toolbar with save/expand/quiz/language controls

#### 3.3.2 Canvas Page (`/canvas`)
- **File**: `src/app/canvas/page.tsx` (1146 lines)
- **URL Parameters**: `mapId`, `publicMapId`, `sharedMapId`, `session`, `topic`, `depth`
- **Data Sources**: User's Firestore mindmaps, `publicMindmaps`, `sharedMindmaps`, or fresh generation
- **View Tracking**: Increments `views` counter on public maps for non-owners
- **Auto-Save**: Debounced 3-second auto-save via `useMindMapPersistence`
- **Chat Panel**: Dynamically imported `ChatPanel` for AI assistant (sidebar)
- **Regeneration Dialog**: Allows re-generating with different persona/depth settings

### 3.4 Mind Map Persistence

#### 3.4.1 Split Schema Architecture
- **Hook**: `useMindMapPersistence` (`src/hooks/use-mind-map-persistence.ts`, 372 lines)
- **Metadata Document**: `users/{uid}/mindmaps/{mapId}` — topic, summary, thumbnailUrl, mode, depth, timestamps, userId, isSubMap, parentMapId, isPublic, hasSplitContent
- **Content Document**: `users/{uid}/mindmaps/{mapId}/content/tree` — subTopics, compareData, nodes, edges
- **Rationale**: Separates lightweight metadata (for listing) from heavy content (for rendering)

#### 3.4.2 Thumbnail Generation
- **Trigger**: Background generation after every save if thumbnail is missing
- **API**: `/api/generate-image` (POST)
- **Default Model**: `flux` (or user's preferred model)
- **Person Detection**: Smart prompt modification for people vs. objects
- **Fallback**: Direct Pollinations URL if API route fails

#### 3.4.3 Real-Time Sync
- Firestore `onSnapshot` listeners on both metadata and content documents
- Conflict resolution: Remote update accepted if `updatedAt > localUpdatedAt`
- Pending write detection: Ignores `hasPendingWrites` snapshots

### 3.5 Library/Dashboard (`/library`)

- **File**: `src/app/library/page.tsx` (1464 lines)
- **Features**:
  - Grid display of saved mind maps (metadata only, content stripped for performance)
  - Search by topic name
  - Sort: Recent, Alphabetical, Oldest
  - Sub-map filtering (hidden from main list)
  - Delete with optimistic UI and Firestore permission error handling
  - Preview sheet with full content lazy-loading
  - AI-suggested related topics (via `suggestRelatedTopicsAction`)
  - Publish to community (with AI auto-categorization via `categorizeMindMapAction`)
  - Unpublish from community
  - PDF export (overview and detailed "Knowledge Pack")
  - Thumbnail regeneration
  - Image Lab (advanced image generation dialog)
  - Background map generation from recommendations
  - Share link copy

### 3.6 Community Hub (`/community`)

- **File**: `src/app/community/page.tsx` (178 lines)
- **Data Source**: `publicMindmaps` Firestore collection
- **Features**:
  - Browse public mind maps in grid layout
  - Search by topic/summary
  - Filter by AI-generated categories (dynamic from data)
  - Sort: Latest or Trending (by views)
  - Click to open in Canvas
  - Loading skeletons
- **Limit**: 50 maps per query

### 3.7 User Profile (`/profile`)

- **File**: `src/app/profile/page.tsx` (1148 lines)
- **Tabs**: Overview, Settings

#### 3.7.1 Overview Tab
- **Statistics Cards**: Maps Generated, Active Streak (with record), Tier Levels Unlocked
- **Extended Metrics**: Study Time, Depth Level (nested expansions), Visual Assets (images), Total Nodes
- **Achievement System ("Growth Path")**: 5 achievement categories × 3 tiers each:

| Category | Metric | Tier 1 | Tier 2 | Tier 3 |
|----------|--------|--------|--------|--------|
| Map Architect | Maps Created | 1 (Early Draft) | 10 (Cartographer) | 50 (Grand Architect) |
| Consistency King | Current Streak | 1 (Initiated) | 7 (Dedicated) | 30 (Unstoppable) |
| Knowledge Seeker | Total Nodes | 10 (Curious) | 100 (Scholar) | 500 (Sage) |
| AI Deep-Dive | Nested Expansions | 5 (Explorer) | 25 (Diver) | 100 (Master Diver) |
| Visual Learner | Images Generated | 1 (Artist) | 20 (Creator) | 100 (Visionary) |

- **Badge Equipping**: Users can equip unlocked tier badges as their profile badge

#### 3.7.2 Settings Tab
- Display name editing (syncs to Firebase Auth)
- Preferred language selector
- Default AI persona selector
- AI provider configuration (Pollinations)
- API key management with show/hide toggle
- Pollen balance checking (`checkPollenBalanceAction`)
- Image model preference (`ModelSelector` component)
- Password reset (for email/password users)
- Logout
- Data sync (historical statistics aggregation)

### 3.8 Activity & Engagement Tracking

#### 3.8.1 Activity Tracker (`src/lib/activity-tracker.ts`, 441 lines)
- **Tracked Metrics**: Maps created, nested expansions, images generated, study time (minutes), nodes created
- **Storage**: `users/{uid}/statistics/*` (aggregate) + `users/{uid}/activity/{date}/*` (daily breakdown)
- **Streak Logic**: Consecutive day tracking based on `lastActiveDate` comparison
- **Historical Sync**: One-time deep sync that scans all mindmaps collection, counts actual nodes from content documents, reconstructs streak from activity dates
- **Phantom Data Cleanup**: Handles legacy flat-field activity data format migration

#### 3.8.2 Study Time Tracking
- Automatic 5-minute interval timer in `useMindMapPersistence`
- Tracks as long as the hook is mounted (canvas page active)

#### 3.8.3 Separate Achievements Module (`src/lib/achievements.ts`, 229 lines)
- 15 achievements across 6 categories with bronze/silver/gold/platinum tiers
- Functions: `checkUnlockedAchievements`, `getNewlyUnlockedAchievements`, `getAchievementProgress`
- **Status**: **Implemented** — `updateUserStatistics()` checks for new achievements after every stats update, persists them to Firestore, and returns them to trigger user toast notifications.

### 3.9 AI Assistant Chat

- **Component**: `ChatPanel` (dynamically imported in Canvas)
- **Function**: Interactive AI chat assistant for explaining concepts within mind map context
- **Server Actions**: `chatWithAIAction`, `explainConceptAction`, `generateExampleAction`

### 3.10 Quiz Generation

- **API Route**: `/api/generate-quiz-direct/route.ts` (73 lines)
- **Model**: `mistral` via Pollinations.ai
- **Output**: 5-10 multiple-choice questions with explanations
- **Server Action**: `generateQuizAction` (in `src/app/actions.ts`)
- **UI**: Quiz dialog accessible from mind map toolbar

### 3.11 Image Generation

#### 3.11.1 API Route (`/api/generate-image`)
- **Models Available**: `flux`, `zimage`, `klein`, `klein-large`, `gptimage`
- **Style System**: 10 styles (anime, 3d-render, cyberpunk, minimalist, watercolor, pencil, polaroid, pop-art, oil-painting, pixel-art)
- **Composition Options**: close-up, wide-shot, bird-eye, macro, low-angle
- **Mood Options**: golden-hour, rainy, foggy, neon, mystical, nocturnal
- **Model Rotation**: On failure, rotates through `MODEL_ROTATION_ORDER` with 1.5s delay
- **Max Retries**: 3
- **Output**: Base64 data URL
- **GET endpoint**: Lists available models with pricing

### 3.12 Sharing System

| Type | Collection | Discoverability | Implementation Status |
|------|-----------|-----------------|----------------------|
| **Public** | `publicMindmaps` | Community Hub browsable | **Implemented** |
| **Shared (Unlisted)** | `sharedMindmaps` | Link-only access | **Implemented** — library card share button creates doc and copies unlisted URL |

### 3.13 Export & Download

| Format | Implementation | Source |
|--------|---------------|--------|
| PDF (Overview) | jsPDF with topic, metadata, AI recommendations | `library/page.tsx` |
| PDF (Knowledge Pack) | jsPDF with full content tree, recursive structure | `library/page.tsx` |
| PNG Image | `html-to-image` capture of mind map DOM | `mind-map.tsx` |
| JSON (Not Implemented) | Cannot be determined from the current codebase | — |

### 3.14 Notifications System

- **Context**: `NotificationProvider` (`src/contexts/notification-context.tsx`)
- **Storage**: In-memory React state (max 50 notifications)
- **Types**: `info`, `success`, `error`, `loading`
- **Features**: Add, update, mark read, mark all read, clear, unread count
- **Persistence**: **Implemented** — synced to `localStorage` key `mindscape-notifications` for cross-session persistence
- **UI**: Notification bell in Navbar

### 3.15 Onboarding & Changelog

- **OnboardingWizard**: Included in root layout, implementation details in separate component
- **ChangelogDialog**: Included in root layout, shows version updates to users

---

## 4. Technical Architecture

### 4.1 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Homepage with Hero
│   ├── canvas/page.tsx     # Mind map viewer/editor (1146 lines)
│   ├── library/page.tsx    # User's saved maps dashboard (1464 lines)
│   ├── community/page.tsx  # Public maps browser
│   ├── login/page.tsx      # Authentication page
│   ├── profile/page.tsx    # User profile & settings (1148 lines)
│   ├── changelog/page.tsx  # Changelog page
│   ├── actions.ts          # Server actions (AI generation)
│   ├── actions/community.ts # Community-specific server actions
│   └── api/                # API routes
│       ├── generate-image/ # Image generation
│       └── generate-quiz-direct/ # Quiz generation
├── ai/                     # AI integration layer
│   ├── pollinations-client.ts  # HTTP client (524 lines)
│   ├── client-dispatcher.ts    # Dispatch + resilience (269 lines)
│   ├── flows/              # Generation flow functions
│   ├── schemas/            # Zod validation schemas
│   └── search/             # Web search integration
├── components/             # React components
│   ├── mind-map.tsx        # Core mind map renderer (1558 lines)
│   ├── auth-form.tsx       # Login/signup form
│   ├── navbar.tsx          # Navigation bar
│   ├── chat-panel.tsx      # AI chat assistant
│   ├── hero.tsx            # Homepage hero section
│   ├── mind-map/           # Mind map sub-components
│   ├── canvas/             # Canvas-specific components
│   ├── community/          # Community components
│   └── ui/                 # Radix UI primitives
├── contexts/               # React Context providers
│   ├── ai-config-context.tsx
│   ├── activity-context.tsx
│   └── notification-context.tsx
├── firebase/               # Firebase configuration
│   ├── config.ts           # Firebase app init
│   ├── provider.tsx        # FirebaseProvider + hooks
│   └── client-provider.tsx # Client-side provider
├── hooks/                  # Custom React hooks
│   ├── use-mind-map-stack.ts      # Stack navigation
│   ├── use-mind-map-persistence.ts # Firestore persistence
│   ├── use-local-storage.ts       # Local storage hook
│   └── use-toast.ts               # Toast notifications
├── lib/                    # Utility functions
│   ├── activity-tracker.ts # User statistics tracking
│   ├── achievements.ts     # Achievement definitions
│   ├── languages.ts        # Language list
│   ├── utils.ts            # General utilities
│   ├── sanitize-firestore.ts # Data sanitization
│   └── firestore-helpers.ts # Firestore helper functions
└── types/                  # TypeScript type definitions
    └── mind-map.ts         # MindMapData interfaces
```

### 4.2 State Management

| Layer | Mechanism | Scope |
|-------|----------|-------|
| Global Auth | `FirebaseProvider` (React Context) | App-wide |
| AI Config | `AIConfigProvider` (React Context) + `useLocalStorage` + Firestore sync | App-wide |
| Activity Status | `ActivityProvider` (React Context) | App-wide |
| Notifications | `NotificationProvider` (React Context) | App-wide, in-memory |
| Mind Map Stack | `useMindMapStack` hook | Canvas page |
| Mind Map Persistence | `useMindMapPersistence` hook | Canvas page, Library page |
| Component State | `useState` / `useReducer` | Component-scoped |

### 4.3 Data Flow: Mind Map Generation

```
User Input (Hero) → URL params → Canvas Page
  → generateMindMapAction (Server Action)
    → resolveApiKey (explicit → Firestore → env)
    → dispatchToClient (client-dispatcher.ts)
      → PollinationsClient.generate() with retry/rotation/circuit-breaker
        → Pollinations.ai API (/v1/chat/completions)
    → Zod schema validation (partial salvage if ≥4 subTopics)
  → MindMapData returned to Canvas
  → useMindMapStack.replace(data)
  → useMindMapPersistence.saveMap() → Firestore (split schema)
  → Background thumbnail generation → /api/generate-image
```

### 4.4 Environment Variables

| Variable | Type | Usage |
|----------|------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Public | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Public | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Public | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Public | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Public | Firebase client config |
| `POLLINATIONS_API_KEY` | Server-only | Fallback API key for AI |

---

## 5. Database Schema (Firestore)

### 5.1 Collections

#### `users/{userId}`
```
{
  displayName: string,
  email: string,
  photoURL?: string,
  activeBadgeId?: string,   // e.g. "map_master:2"
  preferences: {
    preferredLanguage: string,
    defaultAIPersona: string,
    defaultExplanationMode?: string,
    autoGenerateImages?: boolean,
    defaultMapView?: string,
    autoSaveFrequency?: number,
  },
  statistics: {
    totalMapsCreated: number,
    totalNestedExpansions: number,
    totalImagesGenerated: number,
    totalStudyTimeMinutes: number,
    currentStreak: number,
    longestStreak: number,
    lastActiveDate: string,   // "YYYY-MM-DD"
    totalNodes?: number,
  },
  apiSettings?: {
    provider?: 'pollinations',
    pollinationsApiKey?: string,
    pollinationsModel?: string,
    imageProvider?: 'pollinations',
  },
  goals?: { weeklyMapGoal: number, monthlyMapGoal: number },
  activity: { [date: string]: { mapsCreated?, nestedExpansions?, imagesGenerated?, studyTimeMinutes?, nodesCreated? } },
  hasSyncedHistorical: boolean,
}
```

#### `users/{userId}/mindmaps/{mapId}` (Metadata)
```
{
  topic: string,
  shortTitle: string,
  summary: string,
  icon?: string,
  mode: 'single' | 'compare',
  depth?: 'low' | 'medium' | 'deep',
  userId: string,
  isPublic?: boolean,
  publicCategories?: string[],
  isSubMap?: boolean,
  parentMapId?: string,
  thumbnailUrl?: string,
  thumbnailPrompt?: string,
  hasSplitContent: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

#### `users/{userId}/mindmaps/{mapId}/content/tree` (Content)
```
{
  subTopics: SubTopic[],        // For single mode
  compareData?: ComparisonData, // For compare mode
  nodes?: any[],                // Legacy format
  edges?: any[],                // Legacy format
  updatedAt: Timestamp,
}
```

#### `publicMindmaps/{mapId}`
Full merged document (metadata + content) plus:
```
{
  originalMapId: string,
  originalAuthorId: string,
  authorName: string,
  authorAvatar: string,
  views: number,
  publicCategories: string[],
}
```

#### `sharedMindmaps/{mapId}`
Same structure as publicMindmaps but for unlisted/link-based sharing.

### 5.2 Data Hierarchy (Single Mode Mind Map)
```
MindMapData
├── topic, shortTitle, summary, icon, mode, depth
├── subTopics: SubTopic[]
│   ├── name, icon, description
│   └── categories: Category[]
│       ├── name, icon
│       └── subCategories: SubCategory[]
│           ├── name, description, isExpanded
│           └── (expandable to full sub-map)
├── nestedExpansions: NestedExpansionItem[]
└── practiceQuestions?: string[]
```

---

## 6. Security Considerations

| Area | Implementation |
|------|---------------|
| **Firestore Rules** | Owner-based access control; admin bypass for deletion; public maps readable by all |
| **Server Actions** | AI calls routed through server actions (not client-direct) |
| **API Key Storage** | Server env var as fallback; user keys stored in Firestore (Owner-only access via rules) |
| **Admin UID** | Hardcoded in Firestore rules (`ykLjl8seAmc3DUevXHheLSIYety1`) |
| **Input Validation** | Zod schema validation on AI responses; prompt sanitization in image generation |
| **CORS** | Handled by Next.js API routes |
| **Rate Limiting** | External API 429 error detection/retry implemented; internal limiting disabled |
| **Content Moderation** | Image API detects `moderation_blocked` errors from Pollinations |

---

## 7. Known Limitations & Gaps

| Item | Status | Details |
|------|--------|---------|
| Achievement unlock notifications | **Implemented** | `updateUserStatistics()` checks after every stats update, shows toast notifications |
| Notification persistence | **Implemented** | `NotificationProvider` syncs to `localStorage` key `mindscape-notifications` |
| User API key security | **Implemented** | Owner-only Firestore access (Accepted design choice) |
| Rate limiting | **Not Needed** | Internal limiting intentionally absent; external API 429 handling present |
| Shared map UI flow | **Implemented** | Library share button creates `sharedMindmaps` doc, copies unlisted URL |
| Bytez provider | **Removed** | All references removed from UI and configuration |
| Test suite | **Not Implemented** | No test files found in codebase |
| Collaborative editing | **Not Implemented** | Single-user ownership model |

---

## 8. Third-Party Dependencies

### 8.1 Core
| Package | Purpose |
|---------|---------|
| `next` (v15) | Framework |
| `react`, `react-dom` | UI library |
| `firebase` | Auth, Firestore |
| `tailwindcss` | Styling |

### 8.2 UI
| Package | Purpose |
|---------|---------|
| `@radix-ui/*` | Primitive UI components (accordion, dialog, select, tooltip, etc.) |
| `lucide-react` | Icon library |
| `framer-motion` | Animations |
| `class-variance-authority` | Component variant styling |
| `clsx`, `tailwind-merge` | Class name utilities |
| `embla-carousel-react` | Carousel component |
| `recharts` | Charts (usage: **Unclear from Code**) |
| `react-day-picker` | Date picker (usage: **Unclear from Code**) |

### 8.3 Functional
| Package | Purpose |
|---------|---------|
| `zod` | Schema validation for AI responses |
| `pdfjs-dist` | PDF text extraction |
| `html-to-image` | Mind map PNG export |
| `html2canvas` | Alternative canvas capture |
| `jspdf` | PDF generation |
| `date-fns` | Date formatting |

### 8.4 External APIs
| Service | Usage | Endpoint |
|---------|-------|----------|
| **Pollinations.ai** | Text generation (chat completions) | `https://gen.pollinations.ai/v1/chat/completions` |
| **Pollinations.ai** | Image generation | `https://gen.pollinations.ai/image/...` |
| **Pollinations.ai** | Balance checking | `https://api.pollinations.ai/v1/pollen/balance` |
| **Google Search API** | Web context for mind maps | `src/ai/search/google-search.ts` |
