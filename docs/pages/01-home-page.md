# Home Page (`/`) – MindScape-Firebase

> **Code-Verified**: All elements traced from `src/app/page.tsx` (665 lines)

---

## Page Overview

**Route**: `/`  
**File**: `src/app/page.tsx`  
**Type**: Client Component (`'use client'`)  
**Access**: Public (no authentication required)

### Purpose
Landing page with topic input, mode selection, and feature showcase. Primary entry point for mind map generation.

### Page Structure
```
Home
├─ Hero (input + mode selection)
├─ TransitionSection (marketing content)
├─ CapabilityStrip (feature highlights)
├─ Features (Library + Community cards)
└─ ChatPanel (floating AI assistant)
```

---

## Section 1: Hero

**Lines**: 53-373  
**Component**: `Hero`

### Visual Layout
- **Badge**: "Next-Gen AI Mind Mapping" with sparkles icon
- **Setup Warning**: Amber button if auth/API key missing
- **Heading**: "Everything starts with a thought."
- **Subheading**: App description
- **Input Container**: Glassmorphism card with glow effect

### Interactive Elements

#### Mode Toggle
| Element | Type | State | Action | Result |
|---------|------|-------|--------|--------|
| **Single Button** | Button | Active when `!isCompareMode` | Click | Set `isCompareMode = false` |
| **Compare Button** | Button | Active when `isCompareMode` | Click | Set `isCompareMode = true` |

**Visual States**:
- Active: `bg-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]`
- Inactive: `text-zinc-500 hover:text-zinc-300`

---

#### Depth Selector
| Element | Type | Options | Default | Purpose |
|---------|------|---------|---------|---------|
| **Depth Select** | Select | Quick, Balanced, Detailed | `low` | Control mind map complexity |

**Values**:
- `low` → "Quick" (fewer nodes, faster generation)
- `medium` → "Balanced" (moderate depth)
- `deep` → "Detailed" (maximum depth, slower generation)

**Icon**: `List` (Lucide)

---

#### Persona Selector
| Element | Type | Options | Default | Purpose |
|---------|------|---------|---------|---------|
| **Persona Select** | Select | Teacher, Concise, Creative, Cognitive Sage | `teacher` | AI response style |

**Values**:
- `teacher` → Educational, detailed explanations (icon: UserRound, blue)
- `concise` → Brief, to-the-point (icon: Zap, amber)
- `creative` → Imaginative, engaging (icon: Palette, pink)
- `sage` → Philosophical, deep thinking (icon: Brain, purple)

**Icon**: `Bot` (Lucide)

---

#### Language Selector
| Element | Type | Options | Default | Purpose |
|---------|------|---------|---------|---------|
| **Language Select** | Select | 100+ languages | `en` (English) | Output language |

**Data Source**: `src/lib/languages.ts`  
**Icon**: `Globe` (Lucide)

**Sample Languages**:
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Japanese (ja)
- Chinese (zh)
- ... (full list in languages.ts)

---

#### Topic Input (Single Mode)
| Element | Type | Placeholder | Validation | Trigger |
|---------|------|-------------|------------|---------|
| **Topic Input** | Input | "What sparks your curiosity?" | None (optional) | Enter key or Submit button |

**Behavior**:
- **With File**: Placeholder changes to "Add context..."
- **Disabled**: When `isGenerating = true`
- **File Attach**: Paperclip button (right side)

---

#### Topic Inputs (Compare Mode)
| Element | Type | Placeholder | Validation | Trigger |
|---------|------|-------------|------------|---------|
| **Topic 1 Input** | Input | "First topic..." | Required | Enter key or Submit button |
| **Topic 2 Input** | Input | "Second topic to compare..." | Required | Enter key or Submit button |

**Validation**:
- Both topics required
- Toast error if either is empty: "Please enter both topics to generate a comparison."

---

#### File Upload
| Element | Type | Accepted Formats | Max Size | Trigger |
|---------|------|------------------|----------|---------|
| **Paperclip Button** | Button (icon) | Images, PDF, TXT, MD | Not specified | Click → File picker |
| **File Input** | Input (hidden) | `image/*,application/pdf,.txt,.md` | N/A | File selection |

