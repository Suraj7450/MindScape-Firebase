# **MindScape Application: Detailed Feature Documentation**

This document provides a comprehensive, page-by-page breakdown of every feature, button, and component in the MindScape application. It details the **what** (functionality), **why** (purpose), and **how** (implementation) of each element.

---

## **1. Home Page (`/`)**

The **Home Page** serves as the main landing screen — a central hub for initiating all mind map creation tasks.

### **Features & Components**

#### **1. Mind Map Generation Mode**

*   **What**: A two-button toggle (`Single Topic` / `Compare Concepts`) that switches the main input area.
*   **Why**: Provides two distinct starting points for mind map creation — exploring a single idea deeply or comparing two concepts.
*   **How**:
    *   Implemented in `src/app/page.tsx` using a React state variable (`generationMode`).
    *   Clicking updates the state to conditionally render one or two input fields.
    *   Displays a confirmation dialog if the user switches modes with entered text.

---

#### **2. Topic Input(s)**

*   **What**: Primary text field(s) where users enter their topic(s).
*   **Why**: Captures the user’s intent — the AI uses this input to generate the mind map.
*   **How**:
    *   Uses the `Input` component (`shadcn/ui`) with `react-hook-form` for form management.
    *   Validated via a `zod` schema (`formSchema`) to ensure the topic isn’t empty.
    *   On submission, topics are URL-encoded and passed to `/mindmap` as query parameters.

---

#### **3. Language Selection Dropdown**

*   **What**: Dropdown menu for selecting the output language.
*   **Why**: Makes the app accessible globally, enabling users to learn in their preferred language.
*   **How**:
    *   Uses `Select` from `shadcn/ui`.
    *   Populated from `src/lib/languages.ts`.
    *   The selected language code (e.g., `"es"`) is appended as a `lang` query parameter in the URL.

---

#### **4. Generate Mind Map / Generate Comparison Button**

*   **What**: The main call-to-action button to start mind map generation.
*   **Why**: Triggers the core functionality of AI-based mind map generation.
*   **How**:
    *   Acts as a form `submit` button.
    *   Executes `onSubmit` in `src/app/page.tsx`.
    *   Sets a loading state (`isGenerating`), updates search history, and navigates to `/mindmap` via `useRouter`.

---

#### **5. Vision Mode Button**

*   **What**: Button labeled **“Vision Mode”** with a `Paperclip` icon.
*   **Why**: Allows users to upload visual materials (images, PDFs, notes) to generate a mind map from existing content.
*   **How**:
    *   Linked to a hidden `<input type="file">`.
    *   `handleFileUpload` reads files via `FileReader` as a data URI.
    *   Data stored in `sessionStorage` with a unique `sessionId`.
    *   Redirects to `/mindmap?sessionId=<id>` where the AI processes the data.

---

#### **6. My Maps Button**

*   **What**: Navigation button linking to `/dashboard`.
*   **Why**: Provides quick access to a user’s saved mind maps.
*   **How**:
    *   Implemented as a Next.js `<Link>` within a `Button` component.

---

#### **7. MindGPT Button**

*   **What**: Navigation button linking to `/mind-gpt`.
*   **Why**: Offers a conversational way to build a mind map interactively with AI.
*   **How**:
    *   Implemented using a `<Link>` wrapped in a `Button`.

---

#### **8. Recent Searches**

*   **What**: Clickable buttons showing the user’s most recent search topics.
*   **Why**: Improves usability by allowing quick re-exploration of past topics.
*   **How**:
    *   Uses `useLocalStorage` hook for persistence.
    *   New topics are added to the `searchHistory` array.
    *   Displayed as clickable `Button` components that repopulate the form and trigger submission.

---

#### **9. AI Chat Assistant (Floating Button)**

*   **What**: Floating button that opens the `ChatPanel` component.
*   **Why**: Provides instant AI assistance for brainstorming or general questions.
*   **How**:
    *   Toggles a React state (`isChatOpen`) that controls the `ChatPanel`’s visibility.
    *   On the homepage, the panel’s topic prop is set to `"General Conversation"`.

---

## **2. Mind Map Page (`/mindmap`)**

This page is the **core visualization area**, where the generated mind map is displayed and interacted with.

### **Features & Components**

#### **1. Mind Map Visualization (Accordion Structure)**

*   **What**: Nested, collapsible accordions representing **Sub-Topics → Categories → Sub-Categories**.
*   **Why**: Offers a mobile-friendly, structured way to manage complex hierarchical data.
*   **How**:
    *   Implemented using `Accordion` components (`shadcn/ui`).
    *   Recursively maps the `data` prop (mind map JSON) to nested nodes.
    *   Uses dynamic icons from `lucide-react`.

