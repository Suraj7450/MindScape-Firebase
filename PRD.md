
# **MindScape: Product Requirements Document (PRD)**

**Version:** 2.0  
**Date:** December 7, 2025  
**Status:** Production

---

## **1. Introduction & Vision**

### **1.1. Product Overview**
MindScape is an intelligent, AI-powered web application designed to revolutionize how users visualize, explore, and interact with information. It transforms topics, concepts, and user-uploaded documents into structured, multi-layered, and aesthetically pleasing mind maps. With integrated AI assistance, conversational map-building, nested expansions, AI image generation, and comprehensive content generation tools, MindScape serves as a complete platform for learning, brainstorming, and knowledge organization.

### **1.2. Problem Statement**
Learning and researching new topics can be overwhelming. Information is often unstructured, making it difficult to see connections, hierarchies, and the bigger picture. Traditional note-taking and mind mapping tools are manual, time-consuming, and lack dynamic, intelligent capabilities to deepen understanding.

### **1.3. Solution & Value Proposition**
MindScape solves this by leveraging generative AI to automate the creation of detailed mind maps. Its core value proposition is **"Visualize Smarter, Think Faster."** It empowers users to:
*   **Instantly structure any topic** into a clear, hierarchical format.
*   **Explore complex relationships** between concepts through comparison maps.
*   **Transform existing notes and documents** into interactive mind maps (Vision Mode).
*   **Engage in a guided, conversational process** to build maps from scratch (MindGPT).
*   **Deepen understanding** with AI-driven explanations, real-life examples, and quizzes.
*   **Expand knowledge infinitely** through nested inline expansions.
*   **Generate visual aids** with AI-powered image generation for concepts.
*   **Interact naturally** through voice input and multiple AI personas.

---

## **2. Target Audience**

*   **Students (High School, College, Lifelong Learners):** Need to quickly grasp and revise complex subjects, from "Quantum Physics" to "The History of Jazz."
*   **Professionals (Researchers, Analysts, Writers):** Need to synthesize large amounts of information, organize research, and brainstorm ideas for projects.
*   **Creatives & Strategists:** Need a dynamic tool for brainstorming, mapping out strategies, and exploring connections between ideas.

---

## **3. Core Features & User Stories**

### **3.1. Feature: Mind Map Generation**
The central hub for creating mind maps from user input.

*   **User Story 1 (Single Topic):** As a student, I want to enter a single topic (e.g., "Artificial Intelligence") and instantly receive a comprehensive, multi-layered mind map so that I can quickly get an overview of its key areas.
*   **User Story 2 (Compare Concepts):** As a researcher, I want to enter two topics (e.g., "React vs. Vue") to generate a comparative mind map with side-by-side differences view that highlights their similarities, differences, and contextual overlaps, so I can make an informed decision.
*   **User Story 3 (Vision Mode - File Upload):** As a professional, I want to upload my notes (as an image, PDF, or text file) and have the AI generate a mind map based on their content, so I can structure my existing knowledge.
*   **User Story 4 (Language Selection):** As a non-native English speaker, I want to select my preferred language from a dropdown so that the entire mind map is generated in that language, making it easier for me to learn.
*   **User Story 5 (Self-Reference Detection):** As a curious user, when I search for "MindScape" itself, I want to receive a special mind map about the application's own features and capabilities.

### **3.2. Feature: Mind Map Interaction & Visualization**
The core interface for exploring and interacting with a generated mind map.

*   **User Story 1 (Interactive Exploration):** As a user, I want to click on any sub-category in the mind map to open a dialog with a detailed, AI-generated explanation, so I can dive deeper into specific concepts.
*   **User Story 2 (Difficulty Levels):** When viewing an explanation, I want to toggle between "Beginner," "Intermediate," and "Expert" modes to get an explanation tailored to my level of understanding.
*   **User Story 3 (Real-Life Examples):** As a learner, I want to click a "Give me examples" button on any node to receive real-world, practical examples that illustrate the concept.
*   **User Story 4 (Inline Nested Expansion):** As a learner, I want to click "Expand Further" on any sub-category to generate nested sub-topics that appear in a dedicated dialog, allowing me to explore concepts infinitely deep without navigating away.
*   **User Story 5 (Branching - New Map):** As a learner, I want to click "Expand Further" on sub-topics or categories to generate a completely new mind map about that specific node, allowing me to explore tangents.
*   **User Story 6 (Toolbar Actions):** As a user, I want a toolbar with one-click actions to "Expand/Collapse All" nodes, "Save Map," "Quiz Me," "View AI Content" (raw JSON), "Regenerate," "Publish," and language selection for full control over my map.
*   **User Story 7 (Quiz Me):** As a student, I want to click a "Quiz Me" button that generates a multiple-choice quiz based on the mind map content, so I can test my knowledge.
*   **User Story 8 (Translate Map):** As a user, I want to be able to translate an existing mind map into another language on the fly so I can share it or study it in different languages.
*   **User Story 9 (Comparison View):** When viewing a comparison mind map, I want to see topics displayed in a side-by-side table format with colored badges for each topic, making differences immediately visible.

