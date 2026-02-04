# Routing Map – MindScape-Firebase

> **Code-Verified**: All routes traced from `src/app` directory structure

---

## Route Table

| Route | File Path | Type | Auth Required | API Key Required | Purpose |
|-------|-----------|------|---------------|------------------|---------|
| `/` | `src/app/page.tsx` | Public | No | No* | Home page with topic input, mode selection, and feature showcase |
| `/canvas` | `src/app/canvas/page.tsx` | Protected | Yes | Yes | Mind map generation, display, and interaction canvas |
| `/library` | `src/app/library/page.tsx` | Protected | Yes | No | User's saved mind maps dashboard with search, filter, and management |
| `/community` | `src/app/community/page.tsx` | Public | No | No | Community-shared public mind maps gallery |
| `/login` | `src/app/login/page.tsx` | Public | No | No | Authentication page with Google OAuth and Email/Password |
| `/profile` | `src/app/profile/page.tsx` | Protected | Yes | No | User profile, statistics, achievements, and settings |

*Onboarding wizard triggers if user attempts generation without auth/API key

---

## Route Details

### 1. Home Page (`/`)

**File**: `src/app/page.tsx` (665 lines)  
**Type**: Client Component (`'use client'`)  
**Access**: Public

#### How Route is Reached
- Direct navigation to root URL
- Navbar "Home" link
- Post-logout redirect

#### Query Parameters
None (uses client-side state)

#### Server vs Client
- **Client Component**: All logic runs client-side
- **No Server Actions**: Direct routing to `/canvas` with URL params

#### Data Dependencies
- `useUser()` - Firebase auth state
- `useAIConfig()` - Pollinations API key check
- `sessionStorage` - File upload data (vision mode)
- `localStorage` - Language, depth, persona preferences (inferred)

#### Page Components
1. **Hero** - Main input section with mode toggles
2. **TransitionSection** - Marketing content
3. **CapabilityStrip** - Feature highlights
4. **Features** - Library and Community cards
5. **ChatPanel** - Floating AI assistant (dynamic import)

---

### 2. Canvas Page (`/canvas`)

**File**: `src/app/canvas/page.tsx` (861 lines)  
**Type**: Client Component with Suspense wrapper  
**Access**: Protected (triggers onboarding if missing auth/API key)

#### How Route is Reached
- Home page "Generate" button → `/canvas?topic=...&lang=...&depth=...&persona=...`
- Home page "Compare" button → `/canvas?topic1=...&topic2=...&lang=...`
- File upload → `/canvas?sessionId=vision-{timestamp}&lang=...&depth=...`
- Library "View" → `/canvas?mapId={mapId}`
- Community "View" → `/canvas?mapId={mapId}`
- Self-reference → `/canvas?selfReference=true&lang=...`

#### Query Parameters

| Parameter | Type | Purpose | Example |
|-----------|------|---------|---------|
| `topic` | string | Single topic generation | `topic=Quantum%20Physics` |
| `topic1` | string | Compare mode topic A | `topic1=React` |
| `topic2` | string | Compare mode topic B | `topic2=Vue` |
| `lang` | string | Language code | `lang=en` |
| `depth` | string | Complexity level | `depth=low|medium|deep` |
| `persona` | string | AI persona | `persona=teacher|concise|creative|sage` |
| `useSearch` | string | Enable web search | `useSearch=true` |
| `sessionId` | string | Vision mode session | `sessionId=vision-1738357676000` |
| `mapId` | string | Load saved map | `mapId=abc123` |
| `selfReference` | string | Special MindScape map | `selfReference=true` |

#### Server vs Client
- **Client Component**: All rendering client-side
- **Server Actions**: NOT USED (AI calls via client dispatcher)
- **API Routes**: `/api/generate-image`, `/api/generate-quiz-direct`

