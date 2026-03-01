# MindScape Product Requirements Document (PRD)

## 1. Product Overview
MindScape is an AI-powered educational and brainstorming application that dynamically generates multi-layered mind maps, quizzes, and chat interactions based on user prompts or uploaded files. The system heavily leverages Next.js, Firebase (Auth/Firestore), and the Pollinations.ai API to provide an interactive, real-time study and ideation canvas.

## 2. Core Constraints & Assumptions (Derived from Code)
- **Primary AI Provider:** Pollinations.ai (with fallback/user-provided API key support).
- **Storage:** Firebase Firestore with a split-schema for mind map data to optimize read/write performance.
- **Authentication:** Firebase Authentication.
- **Client/Server Split:** Next.js App Router leveraging React Server Components, Server Actions for AI generation, and Client Components for canvas interactivity.

## 3. Roles and Permissions
Based on `firestore.rules`:
- **Unauthenticated User:**
  - Can read `publicMindmaps` and `sharedMindmaps`.
  - CANNOT create maps, interact with chat sessions (assumed, as most actions require user context), or save data.
- **Authenticated User (Owner):**
  - Read/Write access to their own data in `users/{userId}` (settings, mindmaps, content, nodes).
  - Can create maps in `publicMindmaps` and `sharedMindmaps` (must be the original author).
  - Can Update/Delete their own public/shared maps.
- **Admin User (Hardcoded UID `ykLjl8seAmc3DUevXHheLSIYety1`):**
  - Can delete any `publicMindmaps` or `sharedMindmaps` regardless of author.
  - *Not Implemented / Unclear from Code:* No dedicated admin dashboard or UI is visible in the audited codebase.

## 4. Feature Requirements

### 4.1. Mind Map Generation (Core Engine)
- **Generation Modes:**
  - **Standard Text:** Generate from a single topic.
  - **Comparison:** Generate a map comparing two topics side-by-side (`topic1`, `topic2`).
  - **Vision/File Input:** Extract text/context from uploaded images (Base64), PDF documents (parsed via pdf.js), or text files to generate a map.
  - **Self-Reference (`isSelfReference`):** Specific hardcoded logic for generating a map about "Mindscape Core Architecture".
- **Generation Settings:**
  - **Depth (Granularity):**
    - `low`: 4-5 subTopics, 24-40 total items.
    - `medium`: 5 subTopics, 3 categories each, 5 subcategories each (75 items strictly enforced).
    - `deep`: 6 subTopics, 4-5 categories, 8-10 subcategories (~200 items, forces the AI capability to `reasoning`).
  - **Personas:** Affects AI generation style (Standard, Teacher, Concise, Creative, Sage).
  - **Language (`targetLang`):** Supports translating output to different languages.
  - **Search Context (`useSearch`):** Optional injection of live web search context into the generation prompt.

### 4.2. Interactive Canvas & Sub-Maps
- **Map Visualization:** Renders hierarchical data (Topic -> SubTopics -> Categories -> SubCategories).
- **Nested Maps (Infinite Expansion):** Users can click a node to generate and open a "Sub-Map" dynamically.
  - The UI tracks Map Hierarchy (Root Map -> Sub-Maps).
  - Users can delete or regenerate specific nested maps.
- **Map Persistence:** Real-time synchronization and debounced auto-saving to Firestore (`useMindMapPersistence` hook).

### 4.3. AI Chat Assistant (MindSpark)
- **Floating Chat Panel:** Accessible from the canvas. Let's users talk to the AI contextually.
- **History Management:** Chat sessions (`mindscape-chat-sessions`) are stored locally via `localStorage` (Not Implemented in Firestore).
- **Contextual Awareness:** Can send the current mind map state as context to the AI.
- **Attachments / Multi-modal Chat:** Users can attach Images, PDFs, and Text files to the chat prompts.
- **Related Questions:** AI generates follow-up question suggestions after an answer.
- **Export Feature:** Export the chat conversation as a PDF via `jspdf`.

### 4.4. Active Recall / Quizzes
- **Trigger:** Generated from the Chat panel for a specific topic or the current mind map.
- **Difficulty Levels:** Easy, Medium, Hard.
- **Assessment:**
  - tracks total score, correct answers, wrong answers.
  - calculates "Strong Areas" and "Weak Areas" based on concept tags.
- **Adaptive Regeneration:** Post-quiz, the AI prompts to generate a new quiz focusing specifically on the user's identified weak areas.

### 4.5. Gamification & Analytics
- **Study Tracking:** `useMindMapPersistence` tracks `studyTime` (increments session active time) and updates the user's document.
- **Streaks & Achievements:** Tracks login/creation streaks and awards badges (bronze, silver, gold, platinum).

### 4.6. Image/Thumbnail Generation
- **Thumbnails:** Background generation of map cover images using `app/api/generate-image/route.ts`.
- **Image Models:** Integrates with Pollinations.ai flux models with rotating endpoints for resilience.

## 5. Non-Functional Requirements & System Behaviors
- **API Resilience:** `client-dispatcher.ts` and `pollinations-client.ts` implement robust retry logic, exponential backoff, and model failover (`ai-health` hooks track provider status).
- **Data Schema:** "Split Schema" design. Metadata is loaded first, heavy JSON tree content is loaded on demand from a subcollection to satisfy Firestore document size limits and read speed.
- **API Key Fallback:** The application prioritizes user-defined API keys (from Settings) and falls back to Server Environment Variables.

## 6. Labeled Gaps & Uncertainties
- **Speech-to-Text (Chat):** `ChatPanel` contains `Mic` icons and `window.SpeechRecognition` typings, but the exact speech-to-speech feedback loop is *Partially Implemented* or entirely client-bound.
- **Admin Dashboard:** *Not Implemented*. Admin role exists in rules but no distinct admin routes were found.
- **Rate Limiting:** *Unclear from Code*. While Pollinations balance checking exists, standard Next.js rate limiting for DDOS protection is unconfirmed in the current audit.
- **Payment / Subscription:** *Not Implemented*. No Stripe or billing integrations were found. 
