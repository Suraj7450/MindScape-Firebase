# **MindScape Application: Detailed Feature Documentation**

This document provides a comprehensive, page-by-page breakdown of every feature, button, and component in the MindScape application. It details the **what** (functionality), **why** (purpose), and **how** (implementation) of each element.

**Last Updated:** December 15, 2025

---

## **1. Home Page (`/`)**

The **Home Page** serves as the main landing screen — a central hub for initiating all mind map creation tasks.

### **Features & Components**

#### **1. Mind Map Generation Mode Toggle**

*   **What**: A two-button toggle (`Single Topic` / `Compare Concepts`) that switches the main input area.
*   **Why**: Provides two distinct starting points for mind map creation — exploring a single idea deeply or comparing two concepts side-by-side.
*   **How**:
    *   Implemented in `src/app/page.tsx` using a React state variable (`mode`).
    *   Uses Framer Motion for animated pill transition effect.
    *   Clicking updates the state to conditionally render one or two input fields.

---

#### **2. Topic Input(s)**

*   **What**: Primary text field(s) where users enter their topic(s).
*   **Why**: Captures the user's intent — the AI uses this input to generate the mind map.
*   **How**:
    *   Uses native `<input>` elements with Tailwind styling.
    *   Supports Enter key submission.
    *   In compare mode, shows two inputs with "VS" separator.
    *   Can serve as context input when a file is uploaded.

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
    *   Executes `handleGenerate` in `src/app/page.tsx`.
    *   Sets a loading state (`isGenerating`) and navigates to `/mindmap` with appropriate query parameters.
    *   Includes special handling for "MindScape" self-reference topic.

---

#### **5. Vision Mode (File Upload)**

*   **What**: Paperclip icon button allowing upload of images, PDFs, or text files.
*   **Why**: Allows users to upload visual materials or documents to generate a mind map from existing content.
*   **How**:
    *   Linked to a hidden `<input type="file">`.
    *   Accepts: `image/*`, `application/pdf`, `.txt`, `.md`
    *   For images: Reads file as data URI and stores in sessionStorage.
    *   For PDFs: Uses `pdfjs-dist` to extract text content client-side.
    *   For text files: Reads content directly.
    *   Redirects to `/mindmap?sessionId=<id>` where the AI processes the data.
    *   Shows uploaded file name as a badge with remove button.

---

#### **6. Feature Cards**

*   **What**: Three clickable cards showcasing key platform features.
*   **Why**: Provides quick access to main sections and educates users about capabilities.
*   **How**:
    *   Implemented in the `Features` component.
    *   Cards include: **My Maps** (→ `/dashboard`), **MindGPT** (→ `/mind-gpt`), **Public Maps** (→ `/public-maps`).
    *   Uses Framer Motion for scroll-triggered animations.
    *   Glassmorphism styling with hover effects.

---

#### **7. AI Chat Assistant (Floating Button)**

*   **What**: Floating sparkles button that opens the `ChatPanel` component.
*   **Why**: Provides instant AI assistance for brainstorming or general questions from anywhere.
*   **How**:
    *   Toggles a React state (`isChatOpen`) that controls the `ChatPanel`'s visibility.
    *   On the homepage, the panel's topic prop is set to `"General Conversation"`.
    *   Fixed positioned at bottom-right corner.

---

## **2. Mind Map Page (`/mindmap`)**

This page is the **core visualization area**, where the generated mind map is displayed and interacted with.

### **Query Parameters**
*   `topic` - Single topic generation
*   `topic1` & `topic2` - Comparison mode
*   `sessionId` - Vision mode (file upload)
*   `mapId` - Loading saved map
*   `from=mind-gpt` - Map generated from MindGPT
*   `selfReference=true` - MindScape self-reference mode
*   `lang` - Target language
*   `public=true` - Viewing public map

### **Features & Components**

#### **1. Mind Map Visualization (Accordion Structure)**

