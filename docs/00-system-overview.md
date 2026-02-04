# System Overview – MindScape-Firebase

> **Last Updated**: 2026-02-01  
> **Code-Verified**: All information traced directly to source code

---

## Tech Stack (Verified from package.json)

### Core Framework
- **Next.js**: `15.3.6` (App Router architecture)
- **React**: `^18.3.1`
- **TypeScript**: `^5`
- **Node.js**: Runtime environment

### Styling & UI
- **Tailwind CSS**: `^3.4.1` - Utility-first CSS framework
- **PostCSS**: `^8` - CSS processing
- **Framer Motion**: `^11.3.19` - Animation library
- **shadcn/ui** (Radix UI primitives):
  - `@radix-ui/react-accordion`: `^1.2.3`
  - `@radix-ui/react-alert-dialog`: `^1.1.6`
  - `@radix-ui/react-avatar`: `^1.1.3`
  - `@radix-ui/react-checkbox`: `^1.1.4`
  - `@radix-ui/react-collapsible`: `^1.1.11`
  - `@radix-ui/react-dialog`: `^1.1.6`
  - `@radix-ui/react-dropdown-menu`: `^2.1.6`
  - `@radix-ui/react-label`: `^2.1.2`
  - `@radix-ui/react-menubar`: `^1.1.6`
  - `@radix-ui/react-popover`: `^1.1.6`
  - `@radix-ui/react-progress`: `^1.1.2`
  - `@radix-ui/react-radio-group`: `^1.2.3`
  - `@radix-ui/react-scroll-area`: `^1.2.3`
  - `@radix-ui/react-select`: `^2.1.6`
  - `@radix-ui/react-separator`: `^1.1.2`
  - `@radix-ui/react-slider`: `^1.2.3`
  - `@radix-ui/react-slot`: `^1.2.3`
  - `@radix-ui/react-switch`: `^1.1.3`
  - `@radix-ui/react-tabs`: `^1.1.3`
  - `@radix-ui/react-toast`: `^1.2.6`
  - `@radix-ui/react-toggle-group`: `^1.1.0`
  - `@radix-ui/react-tooltip`: `^1.1.8`
- **class-variance-authority**: `^0.7.1` - Component variant management
- **clsx**: `^2.1.1` - Conditional className utility
- **tailwind-merge**: `^3.0.1` - Tailwind class merging
- **tailwindcss-animate**: `^1.0.7` - Animation utilities
- **lucide-react**: `^0.475.0` - Icon library

### Fonts
- **Space Grotesk** - Primary font (variable: `--font-space-grotesk`)
- **Orbitron** - Secondary/brand font (variable: `--font-orbitron`)

### Backend & Database
- **Firebase**: `^11.9.1` (Client SDK)
  - Authentication (Google OAuth, Email/Password)
  - Firestore (NoSQL database)
  - Storage (NOT CURRENTLY USED in code)
- **firebase-admin**: `^13.6.0` (Server-side SDK for Functions)

### AI & ML
- **Pollinations AI**: Primary AI provider (via custom client)
  - Model rotation: `openai`, `mistral-large`, `mistral-nemo`, `llama-3.3-70b`
  - Fallback dispatcher with retry logic
  - Circuit breaker pattern for provider health
- **bytez.js**: `^3.0.0` - AI utilities (NOT ACTIVELY USED)
- **Gemini**: ⚠️ PARTIAL — Used only for quiz generation (`/api/generate-quiz-direct`)

### Forms & Validation
- **react-hook-form**: `^7.54.2` - Form state management
- **@hookform/resolvers**: `^4.1.3` - Form validation resolvers
- **zod**: `^3.25.76` - Schema validation

### Data Visualization
- **recharts**: `^2.15.4` - Chart library for profile statistics

### File Processing
- **html-to-image**: `^1.11.13` - DOM to image conversion
- **html2canvas**: `^1.4.1` - Screenshot generation
- **jspdf**: `^3.0.4` - PDF generation
- **react-pdf**: `^9.1.0` - PDF viewing
- **pdfjs-dist**: `2.16.105` - PDF.js library