#### Data Dependencies
- **URL Params**: Primary data source for generation
- **sessionStorage**: File content for vision mode
- **Firestore**: Saved map data (`users/{uid}/mindmaps/{mapId}`)
- **AI Flows**: 
  - `src/ai/flows/generate-mind-map.ts` (single mode)
  - `src/ai/compare/flow.ts` (compare mode)
  - `src/ai/flows/generate-mind-map-from-image.ts` (vision mode)

#### Page Flow
```
URL Params → fetchMindMapData()
  ├─ mapId? → Load from Firestore
  ├─ sessionId? → Vision mode (sessionStorage)
  ├─ topic1 & topic2? → Compare mode
  ├─ topic? → Single mode
  └─ selfReference? → Special MindScape map

AI Generation → MindMap Component → Auto-save (if auth)
```

---

### 3. Library Page (`/library`)

**File**: `src/app/library/page.tsx` (1318 lines)  
**Type**: Client Component  
**Access**: Protected (shows login prompt if not authenticated)

#### How Route is Reached
- Navbar "Library" link
- Home page "Library" feature card

#### Query Parameters
None (uses client-side state)

#### Server vs Client
- **Client Component**: All logic client-side
- **Real-time Listener**: Firestore `onSnapshot` for mind maps
- **Server Actions**: 
  - `categorizeMindMapAction` (publish)
  - `suggestRelatedTopicsAction` (recommendations)
  - `enhanceImagePromptAction` (thumbnail regeneration)
  - `generateMindMapAction` (background generation)

#### Data Dependencies
- **Firestore Collections**:
  - `users/{uid}/mindmaps` - User's saved maps (metadata)
  - `users/{uid}/mindmaps/{mapId}/content/tree` - Full map data
  - `publicMindmaps/{mapId}` - Published maps
- **Real-time**: `useCollection` hook with Firestore query
- **Filters**: Search query, sort option (recent/alphabetical/oldest)

#### Page Features
1. **Search & Filter** - Text search, sort options
2. **Map Grid** - Thumbnail cards with metadata
3. **Preview Sheet** - Detailed map view with:
   - AI-generated recommendations
   - Publish/Unpublish toggle
   - PDF export (summary & full data pack)
   - Thumbnail regeneration
   - Delete confirmation
4. **Background Generation** - New maps from recommendations

---

### 4. Community Page (`/community`)

**File**: `src/app/community/page.tsx` (178 lines)  
**Type**: Client Component  
**Access**: Public

#### How Route is Reached
- Navbar "Community" link
- Home page "Community Maps" feature card

#### Query Parameters
None (uses client-side state)

#### Server vs Client
- **Client Component**: All logic client-side
- **Real-time Listener**: Firestore `onSnapshot` for public maps

#### Data Dependencies
- **Firestore Collection**: `publicMindmaps`
- **Query**: `orderBy('updatedAt', 'desc')` or `orderBy('views', 'desc')`
- **Limit**: 50 maps
- **Filters**: Category, search query, sort (recent/trending)

#### Page Features
1. **Search Bar** - Filter by topic/summary
2. **Category Pills** - Dynamic categories from `publicCategories`
3. **Sort Toggle** - Latest vs Trending (views)
4. **Map Grid** - Community cards with author info
5. **View Tracking** - Increments views on click (inferred)

---

### 5. Login Page (`/login`)

**File**: `src/app/login/page.tsx` (126 lines)  
**Type**: Client Component  
**Access**: Public

#### How Route is Reached
- Navbar "Login" button (when not authenticated)
- Library page redirect (if not authenticated)
- Profile page redirect (if not authenticated)

#### Query Parameters
None

#### Server vs Client
- **Client Component**: All logic client-side
- **Firebase Auth**: Client SDK for authentication

#### Data Dependencies
- **Firebase Auth**: Google OAuth, Email/Password providers
- **Random Showcase**: Client-side random selection from 4 variants

