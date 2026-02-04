# Login Page (`/login`) – MindScape-Firebase

> **Code-Verified**: All elements traced from `src/app/login/page.tsx` (126 lines)

---

## Page Overview

**Route**: `/login`  
**File**: `src/app/login/page.tsx`  
**Type**: Client Component  
**Access**: Public

### Purpose
Authentication page with dynamic feature showcase and AuthForm component.

---

## Page Structure

```
LoginPage
├─ Showcase Section (left/top)
│  └─ Randomly selected feature highlight
└─ AuthForm Section (right/bottom)
    ├─ Google OAuth
    └─ Email/Password
```

---

## Showcase Variants

**Selection**: Random on component mount

### Variant 1: AI-Powered Mind Mapping
- **Icon**: Sparkles
- **Title**: "AI-Powered Mind Mapping"
- **Description**: "Transform any topic into a structured, visual knowledge map with the power of AI."
- **Features**:
  - Instant topic breakdown
  - Multi-language support
  - Customizable depth levels

### Variant 2: Compare & Contrast
- **Icon**: GitBranch
- **Title**: "Compare & Contrast"
- **Description**: "Analyze two topics side-by-side to understand their differences and similarities."
- **Features**:
  - Side-by-side analysis
  - Dimension-based comparison
  - Hybrid concept generation

### Variant 3: Vision Mode
- **Icon**: Scan
- **Title**: "Vision Mode"
- **Description**: "Upload images, PDFs, or documents and let AI extract key concepts into mind maps."
- **Features**:
  - Image-to-map conversion
  - PDF document analysis
  - Text extraction

### Variant 4: Nested Exploration
- **Icon**: Network
- **Title**: "Nested Exploration"
- **Description**: "Dive deeper into any concept with infinite levels of detail and sub-maps."
- **Features**:
  - Unlimited depth
  - Sub-map generation
  - Context preservation

---

## AuthForm Component

**File**: `src/components/auth-form.tsx` (281 lines)

### Interactive Elements

| Element | Type | Action | Trigger | Result |
|---------|------|--------|---------|--------|
| **Google Sign In** | Button | OAuth login | Click | Firebase `signInWithPopup()` → `/` |
| **Email Input** | Input | Enter email | Change | Update email state |
| **Password Input** | Input | Enter password | Change | Update password state |
| **Name Input** | Input | Enter name (sign-up) | Change | Update name state |
| **Submit Button** | Button | Authenticate | Click/Enter | Sign in OR Sign up |
| **Toggle Mode** | Button | Switch mode | Click | Sign In ↔ Sign Up |
| **Forgot Password** | Button | Reset flow | Click | Show reset dialog |

---

## Authentication Flows

### Google OAuth Flow
```
User clicks "Continue with Google"
  → Firebase signInWithPopup(GoogleAuthProvider)
  → Success:
     → Check if new user (additionalUserInfo.isNewUser)
     → If new: Create Firestore user document
        - displayName
        - email
        - photoURL
        - createdAt
        - statistics (default values)
     → Set sessionStorage: 'welcome_back'
     → Router push to "/"
     → Home page shows welcome toast
  → Error:
     → Toast error message
```

### Email/Password Sign In
```
User enters email + password → Submit
  → Firebase signInWithEmailAndPassword(email, password)
  → Success:
     → Set sessionStorage: 'welcome_back'
     → Router push to "/"
  → Error:
     → Toast error message (invalid credentials, etc.)
```

### Email/Password Sign Up
```
User enters name + email + password → Submit
  → Firebase createUserWithEmailAndPassword(email, password)
  → Success:
     → Firebase updateProfile({ displayName: name })
     → Create Firestore user document: users/{uid}
        - displayName: name
        - email: email
        - createdAt: timestamp
        - statistics: {
            mapsCreated: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalNodes: 0,
            totalImages: 0,
            totalStudyTime: 0
          }
     → Set sessionStorage: 'welcome_back'
     → Router push to "/"
  → Error:
     → Toast error message (email in use, weak password, etc.)
```

### Password Reset Flow
```
User clicks "Forgot Password" → Enter email → Submit
  → Firebase sendPasswordResetEmail(email)
  → Success:
     → Toast: "Password reset email sent"
     → Close dialog
  → Error:
     → Toast error message
```

---

## Validation

### Email
- HTML5 input type="email" validation
- Firebase validates format on submission

### Password
- Minimum 6 characters (Firebase default)
- No client-side strength check

### Name (Sign-Up Only)
- Required field
- No format validation

---

## User Flows

### Flow 1: Google Sign In
```
1. User lands on /login
2. User clicks "Continue with Google"
3. Google OAuth popup opens
4. User authorizes
5. Firebase creates/updates user
6. Redirect to /
7. Welcome toast appears
```

### Flow 2: Email Sign Up
```
1. User lands on /login
2. User clicks "Sign Up" toggle
3. User enters name, email, password
4. User clicks "Sign Up"
5. Firebase creates account
6. Firestore user document created
7. Redirect to /
8. Welcome toast appears
```

### Flow 3: Password Reset
```
1. User clicks "Forgot Password"
2. Dialog opens
3. User enters email
4. User clicks "Send Reset Email"
5. Firebase sends reset email
6. User checks email
7. User clicks reset link
8. User sets new password
9. User returns to /login
10. User signs in with new password
```

---

## UI States

### Loading States
1. **Submitting**: Disabled inputs, spinner on button

### Error States
1. **Invalid Credentials**: Toast notification
2. **Email Already in Use**: Toast notification
3. **Weak Password**: Toast notification
4. **Network Error**: Toast notification

---

## Styling

### Layout
- **Desktop**: Side-by-side (showcase left, form right)
- **Mobile**: Stacked (showcase top, form bottom)

### Glassmorphism
- **Form Container**: `bg-zinc-900/40 backdrop-blur-3xl`
- **Inputs**: `bg-black/40 border-white/5`

### Animations
- **Framer Motion**: Fade in + slide up
- **Showcase**: Random selection on mount

---

## Code References

- [login/page.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/app/login/page.tsx)
- [auth-form.tsx](file:///c:/Users/Suraj/OneDrive/Desktop/MindScape/src/components/auth-form.tsx)

---

## Summary

The Login page provides **flexible authentication**:
- **Google OAuth**: One-click sign in
- **Email/Password**: Traditional authentication
- **Dynamic Showcase**: Randomly selected feature highlight
- **Password Reset**: Email-based recovery
- **Responsive Design**: Mobile-friendly layout

All features verified from code.