### **3.3. Feature: AI Image Generation**
Integrated visual content creation for enhanced learning.

*   **User Story 1 (Node-Based Image Generation):** As a user, I want to click a "Generate Image" button on any sub-category card to have AI create a relevant, photorealistic image that visually represents that concept.
*   **User Story 2 (Image Gallery):** As I generate multiple images, I want them collected in a floating gallery accessible via a FAB (Floating Action Button) showing the count of generated images.
*   **User Story 3 (Image Download):** From the gallery, I want to be able to download any generated image directly to my device.
*   **User Story 4 (Auto-Save Images):** When viewing a saved mind map, I want my generated images to persist and be restored when I reopen the map.
*   **User Story 5 (Progress Feedback):** While an image is generating, I want to see step-by-step progress toasts indicating the current stage (enhancing prompt, connecting to model, generating, finalizing).

### **3.4. Feature: Nested Expansions**
Infinite depth exploration within the current map.

*   **User Story 1 (Inline Expansion):** As a user, I want to expand any sub-category inline without creating a new map, generating nested sub-topics that dive deeper into that specific concept.
*   **User Story 2 (Nested Maps Dialog):** I want all my inline expansions collected in a "Nested Maps" dialog accessible via a floating button showing the expansion count.
*   **User Story 3 (Multi-Level Depth):** Within the Nested Maps dialog, I want to continue expanding any sub-topic further, creating unlimited depth of exploration.
*   **User Story 4 (Expansion Management):** In the dialog, I want to delete, regenerate, or explain any expansion in chat.
*   **User Story 5 (Loading States):** When expanding, I want to see a placeholder immediately in the dialog showing the expansion is generating, which gets replaced with actual content when ready.
*   **User Story 6 (Auto-Persistence):** My nested expansions should automatically save to my mind map document and restore when I reopen the map.

### **3.5. Feature: MindGPT (Conversational Map Builder)**
A unique, chat-based interface for guided mind map creation.

*   **User Story 1 (Guided Brainstorming):** As someone unsure where to start, I want to interact with an AI assistant (MindGPT) that asks me questions one by one to help me define a main topic and its sub-topics.
*   **User Story 2 (Suggestions):** During my conversation with MindGPT, I want to see clickable suggestions for my next response, making the process faster and more intuitive.
*   **User Story 3 (Finalization):** Once I feel the structure is defined, I want to tell MindGPT to "Generate Mind Map," which will then create the full, comprehensive map based on our conversation and redirect me to the viewer.

### **3.6. Feature: AI Chat Assistant**
App-wide intelligent conversation panel.

*   **User Story 1 (Floating Chat Panel):** As a user, I want a floating AI chat assistant available on every page so I can ask for help, brainstorm ideas, or get explanations without leaving my current context.
*   **User Story 2 (Multiple Personas):** I want to switch between AI personas (Standard, Teacher, Concise, Creative) to get responses tailored to my current need.
*   **User Story 3 (Voice Input):** I want to use voice-to-text to speak my questions instead of typing them.
*   **User Story 4 (Chat History & Sessions):** I want my chat sessions saved with automatic topic summarization, allowing me to review and continue past conversations.
*   **User Story 5 (PDF Export):** I want to export my entire chat session to a formatted PDF document for offline reference or sharing.
*   **User Story 6 (Response Actions):** For each AI response, I want to copy, regenerate, or continue exploring the topic.
*   **User Story 7 (Contextual Chat):** When viewing a mind map, I want the chat pre-filled with context about the current topic, and I can send nodes directly to chat for explanation.

### **3.7. Feature: Dashboard ("My Maps")**
A personalized, authenticated space for managing saved work.

