# Page-Wise Features and Workflows

This document provides an atomized breakdown of every route in the MindScape project, based strictly on the current codebase implementation.

---

--------------------------------------------------
PAGE: / (Home Page)
--------------------------------------------------

1. **Purpose**
   - Serves as the primary landing page and entry point for mind map generation.
   - Provides a centralized UI for users to start new "thoughts" via text input or file uploads (Image, PDF, Text).

2. **Entry Conditions**
   - **Auth required?**: No (Publicly accessible).

3. **UI Components Used**
   - `Hero` (Internal - `src/app/page.tsx`)
   - `Features` (Internal - `src/app/page.tsx`)
   - `TransitionSection` (Internal - `src/app/page.tsx`)
   - `CapabilityStrip` (Internal - `src/app/page.tsx`)
   - `ChatPanel` (Dynamic - `src/components/chat-panel.tsx`)
   - `Badge` (`src/components/ui/badge.tsx`)
   - `Select` (`src/components/ui/select.tsx`)
   - `Button` (`src/components/ui/button.tsx`)
   - `Tooltip` (`src/components/ui/tooltip.tsx`)

4. **User Actions**
   - **Type Topic**: Enter text in the main input field.
   - **File Upload**: Click the paperclip icon to upload Image, PDF, or Text files.
   - **Select Language**: Change the target language for generation via the dropdown.
   - **Generate**: Submit the topic/file to trigger redirection to the canvas.
   - **Open Chat**: Click the floating action button (FAB) to open the AI assistant.
   - **Navigation**: Click feature cards to navigate to `/library` or `/community`.

5. **AI Interactions**
   - AI interactions are initiated by redirecting to `/canvas` with specific query parameters.
   - File processing (Vision Mode) uses `pdfjs-dist` for client-side PDF parsing and `FileReader` for images/text.

6. **Firestore Interactions**
   - **Read**: None directly on this page.
   - **Write**: None directly on this page.

7. **State Management**
   - `topic` (useState): Tracks the current input text.
   - `uploadedFile` (useState): Tracks file metadata for processing.
   - `lang` (useState): Tracks selected target language (default: 'en').
   - `isGenerating` (useState): Manages loading state during file processing.
   - `isChatOpen` (useState): Controls the visibility of the `ChatPanel`.

8. **Side Effects**
   - **Session Storage**: Stores processed file content and type under `session-content-{id}` for retrieval on the canvas page.
   - **Redirection**: Redirects to `/canvas` with `topic`, `lang`, or `sessionId` parameters.
   - **Session Tracking**: Checks `sessionStorage` for `welcome_back` flag to show a success toast after login.

9. **Error Handling**
   - **Toast Notifications**: Displays errors for unsupported file types or processing failures.
   - **Guards**: Prevents submission if both topic and file are missing.

10. **Known Limitations**
    - File processing is entirely client-side, which may fail for very large PDFs or high-resolution images.
    - No server-side authentication check is performed before redirecting to the canvas (where AI calls happen).

11. **CHANGE SAFETY NOTES**

**🟢 Safe to modify**
- UI layout, spacing, colors, animations
- Hero text, headings, feature descriptions
- Feature cards visuals and ordering
- Tooltips, badges, labels

**🟡 Risky to modify**
- File upload logic (PDF/Image/Text parsing)
- SessionStorage keys (`session-content-*`)
- Language selector default behavior
- Redirect logic to `/canvas`

**🔴 Never modify without audit**
- SessionStorage → Canvas handoff mechanism
- File preprocessing before redirect
- Guards that prevent empty submission
- `isGenerating` flow (prevents double triggers)

---

--------------------------------------------------
PAGE: /login
--------------------------------------------------

1. **Purpose**
   - Provides authentication services (Sign In, Sign Up, Password Reset).
   - Showcases product features via a rotating card selection.

2. **Entry Conditions**
   - **Auth required?**: No (Publicly accessible).

3. **UI Components Used**
   - `AuthForm` (`src/components/auth-form.tsx`)
   - `Icons` (`src/components/icons.tsx`)
   - `Badge` (`src/components/ui/badge.tsx`)
   - `Button` (`src/components/ui/button.tsx`)

4. **User Actions**
   - **Switch Mode**: Toggle between "Sign In" and "Create Account".
   - **Email/Password Auth**: Input credentials and submit.
   - **Google Sign-In**: Click the Google button for social authentication.
   - **Password Reset**: Click "Forgot password?" to trigger a reset email.