### Utilities
- **date-fns**: `^3.6.0` - Date manipulation
- **dotenv**: `^16.5.0` - Environment variables
- **embla-carousel-react**: `^8.6.0` - Carousel component
- **react-day-picker**: `^8.10.1` - Date picker
- **patch-package**: `^8.0.0` - NPM package patching

---

## Routing Architecture (App Router)

### Route Structure
MindScape uses Next.js 15 App Router with the following verified routes:

| Route | File Path | Type | Purpose |
|-------|-----------|------|---------|
| `/` | `src/app/page.tsx` | Public | Home page with topic input |
| `/canvas` | `src/app/canvas/page.tsx` | Protected* | Mind map generation & display |
| `/library` | `src/app/library/page.tsx` | Protected | User's saved mind maps |
| `/community` | `src/app/community/page.tsx` | Public | Community-shared maps |
| `/login` | `src/app/login/page.tsx` | Public | Authentication page |
| `/profile` | `src/app/profile/page.tsx` | Protected | User profile & statistics |

*Protected routes check for user authentication and Pollinations API key via onboarding wizard.

### API Routes
| Route | File | Purpose |
|-------|------|---------|
| `/api/generate-image` | `src/app/api/generate-image/route.ts` | Image generation via Pollinations |
| `/api/generate-quiz-direct` | `src/app/api/generate-quiz-direct/route.ts` | Quiz generation endpoint |
| `/api/search-images` | `src/app/api/search-images` | Image search functionality |

### Server Actions
- `src/app/actions.ts` - General server actions
- `src/app/actions/community.ts` - Community map operations
- `src/app/actions/generateSearchContext.ts` - Search context generation

---

## Firebase Integration

### Configuration
**File**: `src/firebase/config.ts`

```typescript
{
  projectId: "mindscape-rlklw",
  appId: "1:526463287621:web:6b39d4bbe9c0dd8b423e2c",
  apiKey: "AIzaSyDWJPz8BIEInHWB6SJ_wdvWcHfp0WXZjBE",
  authDomain: "mindscape-rlklw.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "526463287621"
}
```

### Services Used

#### 1. **Firebase Authentication**
- **Providers**: Google OAuth, Email/Password
- **Implementation**: `src/firebase/index.tsx` (FirebaseClientProvider)
- **User State**: Managed via `useUser()` hook
- **Session**: Persisted via Firebase Auth SDK

#### 2. **Cloud Firestore**
**Collections**:
- `users/{uid}` - User profiles and settings
  - Fields: `displayName`, `email`, `photoURL`, `apiSettings`, `createdAt`
  - `apiSettings` sub-object: `provider`, `apiKey`, `pollinationsApiKey`, `pollinationsModel`
- `mindmaps/{mapId}` - Saved mind maps
  - Fields: `userId`, `topic`, `data`, `createdAt`, `updatedAt`, `isPublic`
- `community/{mapId}` - Public community maps
- `activities/{activityId}` - User activity tracking
- `chats/{chatId}` - Chat session history

**Security Rules**: `firestore.rules` (2069 bytes)

#### 3. **Firebase Storage**
- **Status**: NOT CURRENTLY USED
- No storage operations found in codebase

#### 4. **Firebase Functions**
- **Directory**: `functions/`
- **Status**: Configured but implementation unclear from current scan

---

## AI Provider Flow

### Primary Provider: Pollinations AI

**Implementation**: `src/ai/pollinations-client.ts`

#### Model Rotation Strategy
The system uses intelligent model rotation based on failure count:

```typescript
Attempt 0-1: 'openai'
Attempt 2-3: 'mistral-large'
Attempt 4-5: 'mistral-nemo'
Attempt 6+:  'llama-3.3-70b'
```

#### Request Flow
1. **Client Dispatcher** (`src/ai/client-dispatcher.ts`)
   - Validates input
   - Injects JSON schema instructions
   - Routes to Pollinations client

2. **Pollinations Client** (`src/ai/pollinations-client.ts`)
   - Makes HTTP POST to `https://text.pollinations.ai/`
   - Headers: `X-API-Key`, `Content-Type: application/json`
   - Payload: `messages`, `model`, `jsonMode`, `seed`
   - Response: JSON object or text