---

#### **2. Toolbar Actions**

*   **What**: A group of buttons for global map actions (save, download, translate, etc.).
*   **Why**: Keeps key controls accessible and organized.
*   **How**:
    *   Built as a `div` of `Button` and `Select` components.
    *   Includes:
        *   **Language Select** → triggers `translateMindMapAction`.
        *   **Expand/Collapse All** → toggles `isAllExpanded`.
        *   **Save Map** → saves data to Firestore `/users/{userId}/mindmaps`.
        *   **Download PNG** → captures DOM using `html2canvas`.
        *   **Quiz Me** → opens `QuizDialog` via `generateQuizAction`.
        *   **View AI Content** → displays raw JSON in `AiContentDialog`.

---

#### **3. Node Interaction (Dropdown Menu)**

*   **What**: A contextual “More” (`...`) menu for each node.
*   **Why**: Enables direct, intuitive interaction with specific nodes.
*   **How**:
    *   Implemented via `DropdownMenu` (`shadcn/ui`).
    *   Options include:
        *   **Expand Further (Branching)** → triggers `generateMindMapAction`.
        *   **Give me examples** → calls `explainWithExampleAction`.
        *   **Explain in Chat** → opens `ChatPanel` with a pre-filled explanation prompt.

---

#### **4. Sub-Category Card Click**

*   **What**: Clicking a sub-category card opens an explanation dialog.
*   **Why**: Allows users to explore details interactively.
*   **How**:
    *   `onClick` calls `handleSubCategoryClick`, which triggers `explainNodeAction`.
    *   Displays AI-generated explanations based on difficulty level (Beginner / Intermediate / Expert).

---

#### **5. Breadcrumb Navigation**

*   **What**: Dropdown appearing when multiple maps exist in history.
*   **Why**: Lets users navigate backward through explored branches.
*   **How**:
    *   Uses `mindMaps` array in `src/app/mindmap/page.tsx`.
    *   Renders only when `mindMaps.length > 1`.
    *   Selecting a breadcrumb updates `activeMindMapIndex`.

---

## **3. MindGPT Page (`/mind-gpt`)**

A **conversational interface** where the user collaborates with AI to build a mind map step-by-step.

### **Features & Components**

*   **What**: Chat-based system where AI guides the user through questions to build a mind map.
*   **Why**: Offers a guided and user-friendly approach, ideal for those unsure where to start.
*   **How**:
    *   Managed in `src/app/mind-gpt/page.tsx` via a `messages` state.
    *   `handleSend` calls `conversationalMindMapAction` sending full chat history.
    *   AI returns questions and 2–4 clickable `suggestions`.
    *   Sending `"FINALIZE_MIND_MAP"` generates final JSON.
    *   JSON stored in `sessionStorage` and redirects to `/mindmap?from=mind-gpt`.

---

## **4. Dashboard Page (`/dashboard`)**

A **personal space** for authenticated users to access saved mind maps.

### **Features & Components**

*   **What**: Grid of cards showing user’s saved mind maps (protected route).
*   **Why**: Enables persistence and revisiting of prior work.
*   **How**:
    *   Uses `useUser` for authentication and `useCollection` for Firestore queries.
    *   Displays maps as `Card` components.
    *   **Open Map** → navigates to `/mindmap?mapId={id}`.
    *   **Delete Map** → triggers `AlertDialog` and deletes with Firebase `deleteDoc`.

---

## **5. Login Page (`/login`)**

A **unified authentication form** for both login and sign-up.

### **Features & Components**

*   **What**: A single form handling both sign-in and sign-up flows.
*   **Why**: Simplifies onboarding by detecting whether a user already exists.
*   **How**:
    *   Managed via `AuthForm` (`src/components/auth-form.tsx`).
    *   Attempts `signInWithEmailAndPassword`; on failure (`user-not-found`), toggles sign-up mode.
    *   In sign-up, calls `createUserWithEmailAndPassword` and updates `displayName` using `updateProfile`.

---

## **6. Shared Components & Features**

*   **Navbar**: Persistent header showing logo and user authentication status (reactive via `useUser`).
*   **Toaster (Notifications)**: Non-intrusive notification system using `sonner` and `useToast`.
*   **Text Selection Popover**: Detects text selections and displays a small “Translate” button.
*   **Translation Dialog**: Displays both original and translated text, allowing dynamic language switching and re-translation.