*   **What**: Nested, collapsible accordions representing **Sub-Topics → Categories → Sub-Categories**.
*   **Why**: Offers a mobile-friendly, structured way to manage complex hierarchical data.
*   **How**:
    *   Implemented using `Accordion` components from `shadcn/ui`.
    *   Recursively maps the mind map JSON to nested accordion items.
    *   Uses dynamic icons from `lucide-react` via `toPascalCase` helper.
    *   Sub-category cards displayed in responsive grid (1-4 columns based on screen size).

---

#### **2. Sub-Category Cards**

*   **What**: Interactive cards for each sub-category with icon, name, description, and tags.
*   **Why**: Primary interaction point for exploring individual concepts.
*   **How**:
    *   Implemented as `SubCategoryCard` memoized component.
    *   Clicking opens explanation dialog.
    *   Hover reveals action buttons.
    *   Features:
        *   **Expand Further** (GitBranch icon) - Creates nested expansion
        *   **Give me examples** (Pocket icon) - Opens example dialog
        *   **Generate Image** (Image icon) - Triggers AI image generation
        *   **Explain in Chat** (MessageCircle icon) - Sends to chat panel
        *   **Explore** arrow - Opens explanation dialog

---

#### **3. Toolbar Actions**

*   **What**: A horizontal scrollable toolbar with global map actions.
*   **Why**: Keeps key controls accessible and organized.
*   **How**:
    *   Built as a flex container of `Button` and `Select` components.
    *   Actions include:
        *   **Language Select** → triggers `translateMindMapAction`
        *   **Expand/Collapse All** → toggles all accordions
        *   **Regenerate** → regenerates the entire map (when applicable)
        *   **View AI Content** → displays raw JSON in `AiContentDialog`
        *   **Quiz Me** → opens `QuizDialog` via `generateQuizAction`
        *   **Save Map** → saves to Firestore `/users/{userId}/mindmaps`
        *   **Publish** → publishes to `/publicMindmaps`
        *   **Save to My Maps** (public view) → duplicates map
        *   **Share** (public view) → copies shareable link

---

#### **4. Comparison View**

*   **What**: Special side-by-side layout for comparison maps.
*   **Why**: Makes differences between two concepts immediately visible.
*   **How**:
    *   Triggered when sub-topic name is "Differences" with exactly 2 categories.
    *   Implemented as `ComparisonView` component.
    *   Shows cards with two-column layout, colored badges for each topic.
    *   Same interaction buttons available (expand, examples, chat).

---

#### **5. Explanation Dialog**

*   **What**: Modal dialog showing detailed AI explanation of a sub-category.
*   **Why**: Allows users to dive deep into specific concepts without leaving the map.
*   **How**:
    *   Implemented as `ExplanationDialog` component.
    *   Features:
        *   Difficulty mode toggle (Beginner/Intermediate/Expert)
        *   Bullet-point formatted explanations
        *   "Explain in Chat" button for further exploration
    *   Uses `explainNodeAction` server action.
    *   Mode persisted via `useLocalStorage` hook.

---

#### **6. Example Dialog**

*   **What**: Modal showing real-life examples for a node.
*   **Why**: Helps users understand concepts through practical applications.
*   **How**:
    *   Implemented as `ExampleDialog` component.
    *   Uses `explainWithExampleAction` server action.
    *   Supports regeneration and difficulty level changes.
    *   Content formatted with markdown-like styling.

---

#### **7. Quiz Dialog**

*   **What**: Interactive multiple-choice quiz generated from the mind map.
*   **Why**: Enables users to test their understanding of the visualized topic.
*   **How**:
    *   Implemented as `QuizDialog` component.
    *   Uses `generateQuizAction` server action.
    *   Features:
        *   Question-by-question progression
        *   Immediate correct/incorrect feedback
        *   Final score display
        *   Restart capability

---

#### **8. Nested Expansions System**