5. **AI Interactions**
   - None.

6. **Firestore Interactions**
   - **Write**: Creating an account via `createUserWithEmailAndPassword` (internal Firebase Auth behavior). Note: No explicit user document creation is seen in the `/login` page itself (handled lazily in profile/persistence hooks).

7. **State Management**
   - `selectedDesign` (useState): A randomly selected integer (0-3) used to display different feature cards.

8. **Side Effects**
   - **Navigation**: Redirects to the previous page (`router.back()`) upon successful authentication.
   - **Session Storage**: Sets `welcome_back: true` in `sessionStorage` to trigger a toast on the homepage.

9. **Error Handling**
   - **Toast Notifications**: Specific error messages for invalid credentials, weak passwords, or account-not-found (which triggers an automatic "Create Account" invitation).

10. **Known Limitations**
    - No explicit "Redirect to Dashboard" if already logged in (user can still see the login page).

11. **CHANGE SAFETY NOTES**

**🟢 Safe to modify**
- Auth page UI, layout, copy
- Feature showcase visuals
- Button styles and animations

**🟡 Risky to modify**
- Redirect behavior after login (`router.back()`)
- SessionStorage `welcome_back` flag
- Error message mapping logic

**🔴 Never modify without audit**
- Firebase Auth calls (signIn / createUser)
- Password reset flow
- Google Sign-In provider logic
- Auth context initialization

---

--------------------------------------------------
PAGE: /canvas
--------------------------------------------------