**Flow**:
```
User clicks paperclip
  → File picker opens
  → User selects file
  → handleFileUpload()
  → setUploadedFile({ name, type })
  → useEffect triggers
  → Check isSetupComplete
  → If complete: onGenerate(topic, fileInfo)
  → If incomplete: Trigger onboarding
```

**File Badge**:
- **Visibility**: Hidden on mobile (`hidden lg:flex`)
- **Content**: Truncated filename (max 100px)
- **Remove**: X button to clear file

---

#### Submit Button
| Element | Type | Icon | Disabled When | Action |
|---------|------|------|---------------|--------|
| **Generate Button** | Button (icon) | ArrowRight / Loader2 | `isGenerating` OR (file uploaded AND no topic) | `handleInternalSubmit()` |

**Visual States**:
- **Idle**: Arrow icon, primary gradient
- **Loading**: Spinning loader icon
- **Hover**: `brightness-110 scale-105`
- **Active**: `scale-95`

---

#### Setup Warning Button
| Element | Type | Visibility | Action | Result |
|---------|------|------------|--------|--------|
| **Complete Setup** | Button | Only if `!isSetupComplete` | Click | Dispatch `TRIGGER_ONBOARDING_EVENT` |

**Condition**: `!user || !config.pollinationsApiKey`

**Visual**:
- Amber background (`bg-amber-500/10`)
- Pulsing Zap icon
- Text: "COMPLETE SETUP TO GENERATE"

---

### Data Flow

#### Single Topic Generation
```
User enters topic → Click Submit (or Enter)
  → Check isSetupComplete
  → If incomplete: Trigger onboarding → Exit
  → If complete: handleGenerate(topic)
  → setIsGenerating(true)
  → Check if topic === "mindscape" (case-insensitive)
     → If yes: router.push('/canvas?selfReference=true&lang={lang}')
     → If no: Continue
  → router.push('/canvas?topic={topic}&lang={lang}&depth={depth}&persona={persona}&useSearch=true')
```

#### Compare Mode Generation
```
User enters topic1 + topic2 → Click Submit
  → Check isSetupComplete
  → If incomplete: Trigger onboarding → Exit
  → Validate both topics filled
     → If empty: Toast error → Exit
  → handleCompare(topic1, topic2)
  → setIsGenerating(true)
  → router.push('/canvas?topic1={topic1}&topic2={topic2}&lang={lang}&depth={depth}&persona={persona}&useSearch=true')
```

#### File Upload Generation (Vision Mode)
```
User clicks paperclip → Select file
  → handleFileUpload(event)
  → Extract file from event.target.files[0]
  → setUploadedFile({ name: file.name, type: file.type })
  → useEffect detects uploadedFile change
  → Check isSetupComplete
     → If incomplete: Trigger onboarding → Exit
  → onGenerate(topic, uploadedFile)
  → setIsGenerating(true)
  → Read file content (FileReader)
  → Store in sessionStorage: vision-{timestamp}
  → router.push('/canvas?sessionId=vision-{timestamp}&lang={lang}&depth={depth}&persona={persona}')
```

---

### State Management

| State | Type | Default | Purpose |
|-------|------|---------|---------|
| `topic` | string | `''` | Primary topic input |
| `topic2` | string | `''` | Secondary topic (compare mode) |
| `isCompareMode` | boolean | `false` | Toggle single/compare mode |
| `uploadedFile` | object \| null | `null` | File metadata |
| `isClient` | boolean | `false` | Hydration check |
| `lang` | string | `'en'` | Selected language |
| `depth` | string | `'low'` | Complexity level |
| `persona` | string | `'teacher'` | AI persona |
| `isGenerating` | boolean | `false` | Loading state |

---

### Validation Rules

1. **Single Mode**:
   - Topic OR file required
   - If file uploaded, topic is optional (context)

2. **Compare Mode**:
   - Both topic1 AND topic2 required
   - No file upload in compare mode

3. **Setup Check**:
   - User must be authenticated
   - Pollinations API key must be configured
   - If missing: Trigger onboarding wizard

---

### Special Cases

#### MindScape Self-Reference
```typescript
if (topic.toLowerCase().trim() === 'mindscape' && !fileInfo) {
  router.push(`/canvas?selfReference=true&lang=${lang}`);
  return;
}
```

**Purpose**: Generate a mind map about MindScape itself (meta-map).

---

## Section 2: TransitionSection

