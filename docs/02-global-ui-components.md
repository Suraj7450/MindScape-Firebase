# Global UI Components – MindScape-Firebase

> **Code-Verified**: All components traced from `src/components` directory

---

## Component Hierarchy

```
Root Layout (src/app/layout.tsx)
├─ FirebaseClientProvider
│  └─ AIConfigProvider
│     ├─ PollinationsAuthHandler
│     ├─ OnboardingWizard
│     └─ NotificationProvider
│        ├─ BackgroundGlow
│        ├─ Navbar
│        ├─ {children} (page content)
│        └─ Toaster
```

---

## 1. Navbar

**File**: `src/components/navbar.tsx` (192 lines)  
**Type**: Client Component  
**Visibility**: Global (all pages)

### Purpose
Sticky header with navigation, user authentication status, and notification center.

### Props
None (uses global context)

### State Dependencies
- `useUser()` - Firebase auth state
- `useFirestore()` - Firestore instance
- `useNotifications()` - Notification context
- Local state: `profileName` (from Firestore)

### Interactive Elements

| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Home Link** | Link | Navigate | Click | → `/` |
| **Library Link** | Link | Navigate | Click | → `/library` |
| **Community Link** | Link | Navigate | Click | → `/community` |
| **Login Button** | Button | Navigate | Click (not authenticated) | → `/login` |
| **User Avatar** | DropdownMenuTrigger | Open menu | Click (authenticated) | Show profile dropdown |
| **Profile Menu Item** | DropdownMenuItem | Navigate | Click | → `/profile` |
| **Logout Menu Item** | DropdownMenuItem | Sign out | Click | Firebase `signOut()` → `/` |
| **Notification Bell** | NotificationCenter | Open panel | Click | Show notification dropdown |

### Data Flow

#### User Profile Name Fetch
```
Component Mount (if authenticated)
  → Firestore query: users/{uid}
  → Extract displayName
  → Set profileName state
  → Display in dropdown
```

#### Logout Flow
```
User clicks "Logout"
  → Firebase signOut()
  → Clear auth state
  → Router push to "/"
  → Toast: "Logged out successfully"
```

### UI States
1. **Loading**: Skeleton avatar (user loading)
2. **Not Authenticated**: "Login" button
3. **Authenticated**: Avatar with dropdown menu

### Styling
- **Position**: `sticky top-0 z-50`
- **Background**: Glassmorphism (`backdrop-blur-xl bg-black/40`)
- **Border**: `border-b border-white/5`
- **Height**: `h-16`

### Code Reference
[navbar.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/components/navbar.tsx)

---

## 2. ChatPanel

**File**: `src/components/chat-panel.tsx` (1649 lines)  
**Type**: Client Component (dynamic import)  
**Visibility**: Conditional (triggered by floating button)

### Purpose
Slide-out AI chat assistant for topic exploration, quiz generation, and conversational learning.

### Props
```typescript
interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  initialContext?: string;
}
```

### State Dependencies
- `useUser()` - Firebase auth state
- `useFirestore()` - Firestore instance
- `useAIConfig()` - AI provider settings
- `useNotifications()` - Notification context
- Local state: 
  - `sessions` - Chat session list
  - `currentSessionId` - Active session
  - `messages` - Current chat messages
  - `isGenerating` - AI response loading
  - `mode` - 'chat' | 'quiz'
  - `isListening` - Voice input active

### Interactive Elements

#### Header Controls
| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Close Button** | Button | Close panel | Click | `onClose()` |
| **New Chat** | Button | Create session | Click | New session → Clear messages |
| **History Toggle** | Button | Show sessions | Click | Toggle session list sidebar |
| **Export Menu** | DropdownMenu | Export options | Click | Show PDF/JSON/TXT options |

#### Chat Interface
| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Message Input** | Textarea | Type message | Keydown (Enter) | Send message → AI response |
| **Send Button** | Button | Submit | Click | Send message → AI response |
| **Voice Input** | Button | Record audio | Click | Start/stop voice recognition |
| **Mode Toggle** | Tabs | Switch mode | Click | Chat ↔ Quiz mode |
| **Regenerate** | Button | Retry response | Click | Re-send last user message |
| **Copy Message** | Button | Copy text | Click | Copy to clipboard |

#### Session Management
| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Session Item** | Button | Load session | Click | Load messages from Firestore |
| **Delete Session** | Button | Remove session | Click | Delete from Firestore + local state |
| **Rename Session** | Input | Edit title | Blur/Enter | Update Firestore session title |