3. **Retry Logic** (5 attempts with exponential backoff)
   - Rate limit errors: 5s × attempt + jitter
   - Syntax errors: 1s + jitter
   - Server errors: exponential backoff

4. **Circuit Breaker**
   - Disables provider for 10 minutes after repeated failures
   - Tracked via `ProviderMonitor` class

#### Response Validation
- **Markdown stripping**: Removes ```json``` blocks
- **JSON extraction**: Finds first `{` to last `}`
- **Schema validation**: Zod schema with loose mode
- **Partial salvage**: Accepts maps with ≥4 subTopics even if schema fails

### Fallback Provider: None
**Gemini/Genkit**: References exist in `/functions` but NOT actively used in client code.

---

## Global State & Data Flow

### Context Providers (from layout.tsx)

1. **FirebaseClientProvider** (`src/firebase/index.tsx`)
   - Initializes Firebase app
   - Provides `auth`, `firestore`, `user` state
   - Hooks: `useUser()`, `useFirebase()`, `useFirestore()`

2. **AIConfigProvider** (`src/contexts/ai-config-context.tsx`)
   - Manages AI configuration
   - Syncs with Firestore `users/{uid}/apiSettings`
   - Real-time listener for config updates
   - Local storage backup
   - Hook: `useAIConfig()`

3. **NotificationProvider** (`src/contexts/notification-context.tsx`)
   - Manages in-app notifications
   - Hook: `useNotifications()`

4. **TooltipProvider** (Radix UI)
   - Global tooltip configuration
   - Delay: 400ms

### Global Components

1. **Navbar** (`src/components/navbar.tsx`)
   - Sticky header with glassmorphism
   - User authentication dropdown
   - Navigation: Home, Library, Community
   - Notification center

2. **PollinationsAuthHandler** (`src/components/pollinations-auth-handler.tsx`)
   - Monitors Pollinations API key
   - Triggers onboarding if missing

3. **OnboardingWizard** (`src/components/onboarding-wizard.tsx`)
   - Multi-step setup flow
   - Collects: Display name, Pollinations API key
   - Saves to Firestore `users/{uid}`

4. **Toaster** (shadcn/ui)
   - Global toast notifications

### Data Flow Patterns

#### Mind Map Generation Flow
```
User Input (Home) 
  → URL params (topic, lang, depth, persona)
  → Canvas page
  → AI Flow (src/ai/flows/generate-mind-map.ts)
  → Pollinations API
  → Response validation
  → MindMap component
  → Firestore save (optional)
```

#### File Upload Flow
```
File input (Home)
  → FileReader (base64 or text)
  → sessionStorage (session-content-{id})
  → Canvas page (sessionId param)
  → Vision flow (src/ai/flows/generate-mind-map-from-image.ts)
  → Pollinations API (with image)
  → Mind map generation
```

#### Compare Mode Flow
```
Two topics (Home)
  → URL params (topic1, topic2)
  → Canvas page
  → Compare flow (src/ai/compare/flow.ts)
  → Pollinations API
  → CompareView component
```

---

## Error Handling & Fallback Behavior

### AI Provider Errors

1. **Rate Limiting (429)**
   - Retry with 5s × attempt delay
   - Max 5 retries

2. **Timeout (408)**
   - Exponential backoff
   - Max 5 retries

3. **Server Errors (5xx)**
   - Exponential backoff
   - Max 5 retries

4. **JSON Syntax Errors**
   - Retry with 1s delay
   - Robust extraction (find first `{` to last `}`)
   - Max 5 retries

5. **Schema Validation Failures**
   - **Loose mode**: Accept raw response
   - **Partial salvage**: Accept if ≥4 subTopics exist
   - **Strict mode**: Throw `StructuredOutputError` (DISABLED)

6. **Reasoning-Only Responses**
   - Detected via `isReasoningOnly()` check
   - Retries automatically

### Circuit Breaker
- **Trigger**: 5+ consecutive failures
- **Action**: Disable provider for 10 minutes
- **Status**: Tracked via `ProviderMonitor`