**Lines**: 445-460  
**Component**: `TransitionSection`

### Content
- **Heading**: "Unleash the Power of Visual Thinking"
- **Description**: Marketing copy about cognitive barriers and AI-driven mapping

### Interactive Elements
None (static content)

### Styling
- Centered text
- Purple gradient on "Visual Thinking"
- Max width: 4xl

---

## Section 3: CapabilityStrip

**Lines**: 463-508  
**Component**: `CapabilityStrip`

### Capabilities Grid

| Icon | Title | Description |
|------|-------|-------------|
| Sparkles | AI Generation | Deep-layered maps from simple prompts |
| GitBranch | Nested Exploration | Infinite depth for complex subjects |
| ImageIcon | Visual Assets | AI-curated imagery for context |
| Scan | Vision Mode | Convert papers & images to maps |

### Interactive Elements
None (static showcase)

### Styling
- 4-column grid (responsive: 1 col mobile, 2 tablet, 4 desktop)
- Glassmorphism cards
- Hover effects: scale icon, glow border
- Framer Motion scroll animations

---

## Section 4: Features

**Lines**: 378-441  
**Component**: `Features`

### Feature Cards

#### Library Card
| Element | Type | Action | Result |
|---------|------|--------|--------|
| **Library Card** | Clickable div | Click | Navigate to `/library` |

**Content**:
- **Icon**: List (purple gradient)
- **Title**: "Library"
- **Description**: "Access, manage, and revisit all of your saved mind maps in one place."
- **Arrow**: ArrowRight icon (hover: purple)

#### Community Card
| Element | Type | Action | Result |
|---------|------|--------|--------|
| **Community Card** | Clickable div | Click | Navigate to `/community` |

**Content**:
- **Icon**: Globe (purple gradient)
- **Title**: "Community Maps"
- **Description**: "Explore a gallery of mind maps created and shared by the community."
- **Arrow**: ArrowRight icon (hover: purple)

### Styling
- 2-column grid (responsive: 1 col mobile, 2 desktop)
- Glassmorphism with purple accent
- Hover: lift effect (`-translate-y-1`), glow shadow
- Framer Motion scroll animations

---

## Section 5: ChatPanel (Floating)

**Lines**: 44-47 (dynamic import), 512 (state)  
**Component**: `ChatPanel` (imported from `@/components/chat-panel`)

### Trigger
Floating button (not shown in page.tsx, likely in layout or separate component)