*   **What**: Inline expansion of sub-categories into deeper sub-topics.
*   **Why**: Allows infinite depth exploration without navigating to new pages.
*   **How**:
    *   Triggered by "Expand Further" button on sub-category cards.
    *   Uses `expandNodeAction` server action.
    *   Flow:
        1. Creates placeholder expansion with "generating" status **instantly** (Optimistic UI)
        2. Opens Nested Maps Dialog immediately
        3. Replaces placeholder with actual content when ready
        4. Shows error if generation fails
    *   State stored in `nestedExpansions` array.
    *   Auto-saves to Firestore when map is saved.

---

#### **9. Nested Maps Dialog**

*   **What**: Fullscreen dialog showing all inline expansions.
*   **Why**: Central location to view and manage all expanded content.
*   **How**:
    *   Implemented as `NestedMapsDialog` component.
    *   Accessible via floating FAB button (visible when expansions exist).
    *   Features:
        *   Collapsible expansion cards
        *   Each expansion shows sub-categories with tags
        *   Delete, regenerate, explain in chat actions
        *   "Expand Further" from within nested items (unlimited depth)
        *   Loading skeleton for generating items
        *   Depth indicator for each expansion

---

#### **10. AI Image Generation**

*   **What**: On-demand image creation for sub-category concepts.
*   **Why**: Provides visual aids to enhance understanding and retention.
*   **How**:
    *   Triggered by Image icon on sub-category cards.
    *   Uses `/api/generate-image` endpoint (Pollinations AI).
    *   Flow:
        1. Creates placeholder in gallery with "generating" status
        2. Shows progress toasts (enhancing prompt, connecting, generating, finalizing)
        3. Updates gallery with completed image
        4. Handles failures gracefully
    *   Auto-saves to Firestore with map.

---

#### **11. Image Gallery Dialog**

*   **What**: Collection of all generated images for the current map.
*   **Why**: Easy access to view, download, or regenerate generated images.
*   **How**:
    *   Implemented as `ImageGalleryDialog` component.
    *   Accessible via floating FAB button (visible when images exist).
    *   Features:
        *   Grid display of generated images
        *   Download functionality
        *   Regenerate capability
        *   Shows generating/failed status indicators

---

#### **12. Breadcrumb Navigation**

*   **What**: Dropdown for navigating between branched maps in a session.
*   **Why**: Allows users to backtrack through their exploration path.
*   **How**:
    *   Implemented as `BreadcrumbNavigation` component.
    *   Uses `mindMaps` array in page state.
    *   Renders only when `mindMaps.length > 1`.
    *   Selecting a breadcrumb updates `activeMindMapIndex`.

---

#### **13. Mode Badge**

*   **What**: Visual indicator showing the generation mode used.
*   **Why**: Provides context about how the map was created.
*   **How**:
    *   Shows different badges for: Single Topic, Compare, Vision (Image/Text), MindGPT, Saved Map.
    *   Color-coded for quick identification.

---

## **3. MindGPT Page (`/mind-gpt`)**

A **conversational interface** where the user collaborates with AI to build a mind map step-by-step.

### **Features & Components**

#### **1. Chat Interface**

*   **What**: Chat-based system where AI guides the user through questions to build a mind map.
*   **Why**: Offers a guided and user-friendly approach, ideal for those unsure where to start.
*   **How**:
    *   Managed in `src/app/mind-gpt/page.tsx` via a `messages` state.
    *   Starts with automated welcome message.
    *   Uses `conversationalMindMapAction` server action.

---

#### **2. Clickable Suggestions**

*   **What**: Quick-reply buttons suggested by the AI.
*   **Why**: Makes the conversation faster and provides inspiration.
*   **How**:
    *   AI returns 2-4 `suggestions` with each response.
    *   Clicking a suggestion sends it as user message.

---

#### **3. Finalization**

