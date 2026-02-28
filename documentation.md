# MindScape — Developer & Product Documentation

> **Generated from**: Comprehensive codebase audit (100% coverage)  
> **Stack**: Next.js 15 (App Router) · Tailwind CSS · Firebase (Auth + Firestore) · Pollinations.ai  
> **Deployment**: Vercel (`mindscape-free.vercel.app`)

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Architecture Overview](#2-architecture-overview)
3. [Pages & Routes](#3-pages--routes)
4. [AI System](#4-ai-system)
5. [Data Model](#5-data-model)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Core Hooks](#7-core-hooks)
8. [Context Providers](#8-context-providers)
9. [Server Actions](#9-server-actions)
10. [API Routes](#10-api-routes)
11. [Component Architecture](#11-component-architecture)
12. [Activity & Gamification](#12-activity--gamification)
13. [Deployment & Environment](#13-deployment--environment)
14. [Feature Status Matrix](#14-feature-status-matrix)

---

## 1. Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Firestore and Authentication enabled
- Pollinations.ai API key (optional — fallback uses server env var)

### Environment Setup
Create a `.env` file in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
POLLINATIONS_API_KEY=your_pollinations_key
```

### Run Locally
```bash
npm install
npm run dev
```
The application starts at `http://localhost:3000`.

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

---

## 2. Architecture Overview

### High-Level Data Flow

```
User Input → Hero / Canvas Page
  ↓
Server Actions (src/app/actions.ts)
  ↓
AI Client Dispatcher (src/ai/client-dispatcher.ts)
  ↓
Pollinations Client (src/ai/pollinations-client.ts)
  ↓
Pollinations.ai API → JSON Response
  ↓
Zod Schema Validation → MindMapData
  ↓
React State (useMindMapStack) → UI Rendering
  ↓
Firestore Persistence (useMindMapPersistence) → Split Schema Save
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Server Actions for AI** | Keeps API keys server-side; leverages Next.js App Router |
| **Split Schema (metadata/content)** | Enables fast dashboard listing without loading full mind map content |
| **Stack-based navigation** | Supports infinite nested expansion with breadcrumb history |
| **Circuit breaker pattern** | Prevents cascading failures when Pollinations.ai is degraded |
| **Debounced auto-save (3s)** | Balances data safety with Firestore write costs |
| **Background thumbnail generation** | Non-blocking UX; thumbnail generated after save completes |

---

## 3. Pages & Routes

| Route | File | Purpose | Auth Required |
|-------|------|---------|---------------|
| `/` | `src/app/page.tsx` | Homepage with Hero input | No |
| `/canvas` | `src/app/canvas/page.tsx` (1146 lines) | Mind map viewer/editor | No (but save requires auth) |
| `/library` | `src/app/library/page.tsx` (1464 lines) | User's saved maps dashboard | Yes |
| `/community` | `src/app/community/page.tsx` (178 lines) | Browse public mind maps | No |
| `/login` | `src/app/login/page.tsx` | Authentication | No |
| `/profile` | `src/app/profile/page.tsx` (1148 lines) | User profile & settings | Yes |
| `/changelog` | `src/app/changelog/page.tsx` | Version changelog | No |

### Canvas Page URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `mapId` | string | Load user's private map |
| `publicMapId` | string | Load from `publicMindmaps` collection |
| `sharedMapId` | string | Load from `sharedMindmaps` collection |
| `session` | string | Load file-upload session data from `sessionStorage` |
| `topic` | string | Generate fresh map for this topic |
| `depth` | `low\|medium\|deep` | Generation depth parameter |

---

## 4. AI System

### 4.1 Provider: Pollinations.ai

All AI interactions go through Pollinations.ai. The system uses the OpenAI-compatible chat completions endpoint.

**Endpoint**: `https://gen.pollinations.ai/v1/chat/completions`

### 4.2 Model Registry

#### Text Models (`src/ai/pollinations-client.ts`)

| Model | Capabilities | Primary Use |
|-------|-------------|-------------|
| `gemini-fast` | fast | Quick generation |
| `openai` | accurate | High-quality content |
| `deepseek` | reasoning | Complex analysis |
| `sur` | accurate | Alternative to openai |
| `mistral` | fast, cheap | Quiz generation, fallback |
| `llama-vision` | vision | File/image analysis |
| `claude-hybridspace` | accurate, longContext | Long-form content |
| `gemini` | accurate | Alternative generation |
| `qwen-coder` | fast, cheap | Lightweight tasks |

#### Image Models (`/api/generate-image`)

| Model | Cost/Image | Quality |
|-------|-----------|---------|
| `flux` | $0.0002 | High |
| `zimage` | $0.0002 | Fast |
| `klein` | $0.008 | Premium |
| `klein-large` | $0.012 | Ultra |
| `gptimage` | $0.0133 | Balanced |

### 4.3 Resilience Architecture

```
Request
  ↓
dispatchToClient() — circuit breaker check
  ↓
PollinationsClient.generate()
  ├── Attempt 1: Primary model
  ├── Attempt 2: Retry with backoff (if transient error)
  ├── Attempt 3: Model rotation (next model in list)
  └── Circuit breaker trips after N consecutive failures
  ↓
JSON Response
  ├── Valid JSON → Zod validation
  ├── Truncated JSON → attemptJsonRepair()
  └── Invalid → StructuredOutputError
```

### 4.4 API Key Resolution

Priority order:
1. **Explicit key** passed in request (from AI Config UI)
2. **User's Firestore settings** (`users/{uid}/apiSettings/pollinationsApiKey`)
3. **Server env var** (`POLLINATIONS_API_KEY`)

---

## 5. Data Model

### 5.1 Firestore Collections

```
Firestore
├── users/{userId}
│   ├── [user profile, preferences, statistics, activity]
│   ├── settings/{settingId}
│   │   └── [image generation settings, API keys]
│   └── mindmaps/{mapId}
│       ├── [metadata: topic, summary, mode, depth, timestamps, isPublic]
│       └── content/tree
│           └── [subTopics[], compareData, nodes[], edges[]]
├── publicMindmaps/{mapId}
│   └── [full merged map + authorName, views, publicCategories]
└── sharedMindmaps/{mapId}
    └── [full merged map + authorName, unlisted access]
```

### 5.2 Mind Map Data Structure (Single Mode)

```typescript
interface MindMapData {
  topic: string;
  shortTitle: string;
  summary: string;
  icon?: string;
  mode: 'single' | 'compare';
  depth?: 'low' | 'medium' | 'deep';
  subTopics: SubTopic[];
  nestedExpansions?: NestedExpansionItem[];
  practiceQuestions?: string[];
  // Persistence fields
  id?: string;
  userId?: string;
  isSubMap?: boolean;
  parentMapId?: string;
  thumbnailUrl?: string;
  isPublic?: boolean;
}

interface SubTopic {
  name: string;
  icon?: string;
  description?: string;
  categories: Category[];
}

interface Category {
  name: string;
  icon?: string;
  subCategories: SubCategory[];
}

interface SubCategory {
  name: string;
  description: string;
  isExpanded?: boolean;
}
```

### 5.3 Comparison Mode Data

```typescript
interface ComparisonMindMapData {
  topicA: string;
  topicB: string;
  unityNexus: { title: string; description: string }[];
  dimensions: { name: string; topicAInsight: string; topicBInsight: string }[];
  topicADeepDive: any[];
  topicBDeepDive: any[];
  relevantLinks: any[];
}
```

---

## 6. Authentication & Authorization

### 6.1 Auth Methods

| Method | Firebase API | UI Component |
|--------|-------------|--------------|
| Email/Password | `createUserWithEmailAndPassword` / `signInWithEmailAndPassword` | `AuthForm` |
| Google OAuth | `signInWithPopup` + `GoogleAuthProvider` | `AuthForm` |
| Password Reset | `sendPasswordResetEmail` | `AuthForm`, Profile page |

### 6.2 User Initialization

On first login, if no Firestore user document exists, `initializeUserProfile()` (`src/lib/activity-tracker.ts`) creates a default document with:
- Default preferences (language: `en`, persona: `Concise`, auto-generate images: `false`)
- Zero statistics with initial streak of 1
- Default goals (weekly: 5, monthly: 20)
- Empty activity/achievements/collections

### 6.3 Firestore Security Rules Summary

- **Private data**: Users can only read/write their own documents
- **Public maps**: Readable by anyone; creatable by authenticated users; updatable by author (full) or anyone (views increment only)
- **Shared maps**: Readable by anyone; writable by author only
- **Admin**: Single hardcoded UID can delete any public/shared map

---

## 7. Core Hooks

### 7.1 `useMindMapStack` (`src/hooks/use-mind-map-stack.ts`)

Manages a stack of mind maps for nested exploration.

```typescript
const {
  stack,           // MindMapData[] — all maps in the exploration chain
  activeIndex,     // Current position in stack
  currentMap,      // stack[activeIndex]
  status,          // 'idle' | 'generating' | 'syncing' | 'error'
  generatingNodeId,// ID of node being expanded
  push,            // Generate & add sub-map for a topic
  navigate,        // Switch to a different stack index
  update,          // Partial update current map
  replace,         // Full replace current map
  sync,            // Persist current map to Firestore
} = useMindMapStack({ expansionAdapter, persistenceAdapter });
```

### 7.2 `useMindMapPersistence` (`src/hooks/use-mind-map-persistence.ts`)

Handles Firestore read/write with split schema.

```typescript
const {
  aiPersona,       // Current AI persona preference
  updatePersona,   // Save persona to Firestore
  subscribeToMap,  // Real-time Firestore listener
  saveMap,         // Split-schema save (metadata + content)
  setupAutoSave,   // Debounced 3s auto-save
} = useMindMapPersistence({ onRemoteUpdate });
```

**Key behaviors:**
- Study time tracked every 5 minutes while hook is mounted
- Background thumbnail generation after save
- Circular reference protection in data cleaning
- Validates map has content before saving (≥1 subTopic or compareData)

---

## 8. Context Providers

### Provider Hierarchy (from `layout.tsx`)
```
<FirebaseProvider>
  <AIConfigProvider>
    <ActivityProvider>
      <NotificationProvider>
        <ThemeProvider>
          {/* App content */}
        </ThemeProvider>
      </NotificationProvider>
    </ActivityProvider>
  </AIConfigProvider>
</FirebaseProvider>
```

| Provider | Hook | Purpose |
|----------|------|---------|
| `FirebaseProvider` | `useUser()`, `useFirestore()`, `useAuth()` | Firebase instances & auth state |
| `AIConfigProvider` | `useAIConfig()` | AI provider settings, API keys, model selection |
| `ActivityProvider` | `useActivity()` | Current status (idle/generating), AI health status |
| `NotificationProvider` | `useNotifications()` | Notification queue with localStorage persistence (max 50) |

---

## 9. Server Actions

All server actions are defined in `src/app/actions.ts` and `src/app/actions/community.ts`.

| Action | Purpose | AI Flow |
|--------|---------|---------|
| `generateMindMapAction` | Single-topic mind map generation | `generate-mind-map.ts` |
| `generateComparisonMindMapAction` | Dual-topic comparison generation | `generate-comparison-mind-map.ts` |
| `generateFromFileAction` | File → mind map conversion | File-specific flow |
| `generateNestedMapAction` | Sub-map expansion for a node | Nested expansion flow |
| `explainConceptAction` | AI explanation of a concept | Explanation flow |
| `generateExampleAction` | Generate example for a concept | Example flow |
| `chatWithAIAction` | AI chat response | Chat flow |
| `generateQuizAction` | Quiz question generation | Quiz flow |
| `generatePracticeQuestionsAction` | Practice questions for a topic | Practice flow |
| `enhanceImagePromptAction` | Enhance image prompt with AI | Image prompt flow |
| `translateMindMapAction` | Translate mind map content | Translation flow |
| `generateSummaryAction` | Generate topic summary | Summary flow |
| `checkPollenBalanceAction` | Check Pollinations API credit balance | Direct API call |
| `categorizeMindMapAction` | AI-categorize map for community | Community action |
| `suggestRelatedTopicsAction` | Suggest related exploration topics | Community action |

---

## 10. API Routes

### `POST /api/generate-image`

Generates images via Pollinations.ai with style/mood/composition enhancement.

**Request Body:**
```json
{
  "prompt": "string (required)",
  "model": "flux|zimage|klein|klein-large|gptimage",
  "style": "anime|3d-render|cyberpunk|minimalist|...",
  "composition": "close-up|wide-shot|bird-eye|macro|low-angle",
  "mood": "golden-hour|rainy|foggy|neon|mystical|nocturnal",
  "width": 1024,
  "height": 1024,
  "userApiKey": "optional override key"
}
```

**Response:** `{ success: true, imageUrl: "data:image/...;base64,...", model, cost, quality }`

**Features:** Model rotation on failure (3 retries), style-aware prompt enhancement, person detection for portrait prompts.

### `GET /api/generate-image`

Returns list of available image models with pricing.

### `POST /api/generate-quiz-direct`

Generates multiple-choice quiz using Pollinations `mistral` model.

**Request:** `{ topic: string, difficulty: string }`  
**Response:** `{ success: true, data: { topic, difficulty, questions: [...] } }`

---

## 11. Component Architecture

### Key Components

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| `MindMap` | `src/components/mind-map.tsx` | 1558 | Core mind map renderer with all interaction features |
| `AuthForm` | `src/components/auth-form.tsx` | 303 | Login/signup/reset form |
| `ChatPanel` | `src/components/chat-panel.tsx` | — | AI chat sidebar (dynamically imported) |
| `Navbar` | `src/components/navbar.tsx` | — | Site navigation with notification bell |
| `Hero` | `src/components/hero.tsx` | — | Homepage input area with mode switching |
| `CommunityCard` | `src/components/community/community-card.tsx` | — | Public map card for community grid |
| `SummaryDialog` | `src/components/summary-dialog.tsx` | — | AI-generated summary modal |
| `MindMapToolbar` | `src/components/mind-map/mind-map-toolbar.tsx` | — | Action bar (save, quiz, language, etc.) |
| `CompareView` | `src/components/mind-map/compare-view.tsx` | — | Comparison mode renderer |
| `MindMapRadialView` | `src/components/mind-map/mind-map-radial-view.tsx` | — | Radial visualization mode |
| `BreadcrumbNavigation` | `src/components/breadcrumb-navigation.tsx` | — | Stack navigation breadcrumbs |
| `OnboardingWizard` | `src/components/onboarding-wizard.tsx` | — | First-time user onboarding |
| `ChangelogDialog` | `src/components/changelog-dialog.tsx` | — | Version update announcements |

### UI Library
- **Primitives**: Radix UI (`@radix-ui/react-*`)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Component variants**: `class-variance-authority`

---

## 12. Activity & Gamification

### 12.1 Tracked Metrics

| Metric | Tracking Function | Trigger |
|--------|------------------|---------|
| Maps Created | `trackMapCreated()` | New map first save |
| Nested Expansions | `trackNestedExpansion()` | Sub-map creation |
| Images Generated | `trackImageGenerated()` | AI image generation |
| Study Time | `trackStudyTime()` | 5-minute interval timer |
| Nodes Created | `trackNodesAdded()` | Map save with node count |

### 12.2 Streak System

- Tracked via `lastActiveDate` field (format: `YYYY-MM-DD`)
- Consecutive day → streak increments
- Gap > 1 day → streak resets to 1
- `longestStreak` preserved across resets
- Login tracking triggers streak update

### 12.3 Achievement System

Two parallel systems exist (potential redundancy):

1. **Profile Page Tiers** (`profile/page.tsx`): 5 × 3 = 15 achievement tiers, equippable as badges
2. **Achievements Module** (`lib/achievements.ts`): 15 achievements across 6 categories with 4 tiers (bronze/silver/gold/platinum)

**Status**: Achievement definitions exist and **automated unlock detection is active** — `updateUserStatistics()` calls `getNewlyUnlockedAchievements()` after every stats update, persists newly unlocked IDs to Firestore, and returns them for UI toast display.

---

## 13. Deployment & Environment

### 13.1 Build & Deploy
```bash
npm run build    # Production build
npm run dev      # Development server
```

Deployed to **Vercel** (inferred from `mindscape-free.vercel.app` references in PDF exports).

### 13.2 Firebase Configuration

```json
// firebase.json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

### 13.3 Key Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables |
| `firebase.json` | Firebase project config |
| `firestore.rules` | Firestore security rules |
| `next.config.ts` | Next.js configuration |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `tsconfig.json` | TypeScript configuration |
| `components.json` | shadcn/ui component configuration |

---

## 14. Feature Status Matrix

| Feature | Status | Evidence |
|---------|--------|----------|
| Single-topic mind map generation | ✅ Implemented | `generateMindMapAction`, canvas page |
| Comparison mind map generation | ✅ Implemented | `generateComparisonMindMapAction`, compare-view |
| File upload to mind map | ✅ Implemented | Hero section file handling, `generateFromFileAction` |
| Nested sub-map expansion | ✅ Implemented | `useMindMapStack.push()`, breadcrumb navigation |
| Auto-save to Firestore | ✅ Implemented | `useMindMapPersistence`, 3s debounce |
| Real-time Firestore sync | ✅ Implemented | `onSnapshot` listeners in persistence hook |
| Community publishing | ✅ Implemented | `handlePublish` / `handleUnpublish` in library |
| Community browsing | ✅ Implemented | Community page with search/filter/sort |
| AI chat assistant | ✅ Implemented | `ChatPanel`, `chatWithAIAction` |
| Quiz generation | ✅ Implemented | API route + server action |
| AI image generation | ✅ Implemented | `/api/generate-image`, 5 models, 10 styles |
| PDF export | ✅ Implemented | jsPDF in library page (overview + knowledge pack) |
| PNG export | ✅ Implemented | `html-to-image` in mind-map component |
| User profile & statistics | ✅ Implemented | Profile page with real-time Firestore sync |
| Achievement badges | ✅ Implemented | Equippable badges in profile via `equipBadge()` |
| Login streak tracking | ✅ Implemented | `trackLogin()`, daily streak calculation |
| Study time tracking | ✅ Implemented | 5-minute interval in persistence hook |
| API key management | ✅ Implemented | Profile settings, Firestore storage |
| Pollen balance checking | ✅ Implemented | `checkPollenBalanceAction` on profile |
| Shared maps (unlisted links) | ✅ Implemented | Library share button creates `sharedMindmaps` doc, copies unlisted URL to clipboard |
| Achievement unlock notifications | ✅ Implemented | `updateUserStatistics()` checks after every stats update, shows toast notifications |
| Notification persistence | ✅ Implemented | `NotificationProvider` syncs to `localStorage` key `mindscape-notifications` |
| External API error handling | ✅ Implemented | 429 error detection and retry logic in `client-dispatcher.ts` |
| API key security | ✅ Implemented | Stored in Firestore with owner-only access rules (intentional design choice) |
| Offline support | ❌ Not Implemented | Requires active connection |
| Automated tests | ❌ Not Implemented | No test files found |

---

*This documentation was generated by auditing 100% of the MindScape codebase. All claims are traceable to specific source files.*
 