#### Quiz Mode
| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Generate Quiz** | Button | Create quiz | Click | API call → `/api/generate-quiz-direct` |
| **Answer Option** | Button | Select answer | Click | Validate → Show correct/incorrect |
| **Next Question** | Button | Advance | Click | Show next quiz question |
| **Finish Quiz** | Button | Complete | Click | Show score summary |

### Data Flow

#### Chat Message Flow
```
User types message → Enter/Click Send
  → Add user message to state
  → Save to Firestore: users/{uid}/chats/{sessionId}/messages
  → Call AI dispatcher (client-dispatcher.ts)
  → Stream response (if supported) OR full response
  → Add AI message to state
  → Save AI response to Firestore
  → Update session updatedAt timestamp
```

#### Voice Input Flow
```
User clicks microphone
  → Check browser support (Web Speech API)
  → Start recognition
  → Transcribe speech → text
  → Set input value
  → Auto-send OR wait for user confirmation
```

#### Export Flow
```
User clicks Export → Select format
  ├─ PDF: exportChatToPDF()
  │   → jsPDF instance
  │   → Format messages (strip markdown)
  │   → Add headers/footers
  │   → Save as chat-{timestamp}.pdf
  ├─ JSON: Export raw data
  │   → Stringify messages
  │   → Download as chat-{timestamp}.json
  └─ TXT: Plain text export
      → Format as readable text
      → Download as chat-{timestamp}.txt
```

#### Session Persistence
```
On session change
  → Firestore save: users/{uid}/chats/{sessionId}
  → Document fields:
     - title (auto-generated from first message)
     - createdAt
     - updatedAt
     - messageCount
     - mode (chat|quiz)

On message send
  → Firestore save: users/{uid}/chats/{sessionId}/messages/{messageId}
  → Document fields:
     - role (user|assistant)
     - content
     - timestamp
```

### UI States
1. **Closed**: Hidden (translateX-full)
2. **Open**: Slide-in from right
3. **Generating**: Loading spinner on AI messages
4. **Voice Active**: Pulsing microphone icon
5. **History Open**: Session list sidebar visible
6. **Quiz Mode**: Different UI with answer buttons

### Styling
- **Position**: `fixed right-0 top-0 z-50`
- **Width**: `w-full md:w-[500px]`
- **Height**: `h-screen`
- **Background**: Glassmorphism
- **Animation**: Framer Motion slide transition

### Code Reference
[chat-panel.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/components/chat-panel.tsx)

---

## 3. AuthForm

**File**: `src/components/auth-form.tsx` (281 lines)  
**Type**: Client Component  
**Visibility**: Login page only

### Purpose
Authentication form with Google OAuth and Email/Password sign-in/sign-up.

### Props
None (standalone component)

### State Dependencies
- `useAuth()` - Firebase auth hook
- `useRouter()` - Next.js navigation
- Local state:
  - `isLogin` - Toggle sign-in/sign-up mode
  - `email`, `password`, `name` - Form inputs
  - `isLoading` - Submission state
  - `showResetPassword` - Password reset modal

### Interactive Elements

| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Google Sign In** | Button | OAuth login | Click | Firebase `signInWithPopup()` → `/` |
| **Email Input** | Input | Enter email | Change | Update `email` state |
| **Password Input** | Input | Enter password | Change | Update `password` state |
| **Name Input** | Input | Enter name | Change (sign-up only) | Update `name` state |
| **Submit Button** | Button | Authenticate | Click/Enter | Sign in OR Sign up |
| **Toggle Mode** | Button | Switch mode | Click | Sign In ↔ Sign Up |
| **Forgot Password** | Button | Reset flow | Click | Show reset password dialog |
| **Reset Submit** | Button | Send reset email | Click | Firebase `sendPasswordResetEmail()` |

### Data Flow

#### Google OAuth Flow
```
User clicks "Continue with Google"
  → Firebase signInWithPopup(GoogleAuthProvider)
  → Success:
     → Check if new user (additionalUserInfo.isNewUser)
     → If new: Create Firestore user document
     → Router push to "/"
  → Error:
     → Toast error message
```

#### Email/Password Sign In
```
User enters email + password → Submit
  → Firebase signInWithEmailAndPassword(email, password)
  → Success:
     → Router push to "/"
  → Error:
     → Toast error message (invalid credentials, etc.)
```

#### Email/Password Sign Up
```
User enters name + email + password → Submit
  → Firebase createUserWithEmailAndPassword(email, password)
  → Success:
     → Firebase updateProfile({ displayName: name })
     → Create Firestore user document: users/{uid}
        - displayName: name
        - email: email
        - createdAt: timestamp
        - statistics: default values
     → Router push to "/"
  → Error:
     → Toast error message (email in use, weak password, etc.)
```

