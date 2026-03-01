# MindScape Technical Documentation

## 1. System Architecture

MindScape is built on a modern React stack utilizing the Next.js App Router paradigm. 

- **Frontend & Routing:** Next.js (`src/app`). Server components are used for initial layouts, while heavy interactivity (Canvas, Chat) relies on Client Components (`'use client'`).
- **Backend / API:** Next.js Server Actions (`src/app/actions.ts`) are heavily utilized to keep API keys and execution logic hidden securely on the server. There is also an API Route (`src/app/api/generate-image/route.ts`) dedicated to background image generation.
- **Global State Management:** Primarily driven by React Context API.
  - `FirebaseProvider`: Authentication and Firestore instances.
  - `AIConfigProvider`: User API key overrides and provider preferences.
  - `ActivityProvider`: Tracks AI status (idle, generating) globally.
  - `NotificationProvider`: Toasts and alerts.
- **Database:** Firebase Firestore.
- **Styling:** Tailwind CSS merged via `tailwind-merge` and `clsx`. UI components are built using Radix Primitives and Shadcn UI patterns. Flow animations are powered by `framer-motion`.

## 2. Firebase Database Schema & Security Rules

The database utilizes Firestore with the following root collections:

### `users/{userId}`
Stores private user data. Read/Write restricted to the owner (`request.auth.uid == userId`).
- **`settings/{settingId}`**: User preferences (e.g., API keys, theme).
- **`mindmaps/{mindmapId}`**: 
  - **Split Schema Design:** The main document stores *metadata* (topic, title, date, thumbnail, `hasSplitContent` flag).
  - **`content/tree` (Subcollection):** Stores the actual heavy JSON nested node structure. This optimizes initial list queries.
  - **`nodes/{nodeId}` (Subcollection):** Used for storing individual node data if the granularity demands it (Partially implemented/utilized based on schema rules).

### `publicMindmaps/{mindmapId}`
Published maps. 
- **Read:** Public (`true`).
- **Create:** Only authenticated users, must set themselves as `originalAuthorId`.
- **Update:** Author can update everything. Anyone (even unauthenticated) can increment `views`.
- **Delete:** Author OR Admin (`ykLjl8seAmc3DUevXHheLSIYety1`).

### `sharedMindmaps/{mindmapId}`
Unlisted maps accessible via direct URL link.
- **Read:** Public (`true`).
- **Create:** Authenticated users only.
- **Update:** Author only.
- **Delete:** Author OR Admin.

## 3. AI Engine Implementation

### Flow Execution (`src/app/actions.ts` & `src/ai/flows/`)
All generative requests trigger Server Actions.
1. `generateMindMapAction`
2. `generateMindMapFromTextAction`
3. `generateMindMapFromImageAction`
4. `generateComparisonMapAction`

These actions execute specific workflow files (`src/ai/flows/generate-mind-map.ts`), which construct highly specific prompt instructions (e.g., injecting persona criteria and strict JSON schema density formats).

### Dispatcher (`src/ai/client-dispatcher.ts`)
A central dispatcher pattern that abstracts the underlying LLM provider. 
- Currently routes specifically to `pollinations-client.ts`.
- Implements a retry wrapper (`generateContent`) that detects if the AI returned placeholder templates (e.g., "Subtopic Name") and auto-retries.

### Pollinations Client (`src/ai/pollinations-client.ts`)
The core wrapper around the Pollinations API.
- Implements Exponential Backoff retries.
- Extracts JSON payloads even if the AI wraps them in markdown backticks.
- Performs schema validation using `zod` (`AIGeneratedMindMapSchema`).

## 4. Key Frontend Components & Hooks

### `src/app/canvas/page.tsx`
The primary workspace client component. It acts as the controller for:
- Evaluating URL search parameters (map ids, generation topics, comparison topics).
- Invoking the `useMindMapStack` to handle sub-map breadcrumb navigation.
- Managing local generation states (Loaders vs Canvas).

### `ChatPanel` (`src/components/chat-panel.tsx`)
A complex slide-out panel that handles:
- **Sessions:** Maintains chat history offline via `hook/use-local-storage`.
- **Multi-modal parsing:** Converts local files into Text or Base64 (using `FileReader` and `pdfjs-dist`) to attach to AI prompts.
- **Quizzes:** Contains internal state logic to parse an AI-generated quiz block, grade user selections, track weak concept tags, and pass them back to the LLM for adaptive follow-up quizzes.
- **PDF Export:** Uses `jspdf` to compile chat transcripts into downloadable documents.

### `useMindMapPersistence` (`src/hooks/use-mind-map-persistence.ts`)
Handles Firestore persistence.
- Provides `setupAutoSave` with debouncing to prevent excessive writes.
- Performs the schema merge (Metadata + `content/tree`) seamlessly for the UI.
- Updates activity metrics like `totalStudyTime` and `lastActiveMapId`.

## 5. Known Limitations & Edge Cases

- Chat history is exclusively `localStorage`. If a user clears their browser cache or switches devices, chat sessions and quiz history are lost. (Labeled: *Partially Implemented Persistence*).
- System relies heavily on the Pollinations free-tier endpoints structure unless an API key overrides it. Heavy traffic could result in rate limits. The dispatcher catches some of this, but deep cascading failures are possible.
- Admin logic exists only at the Firestore Rules level. Codebase lacks an interface for the hardcoded Admin (`ykLjl8seAmc3DUevXHheLSIYety1`) to moderate standard content easily.