1. **Purpose**
   - The core interaction laboratory where mind maps are generated, viewed, and edited.
   - Supports "Vision Mode" (from files), "Self-Reference" (MindScape's own data), and standard text-to-map flows.

2. **Entry Conditions**
   - **Auth required?**: Partial.
     - Public maps accessible via `mapId` query param.
     - Saving/Editing requires active Firebase session.

3. **UI Components Used**
   - `MindMap` (`src/components/mind-map.tsx`)
   - `MindMapAccordion` (`src/components/mind-map/mind-map-accordion.tsx`)
   - `MindMapRadialView` (`src/components/mind-map/mind-map-radial-view.tsx`)
   - `GenerationLoading` (`src/components/generation-loading.tsx`)
   - `ChatPanel` (Dynamic - `src/components/chat-panel.tsx`)
   - `MindMapToolbar` (`src/components/mind-map/mind-map-toolbar.tsx`)

4. **User Actions**
   - **Node Interactions**: Expand nodes, trigger explanations, generate images for sub-categories.
   - **Map Management**: Save (Manual/Auto), Duplicate, Publish to Community, Export/Download.
   - **View Toggles**: Switch between "Accordion" (structured) and "Map" (radial) views.
   - **AI Configuration**: Change target language (triggers translation) and AI Persona (affects future expansions).
   - **Navigation**: Use breadcrumbs to navigate between original and "Nested" maps.

5. **AI Interactions**
   - `generateMindMapAction` (`src/app/actions.ts`): Initial map creation.
   - `generateMindMapFromImageAction` / `generateMindMapFromTextAction`: Vision mode generation.
   - `explainNodeAction`: Detail generation for specific nodes.
   - `translateMindMapAction`: Re-generation of content in a different language.
   - `categorizeMindMapAction`: Auto-tagging maps before publishing to community.

6. **Firestore Interactions**
   - **Read**: 
     - `users/{uid}/mindmaps/{id}`: Private map metadata and content.
     - `publicMindmaps/{id}`: Public map data.
   - **Write**:
     - `users/{uid}/mindmaps/{id}`: Split-document strategy (metadata + `content/tree` sub-collection).
     - `publicMindmaps/{id}`: Creation (publish) and view count increments.

7. **State Management**
   - `mindMaps` (useMindMapStack): A stack of maps representing the navigation history.
   - `activeIndex`: Current active map in the stack.
   - `hookStatus`: Tracks 'idle', 'generating', or 'error' states.
   - `hasUnsavedChanges`: Tracks local delta before auto-save.

8. **Side Effects**
   - **Auto-Save**: Background syncing to Firestore using a debounced 5-second timer (`useMindMapPersistence`).
   - **Real-time Sync**: Uses `onSnapshot` to reflect changes made to the same document elsewhere.
   - **View Counter**: Automatically increments `views` field for documents in `publicMindmaps`.

9. **Error Handling**
   - **Circuit Breaker**: `useAIHealth` monitors provider status.
   - **ZapOff UI**: Specialized error screen with "Try Again" and "Go Home" options for AI or Firestore failures.
   - **StructuredOutputError**: Graceful handling of AI JSON schema mismatches.

10. **Known Limitations**
    - **Server-Side Auth**: Server actions for AI generation do not verify session tokens, relying on client-side guards.
    - **Public Edits**: Anyone can increment views, but only authors can edit; however, the UI might show edit buttons if the "Owner" check is inconsistent on public maps.

11. **CHANGE SAFETY NOTES**

**🟢 Safe to modify**
- Canvas layout and styling
- Toolbar UI (icons, grouping, labels)
- Accordion vs radial view presentation
- Animations and transitions

**🟡 Risky to modify**
- State stack logic (`useMindMapStack`)
- Breadcrumb navigation logic
- AI persona switching
- Language change triggers
- Public vs private map UI checks

**🔴 Never modify without audit**
- AI Server Actions (`actions.ts`)
- Firestore path structure
- Auto-save debounce timing
- `onSnapshot` real-time sync
- Split-document persistence logic
- View count increment logic
- Structured AI output parsing (Zod)

⚠️ **Highest-risk page in the app**

---

--------------------------------------------------
PAGE: /library
--------------------------------------------------

1. **Purpose**
   - Personal dashboard for managing saved mind maps.
   - Provides search, sort, and filter capabilities for a user's collection.

2. **Entry Conditions**
   - **Auth required?**: Yes (Redirects to `NotLoggedIn` component if unauthenticated).

3. **UI Components Used**
   - `DashboardLoadingSkeleton` (Internal - `src/app/library/page.tsx`)
   - `AlertDialog` (`src/components/ui/alert-dialog.tsx`)
   - `Skeleton` (`src/components/ui/skeleton.tsx`)
   - `Badge` (`src/components/ui/badge.tsx`)
   - `Input` / `Select` / `Button`

4. **User Actions**
   - **Search**: Real-time filtering by topic.
   - **Filter**: Filter maps by AI-generated categories.
   - **Sort**: Re-order maps by "Most Recent", "A-Z", or "Oldest".
   - **Delete**: Trigger confirmation dialog to permanently remove a map.
   - **View**: Click a map card to navigate to `/canvas?mapId={id}`.

5. **AI Interactions**
   - None directly on-page. (Thumbnail generation via Pollinations URL).

6. **Firestore Interactions**
   - **Read**: `users/{uid}/mindmaps` (Limited to top 50, ordered by `updatedAt`).
   - **Write**: `deleteDoc` on `users/{uid}/mindmaps/{id}`.

7. **State Management**
   - `searchQuery` (useState): User input for topic search.
   - `sortOption` (useState): Selection for ordering.
   - `selectedCategory` (useState): Current filter category.
   - `deletingMapIds` (useState): Set of IDs currently undergoing deletion for optimistic UI.

8. **Side Effects**
   - **Optimistic UI**: Maps are hidden from the list immediately upon delete trigger, before Firestore confirmation.
   - **Study Time Tracking**: Not explicitly seen here, but used in canvas.

9. **Error Handling**
   - **Permission Errors**: Uses `errorEmitter` to handle Firestore permission-denied cases during deletion.
   - **Toast Notifications**: Error alerts if deletion fails.

10. **Known Limitations**
    - Hard limit of 50 maps per query with no pagination implemented.
    - Sub-maps (derived/nested maps) are hidden by default based on the `isSubMap` flag.

11. **CHANGE SAFETY NOTES**

**🟢 Safe to modify**
- Card UI and layout
- Filters, dropdown UI
- Empty states and loading skeletons

**🟡 Risky to modify**
- Optimistic delete UI
- Sorting and filtering logic
- Category filter behavior
- Sub-map visibility (`isSubMap`)

**🔴 Never modify without audit**
- Firestore delete operations
- Query limits and ordering
- Auth guard logic
- ErrorEmitter integration

---

--------------------------------------------------
PAGE: /community
--------------------------------------------------

1. **Purpose**
   - A public gallery showcasing mind maps shared by all users.
   - Categorized and searchable "hub" for collective knowledge.

2. **Entry Conditions**
   - **Auth required?**: No (Publicly accessible).

3. **UI Components Used**
   - `CommunityCard` (`src/components/community/community-card.tsx`)
   - `Badge` (`src/components/ui/badge.tsx`)
   - `Skeleton` (`src/components/ui/skeleton.tsx`)

4. **User Actions**
   - **Search**: Search within public map topics and summaries.
   - **Category Filter**: Browse maps by their AI-assigned categories.
   - **Sort**: Sort by "Latest" or "Trending" (based on views).
   - **View**: Click a map to open it in `/canvas`.

5. **AI Interactions**
   - None.

6. **Firestore Interactions**
   - **Read**: `publicMindmaps` collection (Limited to 50 documents).

7. **State Management**
   - `searchQuery` (useState)
   - `selectedCategory` (useState)
   - `sortOption` (useState): Toggle between `recent` and `views`.

8. **Side Effects**
   - Redirection to `/canvas?mapId={id}`.

9. **Error Handling**
   - **Empty State**: Displays a "No MindMaps Found" screen with a reset-filters link if search/filter yields zero results.

10. **Known Limitations**
    - No pagination (hard limit of 50 maps).
    - No "Like" or social interaction features beyond view counting.

11. **CHANGE SAFETY NOTES**

**🟢 Safe to modify**
- Card layout and visuals
- Search UI and filter presentation
- Empty state messaging

**🟡 Risky to modify**
- Sort logic (`views` vs `recent`)
- Category mapping
- Navigation to `/canvas`

**🔴 Never modify without audit**
- Firestore public collection query
- View count assumptions
- Public map visibility rules
- Read-only enforcement assumptions

---

--------------------------------------------------
PAGE: /profile
--------------------------------------------------

1. **Purpose**
   - User account management, preferences, and gamification (Statistics/Achievements).
   - Configuration of AI Provider settings.

2. **Entry Conditions**
   - **Auth required?**: Yes (Shows "Not Signed In" card if unauthenticated).

3. **UI Components Used**
   - `Avatar` (`src/components/ui/avatar.tsx`)
   - `Card` (`src/components/ui/card.tsx`)
   - `Switch` (`src/components/ui/switch.tsx`)
   - `Achievements` (Internal list - `src/app/profile/page.tsx`)

4. **User Actions**
   - **Edit Name**: Change the display name (Syncs to both Firestore and Auth Profile).
   - **Settings**: Change "Preferred Language", "AI Style" (Persona), and "AI Provider" (Default vs Pollinations).
   - **Security**: Trigger password reset email (for non-Social logins).
   - **Logout**: Sign out of Firebase and redirect to Home.

5. **AI Interactions**
   - None directly on-page.

6. **Firestore Interactions**
   - **Read**:
     - `users/{uid}`: Profile metadata, preferences, and stats.
     - `users/{uid}/mindmaps`: Query count of the user's maps for achievement calculation.
   - **Write**:
     - `setDoc` on `users/{uid}`: Updates `displayName`, `preferences`, and `apiSettings`.

7. **State Management**
   - `profile` (UserProfile interface): Local state synced via `onSnapshot` from Firestore.
   - `activeMapsCount`: Count of maps in user's library.
   - `isEditing`: UI toggle for name editing field.

8. **Side Effects**
   - **Real-time Profile Sync**: Uses `onSnapshot` to keep the profile UI in sync with the database.
   - **Firebase Auth Update**: Syncs display name changes to the Firebase Auth user object.

9. **Error Handling**
   - **Permission Guard**: Ignores permission errors that occur during the logout process.
   - **Toast Notifications**: Feedback for saved changes or failed updates.

10. **Known Limitations**
    - Achievements are calculated client-side based on the current snapshot.
    - AI Provider settings only affect the `provider` selection in `generateContent` via context, but individual actions might override this choice.

11. **CHANGE SAFETY NOTES**

**🟢 Safe to modify**
- Layout and presentation
- Achievement visuals
- Section grouping and copy

**🟡 Risky to modify**
- Preference syncing logic
- AI provider selector behavior
- Client-side achievement calculation

**🔴 Never modify without audit**
- Firestore user document writes
- Firebase Auth profile updates
- `onSnapshot` real-time profile sync
- Logout flow

---

# 🧭 HOW TO USE THESE SECTIONS (IMPORTANT)

Before changing any page, do this:

1. Identify the page
2. Read CHANGE SAFETY NOTES
3. Confirm your change is 🟢 or 🟡
4. If 🔴 → stop and plan first

If your change touches **ANY 🔴 area**, do **one of these first**:

- Write a mini plan
- Isolate the change
- Ask for a second review (me or teammate)

---

## Traceability Statement
This documentation is derived exclusively from a line-by-line audit of the `/src/app` routes and their associated components. No assumptions were made regarding business intent or future product roadmaps.