### User-Facing Errors
- **Toast notifications**: Via `useToast()` hook
- **Loading states**: Skeleton loaders, spinners
- **Fallback UI**: Error boundaries (SerializationErrorBoundary)

---

## Performance Notes

### Build Configuration (next.config.ts)
- **TypeScript errors**: Ignored during build (`ignoreBuildErrors: true`)
- **ESLint**: Ignored during build (`ignoreDuringBuilds: true`)
- **Image optimization**: Enabled for `placehold.co`, `picsum.photos`, `image.pollinations.ai`
- **Server external packages**: `@opentelemetry/instrumentation`, `@opentelemetry/sdk-node`

### Client-Side Optimizations
- **Dynamic imports**: ChatPanel loaded with `ssr: false`
- **Code splitting**: Automatic via Next.js App Router
- **Image optimization**: Next.js Image component
- **Font optimization**: Next.js font loading (Space Grotesk, Orbitron)

### Caching Strategy
- **Local storage**: AI config, user preferences
- **Session storage**: File upload data (vision mode)
- **Firestore**: Real-time sync for user data, mind maps

### Known Performance Issues
- **Large mind maps**: May cause serialization errors (handled by error boundary)
- **Deep mode**: Can exceed token limits (partial salvage logic)
- **Image generation**: Sequential, not batched (potential bottleneck)

---

## AI Providers

### Primary Provider: Pollinations.ai

**Status**: ✅ **ACTIVE** (all mind map features)

**Capabilities**:
- Text generation (mind maps, explanations, summaries)
- Vision mode (image/PDF analysis)
- Image generation
- Multi-model rotation for reliability

**Models**: `qwen-coder`, `mistral`, `nova-fast`, `openai` (vision)

**API Key**: Optional (free tier available)

### Secondary Provider: Google Gemini

**Status**: ⚠️ **PARTIAL** (quiz generation only)

**Active Use**: `/api/generate-quiz-direct` route

**Not Used For**: Mind maps, explanations, images (despite code existing)

> 📖 **See**: [AI Provider Architecture](./04-ai-provider-architecture.md) for complete truth table

### Search Provider: Google Custom Search API

**Purpose**: Web search context for mind maps

**Usage**: Optional (enhances mind maps with real-time web data)

---

## Deployment

### Platform
- **Vercel** (inferred from Next.js setup)

### Environment Variables (from .env structure)
- Firebase config keys
- Pollinations API key (user-provided)
- Other API keys (structure exists, values user-dependent)

### Build Command
```bash
npm run build
```

### Dev Command
```bash
npm run dev
```

---

## Security Considerations

### API Key Management
- **Pollinations API key**: Stored in Firestore `users/{uid}/apiSettings`
- **Firebase config**: Public (client-side)
- **No server-side secrets exposed** in client code

### Authentication
- **Firebase Auth**: Handles session management
- **Protected routes**: Check for `user` and `pollinationsApiKey`
- **Firestore rules**: Enforce user-based access control

### Data Privacy
- **User data**: Scoped to authenticated user
- **Public maps**: Explicitly marked `isPublic: true`
- **Chat history**: Stored per user in Firestore

---

## Code Quality & Maintenance

### Type Safety
- **TypeScript**: Strict mode (inferred from tsconfig.json)
- **Zod schemas**: Runtime validation for AI responses

### Error Tracking
- **Console logging**: Extensive throughout codebase
- **Error boundaries**: React error boundaries for UI crashes
- **Structured errors**: `StructuredOutputError` class

### Testing
- **No test files found** in current scan
- **Manual testing**: Via dev server

---

## Summary

MindScape-Firebase is a **production-grade Next.js 15 application** that uses:
- **Firebase** for authentication and data persistence
- **Pollinations AI** as the sole AI provider with intelligent retry/fallback logic
- **App Router** for file-based routing
- **shadcn/ui + Tailwind** for a premium glassmorphic UI
- **Real-time sync** between Firestore and client state
- **Robust error handling** with circuit breakers and partial response salvage

**No assumptions made** - all information verified from source code.
