# **MindScape: In-Depth Technical & Functional Documentation**

This document provides an exhaustive breakdown of the MindScape architecture, features, and implementation logic. It is designed for developers, architects, and power users who need to understand the internal mechanics of the platform.

**Version:** 3.0 (Omni-Flow Update)
**Last Updated:** December 26, 2025

---

## **1. Core System Architecture**

### **1.1. Technology Stack Selection**
*   **Framework**: Next.js 14+ with App Router (Server Components & Server Actions).
*   **State Management**: React `useState`, `useEffect`, and `useLocalStorage` for client-side persistence; `Firestore` for cross-device synchronization.
*   **Styling Engine**: Tailwind CSS with custom glassmorphism layers and backdrop-blur utilities.
*   **AI Orchestration**: Google Genkit (Gemini 1.5 Pro/Flash) for text; Pollinations AI for image generation and artistic enhancement.
*   **Animation**: Framer Motion (for staggered entrance and gesture-based interactions).
*   **Database**: Google Cloud Firestore (using `subcollections` for user data isolation).

### **1.2. The "Atomic State" Design Pattern**
To prevent **"Maximum Update Depth Exceeded"** errors common in complex controlled components (like Radix UI Selects), MindScape implements a "Split UI State" pattern:
1.  **UI State**: A local, immediate state (e.g., `languageUI`) that updates instantly when a user clicks.
2.  **Prop State**: The source of truth passed from the parent.
3.  **Effect Trigger**: A `useEffect` that monitors the UI State and triggers the expensive/async operation (like translation) only once per change.

---

## **2. Feature Breakdown: The Mind Map Engine**

### **2.1. Intelligent Generation Flows**
All Mind Map generation starts in `src/app/page.tsx` and routes through `src/app/actions.ts`.

#### **A. Generation Logic (`generate-mind-map.ts`)**
*   **Input**: A topic string and target language.
*   **Prompting Strategy**: Hardened system instructions that mandate a strict JSON schema including `icon` names (Lucide), `shortTitles`, and `subTopics`.
*   **Normalization**: If the LLM returns an object missing root properties, a **Normalization Layer** backfills them using the original input topic and default icons.

#### **B. Comparison Mode (`generate-comparison-map.ts`)**
*   **Logic**: Generates a map with a specific "Differences" sub-topic. 
*   **UI Mapping**: The `ComparisonView` component detects this specific structure and renders a side-by-side table with colored status badges for `Topic A` vs `Topic B`.

### **2.2. Interactive Exploration Layers**

#### **A. Deep Explanations (`explain-mind-map-node.ts`)**
*   **Requirement**: Must provide 5-7 high-quality points.
*   **Prompt Tuning**: Explicitly instructs the AI to cover definition, context, use cases, and relationship to the main topic.
*   **Fail-Safe**: If AI returns a raw string or malformed JSON, a multi-stage parser attempts to split by newline or extract points from generic "message" fields.

#### **B. Real-Life Examples (`explain-with-example.ts`)**
*   **Purpose**: Anchors abstract theory in reality.
*   **Precision**: Uses the requested "Mastery Level" (Beginner/Expert) to adjust the complexity of the analogy.

#### **C. Infinite Nested Expansions (`expand-node.ts`)**
*   **Implementation**: A recursive expansion system.
*   **User Experience**: 
    1.  User clicks "Expand Further".
    2.  An **Optimistic Node** (status: `generating`) is added to the `nestedExpansions` array immediately.
    3.  A floating FAB (Floating Action Button) updates its count and triggers the `NestedMapsDialog`.
    4.  The server action returns a `NestedExpansionOutput` which hydrates the placeholder.

---

## **3. Visual Systems: The Hero & The Gallery**

### **3.1. Cinematic Hero Backgrounds**
*   **Implementation**: Every map features a split-layout background image.
*   **Logic**:
    *   The `MindMap` component enhances the topic into an "artistic conceptual prompt."
    *   Pollinations AI generates two distinct seeds (Left/Right composition).
    *   **Visual Blending**: Uses `mask-image: linear-gradient` (Webkit) to fade images into the center and the dark theme background.
    *   **Settings**: Images set to `50% opacity` for a subtle, premium look.

### **3.2. AI Image Gallery**
*   **Trigger**: Sub-category card "Generate Image" button.
*   **Progressive Feedback**: Uses a custom "Progress Toast" stack that shows the exact stage of generation (Prompter -> Model -> Finalizer).
*   **Auto-Save**: Images are stored as an array of objects `{ url: string, prompt: string, status: 'ready' | 'generating' }` and heartbeat-saved to Firestore.

---

## **4. The Knowledge Verifier (Quiz System)**

### **4.1. Quiz Generation (`generate-quiz.ts`)**
*   **Content-Aware**: The quiz is generated *from* the currently loaded map data using a "Strict Serialized" JSON represention (via `toPlainObject`).
*   **Structure**: 5-10 multiple-choice questions with 4 options each and a detailed "Why" explanation for the correct answer index.
*   **Persistence**: Quizzes are ephemeral (not saved to DB) but can be re-generated on-the-fly for any saved map.

---

## **5. Data Management & Sync Logic**

### **5.1. Firestore Schema**
*   **User Document**: `/users/{uid}/`
    *   **Preferences**: Persona and Language settings.
    *   **Subcollection**: `mindmaps/`
        *   Contains full `MindMapSchema` JSON.
        *   Fields: `nestedExpansions[]`, `savedImages[]`, `topic`, `id`.

### **5.2. Debounced Auto-Save**
Changes to a map are handled via an `onUpdate` callback from the `MindMap` component. The parent page (`app/mindmap/page.tsx`) implements a **15-second debounce** logic:
*   Prevents excessive Firestore write costs.
*   Ensures asynchronous expansions are fully captured before sync.
*   Converts complex class-based Firestore objects into **Plain JavaScript Objects** to avoid Next.js serialization crashes.

---

## **6. Advanced Features: Conversational Builder (MindGPT)**

### **6.1. Guided Dialogue Flow**
*   **Technique**: State-aware chat history.
*   **Finalization**: When the threshold is reached or the user triggers the "FINALIZE" intent, the AI switches from "Chat Mode" to "Architect Mode," emitting a complete `MindMapSchema` JSON block.
*   **Redirection**: Data is temporarily stored in `sessionStorage` and passed to the viewer via a `sessionID`.

---

## **7. Export & Sharing**

### **7.1. PDF Orchestration**
*   **Chat Export**: Uses `jsPDF` to parse the `localStorage` chat history, applying formatting for User/AI roles and cleaning Markdown tags for a clean document.
*   **Image Gallery**: Currently supported via browser right-click save, with plans for a "Manifest Download."

---

*This documentation is maintained by the MindScape Engineering Team. It is the definitive source of truth for the system's internal logic.*