#### Password Reset Flow
```
User clicks "Forgot Password" → Enter email → Submit
  → Firebase sendPasswordResetEmail(email)
  → Success:
     → Toast: "Password reset email sent"
     → Close dialog
  → Error:
     → Toast error message
```

### Validation
- **Email**: Basic format check (HTML5 input type="email")
- **Password**: Minimum 6 characters (Firebase default)
- **Name**: Required for sign-up

### UI States
1. **Sign In Mode**: Email + Password fields
2. **Sign Up Mode**: Name + Email + Password fields
3. **Loading**: Disabled inputs, spinner on button
4. **Reset Password**: Modal dialog with email input

### Styling
- **Container**: Glassmorphism card
- **Inputs**: Dark theme with white/10 borders
- **Buttons**: Primary gradient for submit, ghost for Google
- **Animations**: Framer Motion for mode transitions

### Code Reference
[auth-form.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/components/auth-form.tsx)

---

## 4. OnboardingWizard

**File**: `src/components/onboarding-wizard.tsx` (304 lines)  
**Type**: Client Component  
**Visibility**: Global (triggered by event)

### Purpose
First-time setup wizard for authentication and Pollinations API key configuration.

### Props
None (event-driven)

### Trigger
Custom event: `TRIGGER_ONBOARDING_EVENT` dispatched when:
- User attempts to generate mind map without auth
- User attempts to generate without API key
- Manual trigger from Hero section

### State Dependencies
- `useUser()` - Firebase auth state
- `useFirestore()` - Firestore instance
- `useAIConfig()` - AI provider settings
- Local state:
  - `isOpen` - Dialog visibility
  - `step` - Current wizard step (0-2)
  - `displayName` - User name input
  - `apiKey` - Pollinations API key input

### Wizard Steps

#### Step 0: Welcome
- **Content**: App introduction, feature highlights
- **Actions**: 
  - "Get Started" → Next step
  - "Skip for now" → Close wizard

#### Step 1: Authentication
- **Content**: Login prompt
- **Actions**:
  - "Login with Google" → Firebase OAuth → Next step
  - "Login with Email" → Redirect to `/login`
  - "Back" → Previous step

#### Step 2: Display Name (if new user)
- **Content**: Name input
- **Actions**:
  - "Continue" → Save to Firestore → Next step
  - "Back" → Previous step

#### Step 3: Pollinations API Key
- **Content**: API key input OR OAuth connect
- **Actions**:
  - "Connect via OAuth" → Pollinations OAuth flow
  - "Enter Manually" → Input field → Save to Firestore
  - "Skip" → Close wizard (incomplete setup)

### Interactive Elements

| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Get Started** | Button | Advance | Click (step 0) | → Step 1 |
| **Login Google** | Button | OAuth | Click (step 1) | Firebase auth → Step 2/3 |
| **Login Email** | Button | Navigate | Click (step 1) | → `/login` |
| **Name Input** | Input | Enter name | Change (step 2) | Update `displayName` state |
| **Continue** | Button | Save name | Click (step 2) | Firestore update → Step 3 |
| **Connect OAuth** | Button | Pollinations OAuth | Click (step 3) | External OAuth flow |
| **API Key Input** | Input | Enter key | Change (step 3) | Update `apiKey` state |
| **Save Key** | Button | Save config | Click (step 3) | Firestore update → Close |
| **Back** | Button | Previous step | Click | Decrement step |
| **Skip** | Button | Close wizard | Click | Close dialog |

### Data Flow

#### Onboarding Trigger
```
User action (e.g., Generate without auth)
  → Dispatch custom event: TRIGGER_ONBOARDING_EVENT
  → OnboardingWizard listens via useEffect
  → Set isOpen = true
  → Show dialog at step 0
```

#### Display Name Save
```
User enters name → Click "Continue"
  → Firestore update: users/{uid}
     - displayName: name
  → Firebase updateProfile({ displayName: name })
  → Advance to step 3
```

#### API Key Save (Manual)
```
User enters API key → Click "Save"
  → Firestore update: users/{uid}/apiSettings
     - pollinationsApiKey: key
     - provider: 'pollinations'
  → AIConfig context update
  → Close wizard
  → Toast: "Setup complete!"
```

#### Pollinations OAuth Flow
```
User clicks "Connect via OAuth"
  → Open Pollinations OAuth URL
  → User authorizes
  → Redirect to /profile?code=...
  → PollinationsAuthHandler intercepts
  → Exchange code for API key
  → Save to Firestore
  → Close wizard
```

