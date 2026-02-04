# Library Page (`/library`) – MindScape-Firebase

> **Code-Verified**: All elements traced from `src/app/library/page.tsx` (1318 lines)

---

## Page Overview

**Route**: `/library`  
**File**: `src/app/library/page.tsx`  
**Type**: Client Component  
**Access**: Protected (shows login prompt if not authenticated)

### Purpose
User's personal mind map dashboard with search, filter, preview, download, publish, and management capabilities.

---

## Page Structure

```
DashboardPage
├─ Header (search + sort controls)
├─ Map Grid (thumbnail cards)
├─ Preview Sheet (detailed view)
│  ├─ Map metadata
│  ├─ AI recommendations
│  ├─ Publish toggle
│  ├─ Export options
│  └─ Delete confirmation
└─ Background Generation (from recommendations)
```

---

## Interactive Elements

### Header Controls

| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Search Input** | Input | Filter maps | Type | Filter by topic/summary |
| **Sort Dropdown** | Select | Change order | Select | Recent / Alphabetical / Oldest |

**Sort Options**:
- **Recent**: `orderBy('updatedAt', 'desc')` (default)
- **Alphabetical**: Sort by topic A-Z
- **Oldest**: `orderBy('createdAt', 'asc')`

---

### Map Card

| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Card Click** | Card | Open preview | Click | Open PreviewSheet |
| **View Button** | Button | Navigate to canvas | Click | → `/canvas?mapId={mapId}` |
| **Delete Icon** | Trash2 | Delete map | Click | Confirmation dialog |

**Card Content**:
- **Thumbnail**: Auto-generated or default icon
- **Topic**: Map title
- **Summary**: AI-generated summary (truncated)
- **Metadata**: Created date, node count, depth indicator
- **Badges**: Public indicator, sub-map indicator

---

### Preview Sheet

**Trigger**: Click on any map card

#### Tabs

##### Overview Tab
| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **View Full Map** | Button | Navigate | Click | → `/canvas?mapId={mapId}` |
| **Publish Toggle** | Switch | Publish/unpublish | Toggle | Update `isPublic` + sync to `publicMindmaps` |
| **Regenerate Thumbnail** | Button | Update image | Click | `enhanceImagePromptAction()` + image generation |
| **Download PDF** | Button | Export summary | Click | Generate PDF with jsPDF |
| **Download Full Data** | Button | Export JSON | Click | Download complete map data |
| **Delete Map** | Button | Remove map | Click | Confirmation dialog → Firestore delete |

**Metadata Display**:
- Topic
- Summary (full text)
- Created date
- Updated date
- Node count
- Depth level
- Language
- Public status

##### Recommendations Tab
| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Recommendation Card** | Card | Generate map | Click | Background generation via `generateMindMapAction()` |
| **Refresh** | Button | Get new suggestions | Click | `suggestRelatedTopicsAction()` |

**Recommendation Flow**:
```
User opens preview
  → Auto-call suggestRelatedTopicsAction()
  → AI suggests 3-5 related topics
  → Display as cards
  → User clicks recommendation
  → Background generation starts
  → Notification when complete
  → New map appears in library
```

---

## Data Flow

### Initial Load
```
Component mount
  → useCollection hook
  → Firestore query: users/{uid}/mindmaps
  → orderBy('updatedAt', 'desc')
  → Real-time listener (onSnapshot)
  → Display in grid
```

### Search & Filter
```
User types in search
  → Filter maps client-side
  → Match against topic + summary (case-insensitive)
  → Re-render grid with filtered results
```

### Delete Flow
```
User clicks delete
  → Confirmation dialog opens
  → User confirms
  → Delete from Firestore: users/{uid}/mindmaps/{mapId}
  → If hasSplitContent: Delete content/tree subcollection
  → If has nested maps: Delete all sub-maps (where parentMapId == mapId)
  → Real-time listener updates UI
  → Toast: "Map deleted"
```

### Publish Flow
```
User toggles publish switch
  → Call categorizeMindMapAction() (AI categorization)
  → AI returns categories array
  → Create/update document in publicMindmaps collection
  → Set isPublic = true in user's map
  → Toast: "Published successfully"
  → Map appears in /community
```

### Unpublish Flow
```
User toggles publish switch off
  → Delete from publicMindmaps collection
  → Set isPublic = false in user's map
  → Toast: "Unpublished"
  → Map removed from /community
```

### Download PDF Flow
```
User clicks "Download PDF"
  → Initialize jsPDF
  → Add header with topic + date
  → Add summary section
  → Add key insights (from subTopics)
  → Add footer with page numbers
  → Save as {topic}-summary.pdf
```

### Download Full Data Flow
```
User clicks "Download Full Data"
  → Fetch complete map data (including content/tree if split)
  → Stringify as JSON
  → Create Blob
  → Download as {topic}-full-data.json
```

### Thumbnail Regeneration Flow
```
User clicks "Regenerate Thumbnail"
  → Call enhanceImagePromptAction() with topic
  → POST /api/generate-image
  → Update map.icon field
  → Save to Firestore
  → UI updates with new thumbnail
```

---

## Firestore Queries

### Main Query
```typescript
collection(firestore, 'users', user.uid, 'mindmaps')
  .orderBy('updatedAt', 'desc')
```

### Real-Time Listener
```typescript
onSnapshot(query, (snapshot) => {
  const maps = snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  }));
  setMindMaps(maps);
});
```

---

## User Flows

### Flow 1: Viewing a Saved Map
```
1. User navigates to /library
2. Grid displays all saved maps
3. User clicks on a map card
4. Preview sheet opens
5. User clicks "View Full Map"
6. Navigate to /canvas?mapId={mapId}
```

### Flow 2: Publishing a Map
```
1. User opens preview sheet
2. User toggles "Publish" switch
3. AI categorizes the map
4. Map copied to publicMindmaps collection
5. isPublic flag set to true
6. Toast: "Published successfully"
7. Map now visible in /community
```

### Flow 3: Generating from Recommendation
```
1. User opens preview sheet
2. Switch to "Recommendations" tab
3. AI suggests related topics
4. User clicks a recommendation
5. Background generation starts
6. Notification appears
7. New map added to library
8. User can view immediately
```

### Flow 4: Deleting a Map
```
1. User clicks delete icon on card
2. Confirmation dialog appears
3. User confirms deletion
4. Map deleted from Firestore
5. Nested maps also deleted
6. Real-time listener updates grid
7. Toast: "Map deleted"
```

---

## UI States

### Loading States
1. **Initial Load**: Skeleton cards (6 placeholders)
2. **Empty State**: "No maps yet" message with CTA
3. **Search No Results**: "No maps match your search"

### Error States
1. **Not Logged In**: Login prompt with redirect
2. **Firestore Error**: Toast notification

---

## Code References

- [library/page.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/app/library/page.tsx)

---

## Summary

The Library page provides **comprehensive mind map management**:
- **Real-time sync**: Firestore listeners for instant updates
- **Search & filter**: Client-side filtering by topic/summary
- **AI recommendations**: Suggest related topics for exploration
- **Publishing**: One-click publish to community
- **Export options**: PDF summary + full JSON data
- **Background generation**: Create maps without blocking UI

All features verified from code.
