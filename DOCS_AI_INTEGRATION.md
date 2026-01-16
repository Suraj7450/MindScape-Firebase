# MindScape AI Architecture & Pollinations.ai Integration

MindScape uses a hybrid AI architecture designed for high performance, cost-efficiency, and resilience. This document details how **Pollinations.ai** and **Google Gemini** are used across the platform.

## 1. Core Integration Strategy
The system uses a **Central Dispatcher** (`src/ai/client-dispatcher.ts`) that orchestrates requests between providers.

- **Primary Provider:** Pollinations.ai (Free, open-source models). This is the MASTER engine used for 99% of tasks, including Vision and Complex JSON.
- **Secondary Fallback:** Google Gemini (Native API). Only invoked if Pollinations is completely unreachable after 5 sequential retries.

---

## 2. Intelligent Model Selection (Pollinations)
We implemented an **Expert Model Selector** in `src/ai/pollinations-client.ts` that automatically routes tasks to the best engine based on the prompt's requirements.

| Use Case | Model Used | Why? |
| :--- | :--- | :--- |
| **Multimodal / Vision** | `gemini` (via Pollinations) | Best-in-class at understanding layout and images. Processed via Pollinations gateway. |
| **Structured JSON** | `qwen` | Extremely high precision in following complex schemas and Zod-based output requirements. |
| **Deep Reasoning** | `openai` | Superior at logical deductions and creating complex "Advanced" mind maps. |
| **General Text** | `mistral` | Balanced, fast foundation for simple descriptions. |

---

## 3. Dedicated Use Cases

### A. Mind Map Generation
- **Text-to-Map:** Analyzes user input to generate a hierarchical JSON structure (Topic -> Sub-topics -> Categories).
- **Image-to-Map:** Uses the Vision model to "look" at an uploaded image or PDF and extract a logical mind map structure.
- **Comparison Maps:** Takes two topics and generates a dual-dual-root map showing similarities and unique differences.

### B. Image Generation (`/api/generate-image`)
Used for generating thumbnails and visual representations of topics.
- **Models:** `flux`, `flux-realism`, `turbo`.
- **Workflow:** 
    1. The user provides a simple prompt (e.g., "History of Rome").
    2. The **Enhancement Flow** transforms it into a 20-keyword photorealistic prompt.
    3. The API fetches the image from `image.pollinations.ai`.

### C. Contextual AI Recommendations
In the **Library Preview**, the AI analyzes your existing mind map and suggests "Exploration Ideas".
- **Purpose:** To help users dive deeper into niche sub-topics or see real-world applications of what they've learned.

### D. Inline Node Expansion
Instead of generating a whole new map, users can click "Expand" on any leaf node. 
- **Purpose:** The AI generates an additional 4-6 specific sub-categories for that exact node, allowing "infinite" depth without cluttering the main UI.

### E. AI Chat Assistant
A floating chat interface that remembers your current mind map context.
- **Purpose:** Answer specific questions about the topic, provide examples, or act as a tutor for the mind map content.

---

## 4. Reliability & Fallbacks
We use a **Circuit Breaker** and **Provider Fallback** pattern:

1. **Retry Logic:** If Pollinations returns a 502/503 (busy), we retry up to 2 times with exponential backoff.
2. **Fallback:** If all retries fail, the request is automatically routed to **Gemini 2.5 Flash**.
3. **Health Monitoring:** The `provider-monitor.ts` tracks success rates. If one provider is consistently failing, the system temporarily "trips" and switches to the healthy alternative.

---

## 5. Technical File Map
- `src/ai/client-dispatcher.ts`: The "Brain" that decides which provider to use.
- `src/ai/pollinations-client.ts`: Handles communication with Pollinations API.
- `src/app/api/generate-image/route.ts`: Entry point for all visual generations.
- `src/ai/flows/*`: Individual specialized logic for each feature (Quiz, Translation, Expansion).
