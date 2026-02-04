# Known Inconsistencies & Technical Debt – MindScape-Firebase

> **Honest documentation** of codebase drift, legacy patterns, and areas requiring cleanup

---

## Purpose of This Document

This document exists to **preserve accuracy** and **prevent confusion** for future contributors. It documents:
- Historical implementation drift
- Legacy code that still exists
- Ambiguous or transitional patterns
- Areas that need cleanup (but don't block features)

**Philosophy**: Honesty > perfection. Documenting technical debt is better than hiding it.

---

## 1. API Key Storage Drift

### The Issue

The codebase contains **two different API key storage mechanisms**:

1. **Firestore** (`users/{uid}.apiSettings`) ← **CANONICAL**
2. **localStorage** (`mindscape-ai-config`) ← **LEGACY**

### What Actually Happens

**Current Flow**:
```
User enters API key in Profile
  → Saved to Firestore: users/{uid}.apiSettings
  → AIConfigProvider reads from Firestore
  → Also syncs to localStorage (for offline access)
  → Components use AIConfigProvider context
```

**Legacy References**:
- Some older components still check `localStorage` directly
- `useLocalStorage` hook still used in AIConfigProvider
- No functional impact (Firestore is always primary)

### Why It Exists

- **Historical**: localStorage was the original implementation
- **Migration**: Firestore added later for cross-device sync
- **Backward compatibility**: localStorage kept as fallback

### Recommendation

**For new code**: Always use `AIConfigProvider` context, never access localStorage directly.

**Future cleanup**: Remove direct localStorage access in favor of Firestore-only approach.

---

## 2. AI Provider Confusion

### The Issue

Documentation and code comments sometimes imply **Gemini is the primary provider**, but the actual implementation uses **Pollinations as primary**.

### The Truth

| Provider | Status | Use Cases |
|----------|--------|-----------|
| **Pollinations** | ✅ PRIMARY | Mind maps, explanations, images, vision mode |
| **Gemini** | ⚠️ PARTIAL | Quiz generation only |

### Why the Confusion

- **Original design**: Gemini was intended as primary
- **Implementation shift**: Pollinations adopted for free tier
- **Comments not updated**: Some code comments still reference Gemini
- **Dual support**: Both providers exist in codebase

### Where Gemini is Actually Used

**Active**:
- ✅ `/api/generate-quiz-direct` (quiz generation)

**Not Used** (despite code existing):
- ❌ Mind map generation (uses Pollinations)
- ❌ Explanations (uses Pollinations)
- ❌ Image generation (uses Pollinations)

### Recommendation

**For new features**: Use Pollinations unless you have a specific reason to use Gemini.

**Future cleanup**: Remove unused Gemini integration code or clearly mark as "alternative provider".

---

## 3. Firebase Functions Ambiguity

### The Issue

A `functions/` directory exists in the codebase, but its **production status is unclear**.

### What We Know

**Directory exists**: `functions/` (confirmed)

**Usage unclear**:
- No critical user flows depend on it
- May contain development/testing code
- Not required for frontend features

### Current Recommendation

**For frontend development**: Ignore `functions/` directory. All critical logic is in:
- `src/app/api/*` (API routes)
- `src/ai/flows/*` (server actions)

**For backend development**: Investigate `functions/` before deploying new Cloud Functions.

### Why This Matters

Engineers waste time investigating unused code. This clarification prevents that.

---

## 4. Split Content Logic Complexity

### The Issue

Large mind maps are **split across multiple Firestore documents** to avoid the 1MB document limit, but this logic is **fragile**.

### How It Works

**Normal map** (< 1MB):
```
users/{uid}/mindmaps/{mapId}
  → All data in single document
```

**Large map** (> 1MB):
```
users/{uid}/mindmaps/{mapId}
  → Metadata only
  → hasSplitContent: true

users/{uid}/mindmaps/{mapId}/content/tree
  → subTopics, compareDimensions, etc.
```

### The Problem

- **Complexity**: Load logic must check `hasSplitContent` flag
- **Fragility**: If flag is wrong, data appears missing
- **Performance**: Extra Firestore read for large maps
- **Edge cases**: What if split fails mid-save?

### Current Mitigation

- Auto-save detects size and splits automatically
- Load logic always checks for split content
- Works reliably in practice

### Future Improvement

Consider using **Firestore bundles** or **Cloud Storage** for very large maps instead of subcollections.

---

## 5. Auto-Save Race Conditions

### The Issue

Auto-save is **debounced** (3-second delay), which can lead to **race conditions** if user navigates away quickly.

### How It Works

```
User makes change
  → onUpdate() callback
  → Debounce 3 seconds
  → Save to Firestore
```

### The Problem

**Scenario**:
1. User edits map
2. Auto-save starts (3-second timer)
3. User navigates away before timer completes
4. Change is lost

### Current Mitigation

- **Manual save button** always available
- **Unsaved changes indicator** warns user
- **beforeunload** event (not implemented)

### Future Improvement

Implement `beforeunload` handler to warn user of unsaved changes:
```typescript
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});
```

---

## 6. Real-Time Sync Conflicts

### The Issue

Multiple users editing the same map can cause **last-write-wins** conflicts.

### How It Works

```
User A edits map → Firestore update
User B edits map → Firestore update (overwrites A's changes)
```

### The Problem

- No **operational transform** (OT) or **CRDT**
- No **conflict resolution** UI
- Last write wins (data loss possible)

### Current Mitigation

- **Single-user assumption**: Most maps are private
- **Real-time listener**: Users see changes immediately
- **Manual save**: Users can choose when to save

### Future Improvement

Implement **Firestore transactions** or **field-level updates** instead of full document overwrites.

---

## 7. Image Generation Placeholder Logic

### The Issue

When generating images, a **placeholder** is added immediately, then replaced when the real image arrives. If generation fails, **placeholder remains**.

### How It Works

```
User clicks "Generate Image"
  → Add placeholder to generatedImages array
  → Call image generation API
  → Replace placeholder with real image
```

### The Problem

**If API fails**:
- Placeholder remains in array
- User sees broken image icon
- No automatic cleanup

### Current Mitigation

- User can manually delete failed images
- Toast notification shows error

### Future Improvement

Automatically remove placeholder if generation fails after timeout (e.g., 30 seconds).

---

## 8. Nested Map Deletion Cascade

### The Issue

When deleting a map with **nested sub-maps**, all sub-maps are deleted recursively. This is **correct behavior** but has **no undo**.

### How It Works

```
User deletes map
  → Query all maps where parentMapId == mapId
  → Delete all sub-maps
  → Delete parent map
```

### The Problem

- **No undo**: Deletion is permanent
- **No warning**: User not told about sub-map deletion
- **Cascade depth**: Deep nesting could delete many maps

### Current Mitigation

- Confirmation dialog before deletion
- User must explicitly confirm

### Future Improvement

Add warning: "This will also delete X nested maps. Are you sure?"

---

## 9. Compare Mode Discoverability

### The Issue

**Compare mode** is a powerful feature, but users may not discover it easily.

### Why It's Hidden

- No prominent UI entry point on home page
- Requires manual URL construction or specific form state
- Not mentioned in onboarding

### Current Access Methods

1. Home page: Select "Compare" from dropdown
2. Direct URL: `/canvas?topic1=X&topic2=Y`

### Future Improvement

Add **"Compare Mode"** button to navbar or home page hero section.

---

## 10. ChatPanel Resizing

### The Issue

ChatPanel is **fixed width** on desktop, which can feel cramped for long conversations.

### Current Behavior

- Desktop: Fixed 400px width
- Mobile: Full screen overlay

### User Feedback

Users may want to **resize** or **expand** the chat panel for better readability.

### Future Improvement

Add **draggable resize handle** or **expand/collapse** button.

---

## Summary

These inconsistencies are **documented, not critical**. They represent:
- ✅ Historical implementation choices
- ✅ Technical debt to address later
- ✅ Areas for future improvement

**Key Takeaway**: The app works reliably despite these issues. This document ensures future contributors understand the "why" behind certain patterns.

---

## Maintenance Guidelines

### When Adding Features

1. **Check this document first** to avoid repeating patterns
2. **Use canonical approaches** (Firestore > localStorage, Pollinations > Gemini)
3. **Update this document** if you discover new inconsistencies

### When Refactoring

1. **Prioritize user-facing issues** over internal cleanup
2. **Test thoroughly** (especially auto-save, split content, nested deletion)
3. **Update documentation** after changes

### When Onboarding

1. **Read this document** to understand technical debt
2. **Ask questions** if something seems contradictory
3. **Don't assume** code comments are always accurate

---

**Last Updated**: February 1, 2026  
**Maintained By**: Development team  
**Philosophy**: Honesty > perfection
