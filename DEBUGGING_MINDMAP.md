# Mind Map Generation Debugging Guide

## Issue
Mind maps are only showing the hero section, but no content (subTopics) is visible to users.

## Diagnostic Logging Added

I've added comprehensive console logging to track the data flow through the mind map generation process:

### 1. AI Response Logging (`src/ai/client-dispatcher.ts`)
```
📝 Raw AI text response: [first 500 chars]
🎯 Parsed JSON keys: [array of top-level keys]
```

### 2. Mind Map Normalization Logging (`src/ai/flows/generate-mind-map.ts`)
```
🔍 Raw AI Result: [full JSON]
📊 SubTopics count: [number]
✅ Normalized result: [full normalized JSON]
```

## How to Debug

1. **Open your browser's Developer Console** (F12)
2. **Generate a new mind map** with any topic (e.g., "Solar System")
3. **Watch the console logs** - you should see the emoji-prefixed logs above
4. **Check the following**:
   - Does the raw AI response contain a `subTopics` field?
   - Is the `subTopics` array populated with data?
   - Does the normalized result preserve the `subTopics`?

## Possible Root Causes

### Scenario A: AI Returns Empty SubTopics
**Symptoms**: 
- `📊 SubTopics count: 0`
- Raw result shows `"subTopics": []`

**Solution**: The AI prompt might need adjustment or the AI provider is having issues.

### Scenario B: SubTopics Lost During Normalization
**Symptoms**:
- Raw result shows populated subTopics
- Normalized result shows empty subTopics

**Solution**: Check the normalization logic in `generate-mind-map.ts`

### Scenario C: Schema Validation Failure
**Symptoms**:
- Console shows "Schema validation failed"
- Returning normalized partial result

**Solution**: The schema might be too strict or the AI response doesn't match the expected format.

### Scenario D: Data Lost During Save/Load
**Symptoms**:
- Logs show correct data
- But UI still shows empty

**Solution**: Check Firestore save/load logic in `src/app/mindmap/page.tsx`

## Next Steps

1. **Run the app** and generate a mind map
2. **Share the console logs** with me (copy the emoji-prefixed logs)
3. I'll analyze the exact point where the data is being lost
4. We'll implement a targeted fix based on the root cause

## Quick Test

Try generating a mind map for "Solar System" and look for these specific logs in order:
1. `📝 Raw AI text response` - Should show JSON starting with `{`
2. `🎯 Parsed JSON keys` - Should include `["topic", "shortTitle", "icon", "subTopics"]`
3. `🔍 Raw AI Result` - Should show the full mind map structure
4. `📊 SubTopics count` - Should be > 0 (ideally 4-5)
5. `✅ Normalized result` - Should preserve all the subTopics

If any of these logs are missing or show unexpected values, that's where the problem is!