*   **What**: "Generate My Mind Map" button to complete the conversation.
*   **Why**: Converts the conversation into a structured mind map.
*   **How**:
    *   Sends special `"FINALIZE_MIND_MAP"` message.
    *   AI generates final JSON structure.
    *   JSON stored in `sessionStorage`.
    *   Redirects to `/mindmap?from=mind-gpt`.

---

## **4. AI Chat Panel (Global)**

A slide-out panel for AI conversation available throughout the app.

### **Features & Components**

#### **1. Chat View**

*   **What**: Main conversation interface with message history.
*   **Why**: Primary interaction area for conversing with AI.
*   **How**:
    *   Implemented as `ChatPanel` component.
    *   Uses `Sheet` from shadcn/ui for slide-out behavior.
    *   Auto-scrolls to latest message.
    *   Markdown formatting support via `formatText` utility.

---

#### **2. AI Personas**

*   **What**: Four selectable AI behavior modes.
*   **Why**: Tailors responses to different needs and preferences.
*   **How**:
    *   **Standard** (Sparkles) - Balanced, helpful responses
    *   **Teacher** (GraduationCap) - Educational, step-by-step explanations
    *   **Concise** (Zap) - Brief, to-the-point answers
    *   **Creative** (Palette) - Imaginative, exploratory responses
    *   Selection passed to `chatAction` server action.

---

#### **3. Voice Input**

*   **What**: Microphone button for speech-to-text input.
*   **Why**: Enables hands-free interaction with the AI.
*   **How**:
    *   Uses Web Speech API (`webkitSpeechRecognition`).
    *   Visual indicator when recording.
    *   Transcribed text inserted into input field.
    *   Graceful fallback if API unavailable.

---

#### **4. Session Management**

*   **What**: Chat history with topic-based sessions.
*   **Why**: Preserves conversations for future reference.
*   **How**:
    *   Sessions stored in `localStorage` via `useLocalStorage` hook.
    *   Each session has: ID, topic (AI-generated summary), messages, timestamp.
    *   History view shows all past sessions.
    *   Can delete individual sessions.

---

#### **5. PDF Export**

*   **What**: Export current chat to formatted PDF.
*   **Why**: Enables offline access and sharing of conversations.
*   **How**:
    *   Uses `jsPDF` library.
    *   Formatted with proper styling, headers, timestamps.
    *   Markdown and emoji cleaning for clean output.
    *   Downloads as `MindScape_Chat_<topic>.pdf`.

---

#### **6. Message Actions**

*   **What**: Per-message action buttons.
*   **Why**: Easy manipulation of individual responses.
*   **How**:
    *   **Copy** - Copies message to clipboard with feedback.
    *   **Regenerate** - Requests new response for same context.

---

## **5. Dashboard Page (`/dashboard`)**

A **personal space** for authenticated users to access saved mind maps.

### **Features & Components**

#### **1. Map Grid**

*   **What**: Responsive grid of saved mind map cards.
*   **Why**: Visual overview of all saved work.
*   **How**:
    *   Uses `useCollection` hook for Firestore queries.
    *   Protected route - redirects unauthenticated users.
    *   Cards show: thumbnail, topic, timestamp, summary.

---

#### **2. Search & Sort**

*   **What**: Search input and sort dropdown.
*   **Why**: Helps users find specific maps quickly.
*   **How**:
    *   Client-side filtering by topic name.
    *   Sort options: Most Recent, Oldest, Alphabetical.

---

#### **3. Map Card Actions**

*   **What**: Per-card action buttons.
*   **Why**: Quick access to common operations.
*   **How**:
    *   **View** (Eye) - Opens map in viewer
    *   **View Summary** (FileText) - Shows AI-generated summary dialog
    *   **Share/Publish** (Share2) - Publishes to public gallery
    *   **Delete** (Trash2) - Removes with confirmation

---

## **6. Public Maps Page (`/public-maps`)**

A gallery for community-shared mind maps.

### **Features & Components**

#### **1. Gallery View**

