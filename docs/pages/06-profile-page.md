# Profile Page (`/profile`) – MindScape-Firebase

> **Code-Verified**: All elements traced from `src/app/profile/page.tsx` (1086 lines)

---

## Page Overview

**Route**: `/profile`  
**File**: `src/app/profile/page.tsx`  
**Type**: Client Component  
**Access**: Protected (redirects to /login if not authenticated)

### Purpose
User profile management, statistics dashboard, activity tracking, and account settings.

---

## Page Structure

```
ProfilePage
├─ Header (avatar + name + email)
├─ Statistics Grid (4 cards)
├─ Activity Chart (7-day history)
├─ Recent Activity Feed
└─ Settings Section
    ├─ Profile Settings
    ├─ API Key Management
    └─ Account Actions
```

---

## Interactive Elements

### Header Section

| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Avatar** | Image | Display photo | N/A | Shows user's photoURL or initials |
| **Display Name** | Text | Show name | N/A | User's displayName |
| **Email** | Text | Show email | N/A | User's email |
| **Edit Profile** | Button | Open editor | Click | Show profile edit form |

---

### Statistics Cards

| Metric | Icon | Source | Description |
|--------|------|--------|-------------|
| **Maps Created** | Map | `statistics.mapsCreated` | Total mind maps generated |
| **Current Streak** | Flame | `statistics.currentStreak` | Consecutive days of activity |
| **Total Nodes** | GitBranch | `statistics.totalNodes` | Sum of all nodes across maps |
| **Images Generated** | ImageIcon | `statistics.totalImages` | Total AI images created |

**Data Source**: `users/{uid}` → `statistics` field

---

### Activity Chart

**Type**: Line chart (7-day history)

**Data Points**:
- X-axis: Last 7 days
- Y-axis: Activity count (maps created + nodes added + images generated)

**Source**: `users/{uid}/activities` subcollection

**Query**:
```typescript
collection(firestore, 'users', uid, 'activities')
  .where('timestamp', '>=', sevenDaysAgo)
  .orderBy('timestamp', 'desc')
```

**Activity Types**:
- `map_created`: New mind map generated
- `node_expanded`: Nested expansion created
- `image_generated`: AI image created
- `map_translated`: Language changed
- `map_published`: Published to community

---

### Recent Activity Feed

**Display**: List of recent activities (last 10)

| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Activity Item** | Card | View details | Click | Navigate to related map |
| **Activity Icon** | Icon | Visual indicator | N/A | Type-specific icon |
| **Activity Text** | Text | Description | N/A | "Created map: {topic}" |
| **Timestamp** | Text | Relative time | N/A | "2 hours ago" |

**Activity Icons**:
- `map_created`: Map
- `node_expanded`: GitBranch
- `image_generated`: ImageIcon
- `map_translated`: Languages
- `map_published`: UploadCloud

---

### Profile Settings

| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Display Name Input** | Input | Edit name | Change | Update state |
| **Photo URL Input** | Input | Edit photo | Change | Update state |
| **Save Changes** | Button | Update profile | Click | Firebase `updateProfile()` + Firestore update |

**Update Flow**:
```
User edits name/photo → Click "Save Changes"
  → Firebase updateProfile({ displayName, photoURL })
  → Update Firestore: users/{uid} { displayName, photoURL }
  → Toast: "Profile updated"
  → UI re-renders with new data
```

---

### API Key Management

| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **API Key Input** | Input | Enter key | Change | Update state |
| **Save API Key** | Button | Store key | Click | Save to localStorage |
| **Remove API Key** | Button | Delete key | Click | Remove from localStorage |
| **Test API Key** | Button | Validate key | Click | Test API call to Gemini |

**Storage**: `localStorage.getItem('gemini_api_key')`

**Test Flow**:
```
User clicks "Test API Key"
  → POST /api/test-key with { apiKey }
  → Gemini API call (simple prompt)
  → Success: Toast "API key is valid"
  → Error: Toast "Invalid API key"
```

---

### Account Actions

| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Sign Out** | Button | Logout | Click | Firebase `signOut()` → `/login` |
| **Delete Account** | Button | Remove account | Click | Confirmation dialog |

**Delete Account Flow**:
```
User clicks "Delete Account"
  → Confirmation dialog opens
  → User confirms
  → Delete all user data:
     - users/{uid} document
     - users/{uid}/mindmaps collection
     - users/{uid}/activities collection
     - publicMindmaps where authorId == uid
  → Firebase deleteUser()
  → Router push to "/"
  → Toast: "Account deleted"
```

---

## Data Flow

### Initial Load
```
Component mount
  → useAuth() hook provides user
  → Firestore query: users/{uid}
  → Load statistics
  → Query activities subcollection (last 7 days)
  → Aggregate activity data for chart
  → Display in UI
```

### Real-Time Statistics Update
```
Firestore listener: users/{uid}
  → onSnapshot() detects change
  → Update statistics state
  → Re-render cards
```

### Activity Tracking
```
User performs action (e.g., creates map)
  → trackActivity() function called
  → Add document to users/{uid}/activities
     {
       type: 'map_created',
       mapId: string,
       topic: string,
       timestamp: Timestamp
     }
  → Update statistics:
     - Increment mapsCreated
     - Update currentStreak (if new day)
     - Update longestStreak (if applicable)
  → Real-time listener updates UI
```

### Streak Calculation
```
trackActivity() called
  → Get lastActivityDate from Firestore
  → Calculate daysSinceLastActivity
  → If same day: No change
  → If next day: Increment currentStreak
  → If gap > 1 day: Reset currentStreak to 1
  → Update longestStreak if currentStreak > longestStreak
  → Save to Firestore
```

---

## Firestore Schema

### User Document
**Path**: `users/{uid}`

```typescript
{
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastActivityDate?: Timestamp;
  statistics: {
    mapsCreated: number;
    currentStreak: number;
    longestStreak: number;
    totalNodes: number;
    totalImages: number;
    totalStudyTime: number; // In minutes
  };
}
```

### Activity Document
**Path**: `users/{uid}/activities/{activityId}`

```typescript
{
  type: 'map_created' | 'node_expanded' | 'image_generated' | 'map_translated' | 'map_published';
  mapId?: string;
  topic?: string;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}
```

---

## User Flows

### Flow 1: Viewing Profile
```
1. User navigates to /profile
2. Load user data from Firestore
3. Display statistics cards
4. Render activity chart
5. Show recent activity feed
```

### Flow 2: Updating Profile
```
1. User clicks "Edit Profile"
2. Form appears with current values
3. User edits name/photo
4. User clicks "Save Changes"
5. Firebase updateProfile()
6. Firestore update
7. Toast: "Profile updated"
8. UI re-renders
```

### Flow 3: Managing API Key
```
1. User enters API key
2. User clicks "Save API Key"
3. Store in localStorage
4. User clicks "Test API Key"
5. API call to Gemini
6. Toast: "API key is valid" or error
```

### Flow 4: Deleting Account
```
1. User clicks "Delete Account"
2. Confirmation dialog appears
3. User confirms deletion
4. Delete all user data from Firestore
5. Delete Firebase Auth account
6. Redirect to /
7. Toast: "Account deleted"
```

---

## UI States

### Loading States
1. **Initial Load**: Skeleton cards for statistics
2. **Chart Loading**: Spinner while fetching activities

### Empty States
1. **No Activities**: "No recent activity" message
2. **No Statistics**: Default values (0)

### Error States
1. **Firestore Error**: Toast notification
2. **API Key Invalid**: Toast notification

---

## Code References

- [profile/page.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/app/profile/page.tsx)

---

## Summary

The Profile page provides **comprehensive user management**:
- **Statistics Dashboard**: Maps, streaks, nodes, images
- **Activity Chart**: 7-day visual history
- **Recent Activity Feed**: Last 10 actions
- **Profile Editing**: Name and photo updates
- **API Key Management**: Store, test, and remove keys
- **Account Actions**: Sign out and delete account

All features verified from code.