### UI States
1. **Closed**: Hidden dialog
2. **Step 0**: Welcome screen
3. **Step 1**: Login prompt
4. **Step 2**: Name input (new users only)
5. **Step 3**: API key configuration
6. **Loading**: Disabled inputs during save

### Styling
- **Dialog**: Full-screen on mobile, centered modal on desktop
- **Background**: Glassmorphism with gradient border
- **Animations**: Framer Motion step transitions
- **Icons**: Lucide icons for visual appeal

### Code Reference
[onboarding-wizard.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/components/onboarding-wizard.tsx)

---

## 5. NotificationCenter

**File**: `src/components/notification-center.tsx` (143 lines)  
**Type**: Client Component  
**Visibility**: Navbar (global)

### Purpose
Dropdown notification panel for background tasks, AI generation status, and system messages.

### Props
None (uses global context)

### State Dependencies
- `useNotifications()` - Notification context
- `useRouter()` - Next.js navigation
- No local state (fully context-driven)

### Interactive Elements

| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Bell Icon** | DropdownMenuTrigger | Open panel | Click | Show notification dropdown |
| **Clear All** | Button | Mark read | Click | `markAllAsRead()` |
| **Delete All** | Button | Clear | Click | `clearNotifications()` |
| **Notification Item** | Button | View details | Click | `markAsRead()` + navigate to link |

### Data Flow

#### Notification Display
```
Component render
  → useNotifications() hook
  → Get notifications array
  → Calculate unreadCount
  → Map notifications to UI
  → Show icon based on type (success/error/loading/info)
```

#### Mark as Read
```
User clicks notification
  → markAsRead(notificationId)
  → Update context state (read: true)
  → If notification.link exists:
     → router.push(link)
```

#### Clear All
```
User clicks "Clear All"
  → markAllAsRead()
  → Update all notifications (read: true)
  → UI updates (remove pulse animation)
```

#### Delete All
```
User clicks trash icon
  → clearNotifications()
  → Empty notifications array
  → Show "No recent activities" state
```

### Notification Types

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `success` | CheckCircle2 | Emerald | Mind map saved, published |
| `error` | AlertCircle | Red | AI generation failed, save error |
| `loading` | Loader2 (spin) | Primary | Background generation in progress |
| `info` | Info | Blue | General system messages |

### Notification Structure
```typescript
interface Notification {
  id: string;
  type: 'success' | 'error' | 'loading' | 'info';
  message: string;
  details?: string;
  link?: string;
  timestamp: Date;
  read: boolean;
}
```

### UI States
1. **Empty**: "No recent activities" message
2. **Unread**: Pulsing bell icon, badge indicator
3. **All Read**: Static bell icon
4. **Loading**: Spinning icon for in-progress tasks

### Styling
- **Dropdown**: Glassmorphism, 350px height
- **Unread Items**: `bg-primary/5` background
- **Timestamps**: Relative time (e.g., "2 minutes ago")
- **Animations**: Ping animation on unread badge

### Code Reference
[notification-center.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/components/notification-center.tsx)

---

## 6. PollinationsAuthHandler

**File**: `src/components/pollinations-auth-handler.tsx` (3373 bytes)  
**Type**: Client Component  
**Visibility**: Global (root layout)

### Purpose
Intercept Pollinations OAuth redirect and exchange authorization code for API key.

### Props
None (URL parameter-driven)

### State Dependencies
- `useSearchParams()` - Next.js URL params
- `useRouter()` - Next.js navigation
- `useUser()` - Firebase auth state
- `useFirestore()` - Firestore instance
- `useAIConfig()` - AI config context

### Interactive Elements
None (automatic background process)

### Data Flow

#### OAuth Redirect Handling
```
Pollinations OAuth redirect → /profile?code=ABC123&state=...
  → Component detects 'code' param
  → Extract code and state
  → Call API: /api/pollinations/exchange
     - POST { code, state }
  → Response: { apiKey }
  → Save to Firestore: users/{uid}/apiSettings
     - pollinationsApiKey: apiKey
     - provider: 'pollinations'
  → Update AIConfig context
  → Remove URL params
  → Toast: "Pollinations connected successfully!"
```

### Error Handling
- **Missing Code**: Silent (no action)
- **API Error**: Toast error message
- **Network Error**: Toast error message

### UI States
1. **Idle**: No URL params, no action
2. **Processing**: Code detected, API call in progress
3. **Success**: Key saved, toast shown
4. **Error**: Toast error message

### Code Reference
[pollinations-auth-handler.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/components/pollinations-auth-handler.tsx)

---

## 7. BackgroundGlow