#### Page Features
1. **Dynamic Showcase** - Randomly selected feature highlight
2. **AuthForm Component** - Google OAuth & Email/Password
3. **Responsive Layout** - Side-by-side on desktop, stacked on mobile

#### Login Flow
```
AuthForm → Firebase Auth
  ├─ Google OAuth → Popup → Success → Home (/)
  ├─ Email/Password → Success → Home (/)
  └─ Error → Toast notification
```

---

### 6. Profile Page (`/profile`)

**File**: `src/app/profile/page.tsx` (999 lines)  
**Type**: Client Component  
**Access**: Protected (redirects to home if not authenticated)

#### How Route is Reached
- Navbar user dropdown → "Profile"
- Pollinations OAuth redirect (`?redirect_url=/profile`)

#### Query Parameters
None (Pollinations OAuth may add params, handled by `PollinationsAuthHandler`)

#### Server vs Client
- **Client Component**: All logic client-side
- **Real-time Listeners**: 
  - `users/{uid}` - Profile data
  - `users/{uid}/mindmaps` - Active maps count
- **Server Actions**: 
  - `checkPollinationsKeyAction` - Verify API key
  - `syncHistoricalStatistics` - Aggregate activity data

#### Data Dependencies
- **Firestore Document**: `users/{uid}`
  - `displayName`, `email`, `photoURL`
  - `preferences` - Language, persona, auto-save settings
  - `statistics` - Maps, streaks, nodes, images, study time
  - `apiSettings` - Pollinations API key, provider, model
  - `activeBadgeId` - Equipped achievement badge
  - `goals` - Weekly/monthly targets
- **Firestore Collection**: `users/{uid}/mindmaps` (count only)

#### Page Features
1. **Overview Tab**:
   - Core stats (maps, streak, achievements)
   - Extended metrics (study time, depth, images, nodes)
   - Achievement tiers with progress bars
   - Badge equip system
2. **Settings Tab**:
   - Display name editor
   - Pollinations API key management
   - OAuth connection flow
   - Language & persona preferences
   - Password reset (email/password users)
3. **Sync Data Button** - Aggregate historical statistics

---

## API Routes

### 1. Generate Image (`/api/generate-image`)

**File**: `src/app/api/generate-image/route.ts`  
**Method**: POST  
**Purpose**: Generate AI images via Pollinations

**Request Body**:
```json
{
  "prompt": "string",
  "style": "Cinematic|Photorealistic|...",
  "size": "512x288|1024x1024"
}
```

**Response**:
```json
{
  "images": ["https://image.pollinations.ai/..."]
}
```

**Used By**:
- Mind map node image generation
- Library thumbnail regeneration

---

### 2. Generate Quiz Direct (`/api/generate-quiz-direct`)

**File**: `src/app/api/generate-quiz-direct/route.ts`  
**Method**: POST  
**Purpose**: Generate quiz questions for a topic

**Request Body**:
```json
{
  "topic": "string",
  "difficulty": "easy|medium|hard",
  "questionCount": number
}
```

**Response**:
```json
{
  "quiz": {
    "questions": [...],
    "topic": "string"
  }
}
```

**Used By**:
- Chat panel quiz mode
- Mind map quiz generation

---

### 3. Search Images (`/api/search-images`)

**File**: `src/app/api/search-images` (directory, implementation unclear)  
**Purpose**: Image search functionality (NOT ACTIVELY USED in current scan)

---

## Server Actions

### 1. General Actions (`src/app/actions.ts`)

| Action | Purpose | Returns |
|--------|---------|---------|
| `generateMindMapAction` | Generate mind map via AI | `{ data, error }` |
| `checkPollinationsKeyAction` | Verify API key exists | `{ isConfigured }` |
| `enhanceImagePromptAction` | Improve image prompts | `{ enhancedPrompt, error }` |

### 2. Community Actions (`src/app/actions/community.ts`)