*   **What**: Grid of publicly published mind maps.
*   **Why**: Community knowledge sharing and discovery.
*   **How**:
    *   Reads from `/publicMindmaps` Firestore collection.
    *   Shows: thumbnail, topic, author name, timestamp, summary.

---

#### **2. Filters**

*   **What**: Toggle between all maps and user's published maps.
*   **Why**: Quick access to own published content.
*   **How**:
    *   **All Maps** - Shows entire public gallery.
    *   **My Published Maps** - Filters to current user's maps.

---

#### **3. Public Map Actions**

*   **What**: Actions available on public map cards.
*   **Why**: Interaction with community content.
*   **How**:
    *   **View** (Eye) - Opens map in public viewer mode
    *   **Save to My Maps** (Copy) - Duplicates to user's dashboard
    *   **Share** (Share2) - Copies shareable link
    *   **Unpublish** (Trash2) - Only for own maps, removes from gallery

---

## **7. Login Page (`/login`)**

A **Mind Entry Portal** featuring a premium, immersive authentication experience that communicates the app's value before sign-in.

### **Features & Components**

#### **1. Split Layout & Visualization**

*   **What**: A responsive two-column layout (on large screens) separating the visualization from the form.
*   **Why**: Tells a story about the product's value *before* the user signs in.
*   **How**:
    *   **Left Side (Desktop)**: Displays a central "Brain" icon with orbiting nodes animation, reinforcing the mind mapping concept. A particle constellation background adds depth and visual interest.
    *   **Hero Text**: "Visualize your thoughts" with explanations of the app's core value.
    *   **Feature Badges**: Highlights "Secure", "Private", "AI-Powered".
    *   **Mobile**: Stacks efficiently, hiding the heavier animations but keeping the hero text.
    *   Implemented in `src/app/login/page.tsx`.

---

#### **2. Enhanced Auth Form**

*   **What**: A glassmorphism-styled card handling both sign-in and sign-up.
*   **Why**: Provides a modern, high-trust interface for sensitive authentication.
*   **How**:
    *   **Component**: `AuthForm` (`src/components/auth-form.tsx`).
    *   **Unified Flow**: Toggles between Login and Sign Up based on user interaction or error codes (e.g., `user-not-found`).
    *   **Google Login**: One-click OAuth integration via `signInWithPopup`.
    *   **Password Reset**: Dedicated flow using `sendPasswordResetEmail` to send reset emails.
    *   **Visuals**: Deep violet/indigo gradients, backdrop blur (`bg-[#1a1a3e]/80 backdrop-blur-xl`), rounded corners, and smooth focus transitions with violet focus rings.
    *   **Form Fields**: Taller inputs (`h-14`) with custom styling for the dark theme.
    *   **CTA Button**: Gradient button (`from-violet-600 to-purple-600`) with shadow effects.

---

## **8. Profile Page (`/profile`)**
 
 A comprehensive user account management hub.
 
 ### **Features & Components**
 
 #### **1. User Info Card**
 
 *   **What**: Hero section displaying avatar, customizable display name, and email.
 *   **Why**: Personal identity and account management.
 *   **How**:
     *   **Inline Editing**: Click pencil icon to edit name. Saves to Firestore `users/{uid}` AND Firebase Auth `updateProfile`.
     *   Real-time sync to Navbar via onSnapshot.
 
 #### **2. Statistics Dashboard**
 
 *   **What**: Cards showing "Maps Created", "Quiz Questions Answered", and "Current Streak".
 *   **Why**: Gamifies the learning experience.
 *   **How**:
     *   Reads from `users/{uid}/statistics` + counts documents in `mindmaps` subcollection.
 
 #### **3. Achievements**
 
 *   **What**: Badges unlocked by milestones (e.g., "First Steps", "Week Warrior").
 *   **Why**: Rewards user engagement.
 *   **How**:
     *   Calculated dynamically based on stats (e.g., Streak >= 7 unlocks "Week Warrior").
     *   Displays locked (grayscale) vs unlocked (colored) states.
 
 #### **4. Preferences**
 
 *   **What**: Settings for "Default AI Persona" and "Preferred Language".
 *   **Why**: Customizes the app experience.
 *   **How**:
     *   Saves to `users/{uid}/preferences`.
     *   **AI Persona Sync**: Selected persona is auto-loaded when opening the Chat Panel.
 
 #### **5. Logout**
 
 *   **What**: Secure sign-out button.
 *   **Why**: Security.
 *   **How**:
     *   Calls `signOut(auth)` ensuring clean session interactions.
     *   Redirects to home.
 
 ---
 
 ## **9. Shared Components & Features**