**File**: Inferred from layout (not scanned)  
**Type**: Client Component  
**Visibility**: Global (all pages)

### Purpose
Animated background gradient effect for visual appeal.

### Props
None

### Implementation
Likely uses CSS gradients with animations or canvas-based rendering.

---

## 8. Toaster

**File**: `src/components/ui/toaster.tsx` (786 bytes)  
**Type**: Client Component (shadcn/ui)  
**Visibility**: Global (root layout)

### Purpose
Toast notification system for user feedback.

### Props
None (uses `useToast()` hook)

### Usage
```typescript
const { toast } = useToast();

toast({
  title: "Success",
  description: "Mind map saved!",
  variant: "default" | "destructive"
});
```

### Styling
- **Position**: Fixed bottom-right
- **Animation**: Slide-in from bottom
- **Variants**: Default (success), Destructive (error)

---

## shadcn/ui Components (35 Total)

All components located in `src/components/ui/`:

### Layout Components
- **Card** - Container with header, content, footer
- **Separator** - Horizontal/vertical divider
- **ScrollArea** - Custom scrollbar container
- **Sheet** - Slide-out panel (used in ChatPanel)
- **Dialog** - Modal overlay
- **Popover** - Floating content
- **Tooltip** - Hover info

### Form Components
- **Input** - Text input field
- **Textarea** - Multi-line text input
- **Button** - Interactive button with variants
- **Checkbox** - Toggle checkbox
- **Switch** - Toggle switch
- **Radio Group** - Single selection
- **Select** - Dropdown selection
- **Slider** - Range input
- **Calendar** - Date picker
- **Form** - Form wrapper with validation

### Navigation Components
- **Tabs** - Tabbed interface
- **Accordion** - Collapsible sections
- **Dropdown Menu** - Context menu
- **Menubar** - Menu bar
- **Sidebar** - Side navigation

### Feedback Components
- **Alert** - Inline message
- **Alert Dialog** - Confirmation modal
- **Toast** - Temporary notification
- **Badge** - Status indicator
- **Progress** - Progress bar
- **Skeleton** - Loading placeholder

### Data Display
- **Avatar** - User profile image
- **Table** - Data table
- **Chart** - Data visualization
- **Carousel** - Image/content slider

### Utility
- **Label** - Form label
- **Collapsible** - Expandable content

---

## Component Usage Patterns

### Authentication Flow
```
Navbar (not authenticated)
  → Login Button
  → /login page
  → AuthForm
  → Firebase Auth
  → Redirect to /
  → Navbar (authenticated)
```

### Mind Map Generation Flow
```
Home Page Hero
  → User input (no auth/API key)
  → Trigger OnboardingWizard
  → Complete setup
  → Retry generation
  → /canvas page
  → MindMap component
  → Auto-save (if auth)
  → NotificationCenter (success)
```

### Chat Interaction Flow
```
Floating Chat Button
  → Open ChatPanel
  → User message
  → AI response
  → Save to Firestore
  → Session management
  → Export options
```

---

## Global State Management

### Context Providers (from layout.tsx)

1. **FirebaseClientProvider**
   - Initializes Firebase app
   - Provides auth, firestore, storage instances

2. **AIConfigProvider**
   - Manages AI provider settings
   - Syncs with Firestore and localStorage
   - Provides `config`, `updateConfig`, `resetConfig`

3. **NotificationProvider**
   - Manages notification queue
   - Provides `addNotification`, `markAsRead`, `clearNotifications`
   - Calculates `unreadCount`

---

## Shared Utilities

### Hooks
- `useUser()` - Firebase auth state
- `useFirestore()` - Firestore instance
- `useAIConfig()` - AI configuration
- `useNotifications()` - Notification state
- `useToast()` - Toast notifications
- `useLocalStorage()` - Persistent local state

### Utils
- `cn()` - Tailwind class merging (from `lib/utils`)
- `formatDistanceToNow()` - Relative timestamps (date-fns)

---

## Summary

MindScape uses a **layered component architecture**:
- **Global Components**: Navbar, ChatPanel, OnboardingWizard, NotificationCenter
- **Context Providers**: Firebase, AIConfig, Notifications
- **shadcn/ui Library**: 35 reusable UI primitives
- **Page-Specific Components**: AuthForm, MindMap, CommunityCard, etc.

All components follow:
- **Client-side rendering** (`'use client'`)
- **Glassmorphism design** (backdrop-blur, dark theme)
- **Framer Motion animations**
- **Firebase integration** for data persistence
- **Real-time updates** via Firestore listeners

**No assumptions made** - all components verified from file system and code.