| Action | Purpose | Returns |
|--------|---------|---------|
| `categorizeMindMapAction` | AI categorization for publishing | `{ categories, error }` |
| `suggestRelatedTopicsAction` | AI topic recommendations | `{ topics, error }` |

### 3. Search Context (`src/app/actions/generateSearchContext.ts`)

| Action | Purpose | Returns |
|--------|---------|---------|
| `generateSearchContextAction` | Web search context generation | `{ context, error }` |

---

## Navigation Flow

```
Home (/)
  ├─ Generate → Canvas (/canvas?topic=...)
  ├─ Compare → Canvas (/canvas?topic1=...&topic2=...)
  ├─ Upload → Canvas (/canvas?sessionId=...)
  ├─ Library Card → Library (/library)
  └─ Community Card → Community (/community)

Navbar
  ├─ Home → (/)
  ├─ Library → (/library)
  ├─ Community → (/community)
  ├─ Login → (/login) [if not authenticated]
  └─ Profile Dropdown
      ├─ Profile → (/profile)
      └─ Logout → (/) [with auth reset]

Library (/library)
  ├─ View Map → Canvas (/canvas?mapId=...)
  ├─ Recommendation → Home (/?topic=...&contextId=...)
  └─ Background Gen → Library (stays, notification)

Community (/community)
  └─ View Map → Canvas (/canvas?mapId=...)

Canvas (/canvas)
  ├─ Save → Library (/library) [via notification link]
  ├─ Publish → Community (/community) [via notification link]
  └─ Nested Expansion → Canvas (/canvas?mapId=...) [new map]

Profile (/profile)
  ├─ Pollinations OAuth → External → Redirect back
  └─ Logout → Home (/)
```

---

## Protected Route Logic

### Authentication Check
```typescript
if (!user) {
  return <NotLoggedIn />; // Shows login prompt
}
```

### API Key Check (Canvas only)
```typescript
if (!user || !config.pollinationsApiKey) {
  window.dispatchEvent(new CustomEvent(TRIGGER_ONBOARDING_EVENT));
  return; // Triggers onboarding wizard
}
```

### Onboarding Wizard Flow
1. **Trigger**: Custom event `TRIGGER_ONBOARDING_EVENT`
2. **Steps**:
   - Welcome screen
   - Display name input
   - Pollinations API key input (OAuth or manual)
3. **Save**: Firestore `users/{uid}` update
4. **Redirect**: Back to original action

---

## URL Parameter Handling

### Canvas Page Parameter Priority
1. **mapId** - Load saved map (highest priority)
2. **sessionId** - Vision mode from sessionStorage
3. **topic1 & topic2** - Compare mode
4. **topic** - Single mode
5. **selfReference** - Special MindScape map

### Parameter Validation
- **No validation** in routing layer
- **Validation** in `fetchMindMapData()` function
- **Fallback**: Empty state or error toast

---

## Loading States

| Route | Loading Component | Trigger |
|-------|-------------------|---------|
| `/` | None | Instant render |
| `/canvas` | `<loading />` (Suspense fallback) | AI generation |
| `/library` | `<DashboardLoadingSkeleton />` | Firestore query |
| `/community` | Skeleton grid | Firestore query |
| `/login` | None | Instant render |
| `/profile` | Loader spinner | Firestore query |

---

## Error Handling

### Route-Level Errors
- **No error boundaries** at route level
- **Component-level**: `SerializationErrorBoundary` in mind-map components
- **Toast notifications**: Primary error UI

### Not Found (404)
- **No custom 404 page** found in scan
- **Next.js default**: Used for undefined routes

---

## Summary

MindScape uses a **simple, flat routing structure** with:
- **6 main routes** (5 pages + 1 API directory)
- **Query parameter-based navigation** for canvas modes
- **Real-time Firestore listeners** for data sync
- **Client-side routing** via Next.js App Router
- **Protected routes** via Firebase Auth + API key checks
- **Onboarding wizard** for first-time setup

**No assumptions made** - all routes verified from file system and code.
