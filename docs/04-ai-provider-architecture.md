# AI Provider Architecture – MindScape-Firebase

> **Code-Verified Truth Table** – Resolves all provider contradictions

---

## Provider Reality (As Implemented)

### Primary Provider: **Pollinations.ai**

**Status**: ✅ **ACTIVE** (Primary text and image generation)

**Implementation**: `src/ai/pollinations-client.ts` (362 lines)

**Capabilities**:
- Text generation (mind maps, explanations, summaries)
- Vision mode (image/PDF analysis)
- Image generation
- Multi-model rotation (Qwen → Mistral → Nova → OpenAI)
- Automatic failover and error recovery

**API Key Handling**:
```typescript
// Priority order:
1. Client-provided key (from AIConfigProvider)
2. Server environment key (POLLINATIONS_API_KEY)
3. Free tier (no key)
```

**Models Used**:
- **Text (default)**: `qwen-coder` → `mistral` → `nova-fast` → `openai-fast` (rotation)
- **Vision**: `openai` (required for image analysis)
- **Search**: `perplexity-fast` (when search context needed)

---

### Secondary Provider: **Google Gemini**

**Status**: ⚠️ **PARTIAL** (Quiz generation only)

**Implementation**: `src/app/api/generate-quiz-direct/route.ts`

**Active Use Cases**:
- ✅ Quiz generation (`/api/generate-quiz-direct`)
- ❌ Mind map generation (NOT used)
- ❌ Explanations (NOT used)
- ❌ Image generation (NOT used)

**Why Gemini is Limited**:
- Pollinations provides free, unlimited access
- Gemini requires paid API key
- Pollinations has better model rotation for reliability

---

## Provider Usage by Feature

| Feature | Provider | Model | Status |
|---------|----------|-------|--------|
| **Mind Map Generation** | Pollinations | qwen-coder / mistral | ✅ ACTIVE |
| **Compare Mode** | Pollinations | qwen-coder / mistral | ✅ ACTIVE |
| **Vision Mode (Image/PDF)** | Pollinations | openai (vision) | ✅ ACTIVE |
| **Node Expansion** | Pollinations | qwen-coder / mistral | ✅ ACTIVE |
| **Explanations** | Pollinations | qwen-coder / mistral | ✅ ACTIVE |
| **Examples** | Pollinations | qwen-coder / mistral | ✅ ACTIVE |
| **Translation** | Pollinations | qwen-coder / mistral | ✅ ACTIVE |
| **Summarization** | Pollinations | qwen-coder / mistral | ✅ ACTIVE |
| **Image Generation** | Pollinations | (image endpoint) | ✅ ACTIVE |
| **Quiz Generation** | Gemini | gemini-2.0-flash | ✅ ACTIVE |
| **Chat Assistant** | Pollinations | qwen-coder / mistral | ✅ ACTIVE |
| **Search Context** | Google Custom Search | N/A | ✅ ACTIVE |

---

## API Key Storage Architecture

### Current Implementation: **Firestore (Canonical)**

**File**: `src/contexts/ai-config-context.tsx`

**Storage Path**: `users/{uid}` → `apiSettings` field

**Schema**:
```typescript
{
  apiSettings: {
    pollinationsApiKey?: string;
    geminiApiKey?: string;
  }
}
```

**Flow**:
```
User enters API key in Profile
  → Save to Firestore: users/{uid}.apiSettings
  → AIConfigProvider reads from Firestore
  → Provides to all AI calls via context
```

### Legacy References: **localStorage**

**Status**: ⚠️ **DEPRECATED** (transitional code)

**Why It Exists**:
- Historical implementation before Firestore integration
- Some components still check localStorage as fallback
- Should be treated as legacy

**Recommendation**: 
- Firestore is the **single source of truth**
- localStorage references should be removed in future cleanup

---

## Model Rotation Strategy

### Why Rotation?

Pollinations uses multiple open-source models. If one fails or is slow, the system automatically rotates to the next.

### Rotation Sequence (Text Generation)

```
Attempt 0: qwen-coder (fast, good for structured output)
  ↓ (if fails)
Attempt 1: mistral (reliable, good JSON)
  ↓ (if fails)
Attempt 2: nova-fast (alternative)
  ↓ (if fails)
Attempt 3: openai-fast (fallback)
```

### Vision Mode (No Rotation)

```
Always: openai (only model with vision support)
```

### Search Mode (No Rotation)

```
Always: perplexity-fast (optimized for search)
```

---

## Error Handling & Failover

### API Key Failover

```
1. Try client-provided key
   ↓ (if 401/403)
2. Try server environment key
   ↓ (if still fails)
3. Check balance (if exhausted, show error)
   ↓ (if balance OK)
4. Retry without key (free tier)
```

### Service Error Failover

```
1. Try current model
   ↓ (if 5xx error)
2. Rotate to next model
   ↓ (if still fails)
3. Continue rotation up to 4 attempts
   ↓ (if all fail)
4. Throw error to user
```

### JSON Repair Logic

If AI returns malformed JSON:
```
1. Try direct JSON.parse()
   ↓ (if fails)
2. Extract JSON from text (find { and })
   ↓ (if incomplete)
3. Auto-repair (close quotes, brackets, braces)
   ↓ (if still fails)
4. Iterative salvage (add closing chars)
   ↓ (if all fails)
5. Throw error
```

---

## Environment Variables

### Required
- `POLLINATIONS_API_KEY` (optional, enables paid tier)

### Optional
- `GEMINI_API_KEY` (only for quiz generation)
- `GOOGLE_SEARCH_API_KEY` (for web search context)
- `GOOGLE_SEARCH_ENGINE_ID` (for web search context)

---

## Rate Limits

### Pollinations
- **Free tier**: Unlimited (community-supported)
- **Paid tier**: Higher priority, faster responses
- **Balance check**: `GET /account/balance`

### Gemini
- **Free tier**: 15 requests/minute
- **Paid tier**: 60 requests/minute

### Google Custom Search
- **Free tier**: 100 queries/day
- **Paid tier**: 10,000 queries/day

---

## Why Pollinations is Primary

### Advantages
1. **Free & unlimited** (no rate limits)
2. **Multi-model rotation** (automatic failover)
3. **Vision support** (image/PDF analysis)
4. **JSON repair** (handles malformed responses)
5. **No API key required** (optional for paid tier)

### Disadvantages
1. **Variable quality** (depends on model availability)
2. **Slower than Gemini** (sometimes)
3. **Less control** (model rotation is automatic)

---

## Migration Path (If Needed)

To switch to Gemini as primary:

1. Update `src/ai/flows/*.ts` to use Gemini client
2. Replace `generateContentWithPollinations()` calls
3. Update API key handling in AIConfigProvider
4. Add Gemini rate limiting logic
5. Test all generation modes

**Estimated effort**: 2-3 days

---

## Code References

- [pollinations-client.ts](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/ai/pollinations-client.ts) - Primary AI client
- [ai-config-context.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/contexts/ai-config-context.tsx) - API key management
- [generate-quiz-direct/route.ts](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/app/api/generate-quiz-direct/route.ts) - Gemini usage

---

## Summary

**Truth**: Pollinations is the **primary and active** AI provider for all mind map features. Gemini is **only used for quiz generation**. API keys are **canonically stored in Firestore**, with localStorage as legacy.

This architecture provides:
- ✅ Free, unlimited AI generation
- ✅ Automatic failover and error recovery
- ✅ Multi-model rotation for reliability
- ✅ Vision support for image/PDF analysis
- ✅ No hard dependency on paid API keys