*   **User Story 1 (View Saved Maps):** As a logged-in user, I want to access a dashboard that displays all my saved mind maps as a grid of cards with AI-generated thumbnails and summaries.
*   **User Story 2 (Search & Sort):** On the dashboard, I want to be able to search for maps by topic and sort them by "Most Recent," "Oldest," or "Alphabetical" order.
*   **User Story 3 (Open & Delete):** From the dashboard, I want to be able to open a saved map to continue exploring it or permanently delete a map I no longer need.
*   **User Story 4 (Publish Maps):** I want to publish any saved map to the public gallery with one click, making it visible to the community.
*   **User Story 5 (View Summary):** I want to see an AI-generated summary of each map without opening it.

### **3.8. Feature: Public Maps Gallery**
A gallery for community-shared mind maps.

*   **User Story 1 (Explore Public Maps):** As a user, I want to visit a "Public Maps" page to browse and explore mind maps created and published by other members of the community.
*   **User Story 2 (Filter & Sort):** I want to filter public maps by "All Maps" or "My Published Maps," and sort by date or alphabetically.
*   **User Story 3 (Duplicate Public Map):** As a user viewing a public map, I want a "Save to My Maps" button which creates a personal, editable copy in my own dashboard.
*   **User Story 4 (Share Public Map):** I want to copy a shareable link to any public map to share with others.
*   **User Story 5 (Unpublish My Maps):** I want to unpublish any of my public maps, removing them from the gallery.

### **3.9. Feature: User Authentication**
Secure and simple user sign-up and login.

*   **User Story 1 (Unified Auth):** As a new user, I want to enter my email and password to sign up. If my email already exists, the form should seamlessly allow me to sign in instead.
*   **User Story 2 (Profile Management):** As a logged-in user, I want to see my avatar and name in the navbar and have a simple way to log out.

### **3.10. Feature: Global Translation Tools**
App-wide text translation utilities.

*   **User Story 1 (Text Selection Translator):** As I read content anywhere in the app, I want to be able to highlight any piece of text and see a small popover that lets me instantly translate it to any supported language.
*   **User Story 2 (Translation Dialog):** The translation should appear in a dialog showing both original and translated text, with the ability to switch target languages.

### **3.11. Feature: Breadcrumb Navigation**
Navigation aid for branching maps.

*   **User Story 1 (History Navigation):** When I've generated multiple branching maps in a session, I want a breadcrumb dropdown to navigate back to any previous map in my exploration path.

---

## **4. Technical & Non-Functional Requirements**

### **4.1. Technology Stack**
*   **Frontend:** Next.js 14+ (App Router), React 18+, TypeScript
*   **UI Components:** shadcn/ui
*   **Styling:** Tailwind CSS with custom glassmorphism effects
*   **Animations:** Framer Motion
*   **AI/Generative Backend:** Google AI (Gemini) via Genkit
*   **Image Generation:** Pollinations AI API
*   **Authentication & Database:** Firebase Authentication, Firestore
*   **Image Storage:** Firebase Storage
*   **PDF Processing:** pdf.js for client-side PDF text extraction
*   **PDF Export:** jsPDF for chat session exports

### **4.2. Performance**
*   **Initial Page Load:** The homepage should be interactive in under 2 seconds on a standard connection.
*   **Mind Map Generation:** AI generation for a standard mind map should complete within 10-15 seconds. A loading indicator must be present during this time.
*   **Nested Expansion:** Inline expansions should show placeholder immediately and complete within 5-8 seconds.
*   **Responsiveness:** The application must be fully responsive and usable on all modern devices, including desktops, tablets, and mobile phones.

### **4.3. Security**
*   **Authentication:** User authentication must be handled securely via Firebase.
*   **Data Isolation:** Firestore Security Rules must ensure that users can only access and modify their own mind maps (`/users/{userId}/mindmaps`). Public maps (`/publicMindmaps`) should be readable by all but only writable by authenticated users creating them. Unauthorized access attempts must be blocked.

### **4.4. Scalability**
*   The backend architecture (Firebase Functions / App Hosting with Genkit) should be configured to handle concurrent user requests for AI generation.
*   Firestore database queries must be efficient and indexed where necessary.

---

## **5. Future Considerations (Roadmap)**

*   **Real-time Collaboration:** Allow multiple users to view and edit a single mind map simultaneously.
*   **Advanced Export Options:** Support for exporting mind maps to PDF, Markdown, and other formats.
*   **Custom Themes:** Allow users to customize the visual theme (colors, fonts) of their mind maps.
*   **Node-to-Node Connections:** Implement visual lines or arrows to connect related sub-categories across different branches, showing more complex relationships.
*   **Offline Mode:** Enable offline access to saved mind maps with sync when back online.
*   **Mobile Apps:** Native iOS and Android applications.
*   **API Access:** Developer API for integrating MindScape capabilities into other applications.