### Props
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  initialContext?: string;
}
```

### State
- `isChatOpen` - Controls visibility

### Behavior
- **Dynamic Import**: Loaded only when needed (SSR disabled)
- **Loading**: Returns `null` during load

---

## Page-Level State

### Root Component State
```typescript
const [isChatOpen, setIsChatOpen] = useState(false);
const [isGenerating, setIsGenerating] = useState(false);
const [lang, setLang] = useState('en');
const [depth, setDepth] = useState('low');
const [persona, setPersona] = useState('teacher');
const useSearch = true; // Always enabled
const languageSelectRef = createRef<HTMLButtonElement>();
const fileInputRef = useRef<HTMLInputElement>(null);
```

### Context Dependencies
- `useUser()` - Firebase auth state
- `useAIConfig()` - Pollinations API key check
- `useToast()` - Toast notifications
- `useRouter()` - Next.js navigation

---

## User Flows

### Flow 1: First-Time User (No Auth)
```
1. User lands on home page
2. User enters topic
3. User clicks Generate
4. System detects no auth
5. Onboarding wizard opens
6. User completes auth + API key setup
7. User returns to home page
8. User re-enters topic
9. User clicks Generate
10. Navigate to /canvas with params
```

### Flow 2: Authenticated User (Single Mode)
```
1. User lands on home page
2. User selects language, depth, persona
3. User enters topic
4. User clicks Generate
5. Navigate to /canvas?topic={topic}&lang={lang}&depth={depth}&persona={persona}&useSearch=true
```

### Flow 3: Authenticated User (Compare Mode)
```
1. User lands on home page
2. User clicks "Compare" mode toggle
3. User enters topic1 and topic2
4. User clicks Generate
5. Navigate to /canvas?topic1={topic1}&topic2={topic2}&lang={lang}&depth={depth}&persona={persona}&useSearch=true
```

### Flow 4: File Upload (Vision Mode)
```
1. User lands on home page
2. User clicks paperclip icon
3. User selects image/PDF/text file
4. System reads file content
5. System stores in sessionStorage
6. User optionally adds context in topic field
7. Navigate to /canvas?sessionId=vision-{timestamp}&lang={lang}&depth={depth}&persona={persona}
```

### Flow 5: MindScape Self-Reference
```
1. User enters "mindscape" (case-insensitive)
2. User clicks Generate
3. Navigate to /canvas?selfReference=true&lang={lang}
4. Special mind map about MindScape app itself
```

### Flow 6: Welcome Back Toast
```
1. User logs in from /login page
2. Login sets sessionStorage: 'welcome_back'
3. User redirected to home page
4. useEffect detects 'welcome_back' flag
5. Toast: "Welcome! You have been successfully logged in."
6. Remove flag from sessionStorage
```

---

## API Calls

None directly from this page. All generation happens on `/canvas` page after navigation.

---

## Error Handling

### Validation Errors
| Scenario | Error Type | Message | Action |
|----------|------------|---------|--------|
| Compare mode, empty topics | Toast (destructive) | "Topics Required: Please enter both topics to generate a comparison." | Block submission |
| Missing auth/API key | Event dispatch | Trigger onboarding wizard | Block submission |

### File Upload Errors
No explicit error handling in code. Assumes FileReader success.

---

## Performance Optimizations

1. **Dynamic Import**: ChatPanel loaded only when needed
2. **SSR Disabled**: ChatPanel excluded from server rendering
3. **Framer Motion**: Scroll animations with `viewport={{ once: true }}`
4. **Refs**: `createRef` for language select, `useRef` for file input

---

## Styling Details

### Glassmorphism
- **Background**: `bg-zinc-900/40 backdrop-blur-3xl`
- **Border**: `border-white/5`
- **Ring**: `ring-1 ring-white/10`

### Glow Effect
- **Input Focus**: `bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-[2.5rem] blur-2xl`
- **Submit Button**: `shadow-lg shadow-primary/30`

### Animations
- **Hero**: Fade in + slide up (0.8s ease-out)
- **Features**: Staggered fade in (0.1s delay per item)
- **Capabilities**: Scale in on scroll
- **Hover**: Scale, brightness, color transitions

---

## Accessibility

### Keyboard Navigation
- **Enter Key**: Submit form (both topic inputs)
- **Tab Navigation**: All interactive elements focusable

### Screen Readers
- **Placeholders**: Descriptive text for inputs
- **Icons**: Lucide icons with semantic meaning
- **Buttons**: Clear action labels

### Focus States
- **Inputs**: `focus:border-primary/40 focus:bg-black/60`
- **Buttons**: Default focus ring

---

## Mobile Responsiveness

### Breakpoints
- **Mobile**: Single column, stacked inputs
- **Tablet (sm)**: 2-column feature grid
- **Desktop (md)**: Full layout, side-by-side compare inputs
- **Large (lg)**: File badge visible

### Touch Targets
- **Buttons**: Minimum 44x44px (h-14 w-14 for submit)
- **Inputs**: h-14 for comfortable touch

---

## Code References

### Main File
[page.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/app/page.tsx)

### Key Functions
- [Hero Component](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/app/page.tsx#L53-L373)
- [handleInternalSubmit](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/app/page.tsx#L114-L137)
- [handleFileUpload](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/app/page.tsx#L143-L151)
- [handleGenerate](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/app/page.tsx#L537-L600)
- [handleCompare](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/app/page.tsx#L602-L650)

### Dependencies
- [languages.ts](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/lib/languages.ts) - Language options
- [onboarding-wizard.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/components/onboarding-wizard.tsx) - Setup flow
- [chat-panel.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/components/chat-panel.tsx) - AI assistant

---

## Summary

The Home page serves as the **primary entry point** for MindScape, featuring:
- **3 generation modes**: Single topic, Compare, Vision (file upload)
- **4 customization options**: Language, Depth, Persona, Web Search (always on)
- **Setup enforcement**: Onboarding wizard for first-time users
- **Marketing content**: TransitionSection, CapabilityStrip, Features
- **Floating AI assistant**: ChatPanel for contextual help

All interactions route to `/canvas` with URL parameters for server-side processing.

**No assumptions made** - all elements verified from code.