### **Navbar**

*   **What**: Persistent header with logo and authentication status.
*   **Why**: Navigation and user account access.
*   **How**:
    *   Reactive via `useUser` hook from Firebase context.
    *   Shows login button or user avatar/dropdown based on auth state.

---

### **Toaster (Notifications)**

*   **What**: Non-intrusive notification system.
*   **Why**: User feedback for actions and errors.
*   **How**:
    *   Uses `sonner` toast library with custom `useToast` hook.
    *   Supports variants: default, destructive.
    *   Rich actions (buttons, images) in toasts.

---

### **Loading States**

*   **What**: Various loading indicators across the app.
*   **Why**: Visual feedback during async operations.
*   **How**:
    *   `GenerationLoading` component with animated brain icon.
    *   `PDFLoadingSkeleton` for file processing.
    *   Inline `Loader2` spinners on buttons.

---

## **10. AI Flows (Server Actions)**

All AI operations are implemented as server actions in `src/app/actions.ts`, calling flows defined in `src/ai/flows/`.

| Action | Flow | Purpose |
|--------|------|---------|
| `generateMindMapAction` | `generate-mind-map.ts` | Single topic mind map |
| `generateComparisonMapAction` | `generate-comparison-map.ts` | Two-topic comparison |
| `generateMindMapFromImageAction` | `generate-mind-map-from-image.ts` | Vision mode (images) |
| `generateMindMapFromTextAction` | `generate-mind-map-from-text.ts` | Vision mode (text/PDF) |
| `explainNodeAction` | `explain-mind-map-node.ts` | Node explanations |
| `explainWithExampleAction` | `explain-with-example.ts` | Real-life examples |
| `generateQuizAction` | `generate-quiz.ts` | Quiz generation |
| `chatAction` | `chat-with-assistant.ts` | Chat responses |
| `translateMindMapAction` | `translate-mind-map.ts` | Map translation |
| `translateTextAction` | `translate-text.ts` | Text selection translation |
| `conversationalMindMapAction` | `conversational-mind-map.ts` | MindGPT conversations |
| `summarizeMindMapAction` | `summarize-mind-map.ts` | Map summaries |
| `summarizeChatAction` | `summarize-chat.ts` | Chat topic generation |
| `expandNodeAction` | `expand-node.ts` | Nested expansions |
| `enhanceImagePromptAction` | `enhance-image-prompt.ts` | Image prompt enhancement |

---

## **11. Data Persistence**

### **Firestore Collections**

| Collection | Path | Description |
|------------|------|-------------|
| User Mind Maps | `/users/{userId}/mindmaps` | Private saved maps |
| Public Mind Maps | `/publicMindmaps` | Community gallery |

### **Local Storage**

| Key Pattern | Content |
|-------------|---------|
| `explanationMode` | Preferred difficulty level |
| `chatSessions` | Chat history |

### **Session Storage**

| Key Pattern | Content |
|-------------|---------|
| `session-content-{id}` | Uploaded file content |
| `session-type-{id}` | Content type (image/text) |
| `mindgpt-map` | MindGPT generated map |

---

## **12. API Endpoints**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/generate-image` | POST | AI image generation |

---

*This documentation reflects the application state as of December 15, 2025.*
