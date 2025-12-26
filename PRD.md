# **MindScape: Product Requirements Document (PRD)**

**Version:** 3.0 (Omni-Flow Update)
**Date:** December 26, 2025
**Status:** In Development / Production
**Project Lead:** MindScape AI Team

---

## **1. Executive Summary**

### **1.1. Vision Statement**
MindScape is an advanced, AI-native knowledge orchestration platform. It transcends traditional mind mapping by treating information as a dynamic, living entity. Our goal is to convert static data—whether it's a brief thought, a complex PDF, or a comparative study—into an interactive, multi-dimensional visual experience that accelerates learning and enhances cognitive clarity.

### **1.2. The Problem**
In an era of information overload, users struggle with:
*   **Linearity Bias:** Consuming information in a straight line (reading) makes it hard to see structural hierarchies.
*   **Analysis Paralysis:** Complex topics often lack a clear "entry point."
*   **Knowledge Gaps:** Static notes don't allow for instant deep-dives into specific sub-concepts.
*   **Cognitive Load:** Manually building mind maps is tedious and distracts from actual learning.

### **1.3. The MindScape Solution**
MindScape leverages Large Language Models (LLMs) and Diffusion Models to automate the "Structure-Explore-Verify" cycle of learning:
1.  **Structure:** Instantly convert any input (Text, Image, PDF) into a hierarchical brain map.
2.  **Explore:** Navigate through nested expansions, real-life examples, and AI-generated visuals.
3.  **Verify:** Validate knowledge retention through dynamically generated quizzes based on the specific map content.

---

## **2. Strategic Objectives**

*   **Zero-Friction Creation:** Move from "Input" to "Map" in under 15 seconds.
*   **Infinite Depth:** Allow users to expand any node into a full sub-map, theoretically allowing for infinite exploration.
*   **Aesthetic Excellence:** Use glassmorphism, cinematic backgrounds, and vibrant interactions to make learning visually rewarding.
*   **Cross-Modal Learning:** Combine Text, Visuals (AI Images), and Interactive (Quizzes) elements in a single interface.

---

## **3. Functional Requirements (Deep Dive)**

### **3.1. Intelligence Engine (MindSpark LLM)**
*   **Context-Aware Mapping:** The AI must understand the semantics of the input to create logical hierarchies (Sub-Topic > Category > Sub-Category).
*   **Defensive Normalization:** The system must handle "lazy" or "incomplete" LLM responses by automatically backfilling required fields (topic, icon, etc.) using input context.
*   **Persona-Driven Interaction:** Support for "Teacher," "Creative," "Concise," and "Expert" personas to alter the tone and depth of explanations and chat.

### **3.2. Vision & Multimedia (The "Aesthetic Layer")**
*   **Dynamic Hero Section:** Every mind map features a conceptual ART background generated via Pollinations AI, providing a cinematic context for the topic.
*   **On-Demand Visualization:** Users can trigger photorealistic image generation for any sub-category to anchor abstract concepts with visual memory.
*   **Vision Mode 2.0:** Multi-format parsing (PDF via PDF.js, Image via OCR-like prompts, Markdown/Text) to bootstrap maps from existing resources.

### **3.3. Interaction & Exploration**
*   **Omni-Expand:** The ability to "Expand Further" on any node.
    *   *Atomic Level:* Expands into nested lists within the map.
    *   *System Level:* Branches off into an entirely new Mind Map while maintaining a navigation history (Breadcrumbs).
*   **Knowledge Toggles:** Every explanation must support "Beginner," "Intermediate," and "Expert" difficulty levels, persisting the user's preference globally.
*   **MindGPT (Conversational Architect):** A first-of-its-kind chat interface where maps are built through dialogue rather than form submission.

### **3.4. Orchestration & Persistence**
*   **Real-Time Sync (Debounced Auto-Save):** Changes to nested expansions, images, and map state are automatically heartbeat-synced to Firestore without user intervention.
*   **Public/Private Stewardship:** A robust publishing system that allows users to share insights via a global gallery while maintaining full ownership and "One-Click Duplicate" functionality for learners.

---

## **4. Technical Architecture (PRD Constraints)**

### **4.1. The Frontend (Stability & Performance)**
*   **Atomic UI States:** Decoupling UI component state (e.g., Select dropdowns) from global prop updates to prevent "Infinite Re-render Loops" in complex Radix UI components.
*   **Framer Motion Orchestration:** Staggered animations for category entrance to reduce perceived latency.
*   **Optimistic UI:** Nested expansions and images must show "Generating" states instantly (<100ms) to provide tactile feedback.

### **4.2. The Backend (Server Actions & AI)**
*   **Stateless Server Actions:** Logic for generation, translation, and quizzes must be decoupled from the UI, using `toPlainObject` serialization for Firestore data.
*   **AI Dispatcher:** A unified client that routes prompts to Gemini, Pollinations, or other providers with standardized system instruction injection.

---

## **5. User Journey Maps**

### **5.1. The "Deep Learner"**
1.  **Entry:** Uploads a 20-page PDF on "Quantum Computing."
2.  **Processing:** Vision Mode extracts key concepts and builds a high-level map.
3.  **Exploration:** The user expands the "Qubits" category.
4.  **Assisted Learning:** Clicks "Give me examples" to understand *Superposition* through a coin-flipping analogy.
5.  **Retention:** Generates a 10-question quiz.
6.  **Session Record:** Exports the follow-up chat session to PDF for study.

---

## **6. Success Metrics (KPIs)**

*   **Structural Depth:** Percentage of users who utilize the "Nested Expansion" feature (Target: >40%).
*   **Time-to-Value:** Average time from splash screen to first interactive node (Target: <20 seconds).
*   **Engagement:** Average number of "Explanation Points" read per session.
*   **Conversion:** From "MindMap View" to "Saved Map" (Target: >60% of logged-in users).

---

## **7. Roadmap & Futurology**

*   **Collaborative Mind-Sync:** Real-time multi-user mapping.
*   **External Source Injection:** Injecting YouTube transcript or Wikipedia data directly into the map context.
*   **Custom Persona Trainer:** Allow users to define their own mentor persona.
*   **Graph Mode:** A non-hierarchical, node-network visualization for cross-branch dependencies.

---
*MindScape © 2025 - The Future of Visual Understanding.*
