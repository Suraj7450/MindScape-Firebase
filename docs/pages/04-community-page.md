# Community Page (`/community`) – MindScape-Firebase

> **Code-Verified**: All elements traced from `src/app/community/page.tsx` (178 lines)

---

## Page Overview

**Route**: `/community`  
**File**: `src/app/community/page.tsx`  
**Type**: Client Component  
**Access**: Public (no authentication required)

### Purpose
Gallery of publicly shared mind maps from the community with search, filter, and sort capabilities.

---

## Page Structure

```
CommunityPage
├─ Header (search + category filter)
├─ Sort Toggle (Recent / Trending)
└─ Map Grid (community cards)
```

---

## Interactive Elements

### Header Controls

| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Search Input** | Input | Filter maps | Type | Filter by topic/summary/author |
| **Category Pills** | Button | Filter by category | Click | Show maps in selected category |
| **Sort Toggle** | Tabs | Change order | Click | Recent ↔ Trending (views) |

**Category Pills**:
- Dynamically generated from `publicCategories` field
- Active category highlighted
- "All" option to clear filter

**Sort Options**:
- **Recent**: `orderBy('updatedAt', 'desc')` (default)
- **Trending**: `orderBy('views', 'desc')`

---

### Community Card

| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Card Click** | Card | View map | Click | → `/canvas?mapId={mapId}` |
| **Author Info** | Text | Display creator | N/A | Shows author name + avatar |
| **View Count** | Badge | Display popularity | N/A | Shows view count |
| **Category Badges** | Badge | Display categories | N/A | Shows AI-generated categories |

**Card Content**:
- **Thumbnail**: Map icon or generated image
- **Topic**: Map title
- **Summary**: AI-generated summary (truncated)
- **Author**: Creator's display name
- **Views**: View count
- **Categories**: Up to 3 category badges
- **Updated**: Relative time (e.g., "2 days ago")

---

## Data Flow

### Initial Load
```
Component mount
  → useCollection hook
  → Firestore query: publicMindmaps
  → orderBy('updatedAt', 'desc')
  → limit(50)
  → Real-time listener (onSnapshot)
  → Display in grid
```

### Category Filter
```
User clicks category pill
  → Filter maps client-side
  → Match against publicCategories array
  → Re-render grid with filtered results
```

### Search Filter
```
User types in search
  → Filter maps client-side
  → Match against topic + summary + authorName (case-insensitive)
  → Re-render grid with filtered results
```

### Sort Toggle
```
User clicks "Trending"
  → Re-query Firestore
  → orderBy('views', 'desc')
  → Update grid
```

### View Tracking
```
User clicks map card
  → Navigate to /canvas?mapId={mapId}
  → Canvas page increments views:
     updateDoc(publicDocRef, { views: increment(1) })
  → View count updates in real-time
```

---

## Firestore Queries

### Recent Query (Default)
```typescript
collection(firestore, 'publicMindmaps')
  .orderBy('updatedAt', 'desc')
  .limit(50)
```

### Trending Query
```typescript
collection(firestore, 'publicMindmaps')
  .orderBy('views', 'desc')
  .limit(50)
```

---

## User Flows

### Flow 1: Browsing Community Maps
```
1. User navigates to /community
2. Grid displays recent public maps
3. User scrolls through cards
4. User clicks on a map
5. Navigate to /canvas?mapId={mapId}
6. View count increments
```

### Flow 2: Filtering by Category
```
1. User sees category pills
2. User clicks "Science" category
3. Grid filters to show only Science maps
4. User can click "All" to reset
```

### Flow 3: Searching for a Topic
```
1. User types "quantum" in search
2. Grid filters to maps matching "quantum"
3. Matches topic, summary, or author name
4. User clicks a result
5. Navigate to canvas
```

### Flow 4: Viewing Trending Maps
```
1. User clicks "Trending" tab
2. Firestore re-queries with orderBy('views', 'desc')
3. Grid updates to show most-viewed maps
4. User can switch back to "Recent"
```

---

## UI States

### Loading States
1. **Initial Load**: Skeleton cards (6 placeholders)
2. **Empty State**: "No public maps yet" message
3. **Search No Results**: "No maps match your search"

### Error States
1. **Firestore Error**: Toast notification
2. **Network Error**: Retry button

---

## Public Map Schema

**Firestore Collection**: `publicMindmaps`

```typescript
{
  id: string; // Map ID (same as user's map)
  topic: string;
  summary: string;
  icon?: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  views: number;
  publicCategories: string[]; // AI-generated categories
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Full map data (subTopics, etc.)
}
```

---

## Code References

- [community/page.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/app/community/page.tsx)
- [community-card.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/components/community/community-card.tsx)

---

## Summary

The Community page provides **public mind map discovery**:
- **Real-time sync**: Firestore listeners for instant updates
- **Search & filter**: By topic, summary, author, and category
- **Sort options**: Recent vs Trending (by views)
- **View tracking**: Automatic view count increment
- **Public access**: No authentication required

All features verified from code.
