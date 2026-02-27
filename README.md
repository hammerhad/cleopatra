# 👑 Cleopatra

A premium women's productivity and discipline app built with Expo + React Native + TypeScript. Regal, dark-gold aesthetic — habit tracking, tasks, training, journaling, cycle awareness, and an AI companion powered by Gemini.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK ~51 + React Native |
| Language | TypeScript (strict) |
| Navigation | Expo Router (file-based) |
| State | Zustand |
| Backend | Firebase (Auth, Firestore, Storage, Functions, FCM, Analytics, Crashlytics) |
| AI | Google Gemini 1.5 Flash |
| Fonts | Cormorant Garamond + Inter |
| Animations | React Native Reanimated v3 |
| Subscriptions | RevenueCat (placeholder) |

---

## Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli eas-cli`
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- A Firebase project with the following services enabled:
  - Authentication (Email/Password)
  - Firestore
  - Storage
  - Cloud Functions
  - Cloud Messaging (FCM)
  - Analytics
  - Crashlytics
  - App Check
  - Remote Config
- A [Google AI Studio](https://aistudio.google.com/) API key for Gemini

---

## Setup

### 1. Clone & install dependencies

```bash
git clone <repo-url>
cd cleopatra
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` with your keys:

```env
EXPO_PUBLIC_GEMINI_API_KEY=AIza...         # Google AI Studio
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
REVENUECAT_API_KEY_IOS=appl_...
REVENUECAT_API_KEY_ANDROID=goog_...
APP_CHECK_DEBUG_TOKEN=your-debug-token     # only for development
```

### 3. Add Firebase config files

Download from Firebase Console and place:
- `google-services.json` -> project root (Android)
- `GoogleService-Info.plist` -> project root (iOS)

These are referenced in `app.json` under `expo.android.googleServicesFile` and `expo.ios.googleServicesFile`.

### 4. Install Cloud Functions dependencies

```bash
cd functions
npm install
cd ..
```

---

## Running Locally

### Start the Expo dev server

```bash
# iOS simulator
npx expo run:ios

# Android emulator
npx expo run:android

# Expo Go (limited Firebase features)
npx expo start
```

### Use Firebase Emulators (recommended for development)

```bash
firebase emulators:start
```

Emulator ports (configured in `firebase.json`):

| Service | Port |
|---|---|
| Auth | 9099 |
| Firestore | 8080 |
| Storage | 9199 |
| Functions | 5001 |
| Emulator UI | 4000 |

---

## Firebase Deployment

### Deploy Firestore rules & indexes

```bash
firebase deploy --only firestore
```

### Deploy Storage rules

```bash
firebase deploy --only storage
```

### Build & deploy Cloud Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### Deploy everything at once

```bash
firebase deploy
```

---

## Building for Production

### Configure EAS

```bash
eas login
eas build:configure
```

### iOS build

```bash
eas build --platform ios --profile production
```

### Android build

```bash
eas build --platform android --profile production
```

### Submit to stores

```bash
eas submit --platform ios
eas submit --platform android
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npx jest __tests__/streaks.test.ts
npx jest __tests__/cyclePrediction.test.ts
npx jest __tests__/reminders.test.ts

# Watch mode
npm test -- --watch
```

---

## Project Structure

```
cleopatra/
├── app/
│   ├── _layout.tsx              # Root layout (fonts, auth, FCM)
│   ├── (auth)/                  # Unauthenticated screens
│   │   ├── welcome.tsx
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/                  # Main app tabs
│   │   ├── _layout.tsx
│   │   ├── index.tsx            # Dashboard / Kingdom
│   │   ├── habits.tsx           # Daily Rituals
│   │   ├── tasks.tsx            # Royal Decrees
│   │   ├── court.tsx            # Royal Court
│   │   ├── profile.tsx          # Queen's Profile
│   │   ├── journal.tsx          # Journal list (push nav)
│   │   ├── training.tsx         # Training (push nav)
│   │   └── analytics.tsx        # Analytics (push nav)
│   └── (modals)/                # Modal screens
│       ├── journal-entry.tsx    # Journal + Ask Cleopatra AI
│       ├── habit-detail.tsx
│       ├── task-detail.tsx
│       ├── paywall.tsx
│       ├── cycle-tracker.tsx
│       └── workout-session.tsx
├── src/
│   ├── components/
│   │   ├── ui/                  # Design system components
│   │   └── skeletons/           # Loading skeletons
│   ├── services/                # Firebase + Gemini abstractions
│   ├── stores/                  # Zustand stores
│   ├── theme/                   # Colors, typography, spacing
│   ├── types/                   # TypeScript interfaces
│   └── utils/                   # Pure logic (streaks, cycle, reminders)
├── functions/                   # Firebase Cloud Functions
│   └── src/
│       ├── triggers/            # Firestore + Auth triggers
│       ├── scheduled/           # Cron jobs
│       └── callable.ts          # Callable functions
├── __tests__/                   # Unit tests
├── firestore.rules
├── storage.rules
├── firestore.indexes.json
└── firebase.json
```

---

## Key Features

| Module | Description |
|---|---|
| **Authentication** | Email/password sign-up, 4-step onboarding |
| **Dashboard** | Rank system, habit summary, daily motivation, cycle phase banner |
| **Habits** | Create/edit/archive rituals, daily completion, streaks, per-habit reminders |
| **Tasks** | Now/Next/Later/Done buckets, priority system, cycle phase alignment |
| **Training** | Built-in workout templates, session timer, rest timer, per-set tracking |
| **Journal** | Daily reflections with mood rating, AI responses via Gemini (Ask Cleopatra) |
| **Analytics** | Habit heatmap, streak leaders, task breakdown, cycle-performance correlation |
| **Royal Court** | Invite queens, group challenges, real-time court messaging |
| **Cycle Tracker** | Period logging, phase detection, symptom tracking, cycle prediction |
| **Settings** | Avatar upload, password change, privacy mode, notification preferences |
| **Paywall** | Premium feature gating, monthly/annual plans |

---

## Rank System

Users progress through ranks based on `rankPoints` accumulated via habit streaks and challenge completions:

| Rank | Points Required |
|---|---|
| Initiate | 0 |
| Scholar | 100 |
| Warrior | 300 |
| Strategist | 600 |
| Commander | 1,000 |
| High Priestess | 2,000 |
| Pharaoh | 5,000 |

---

## Cycle Phases

| Phase | Days (28-day cycle) | Energy Profile |
|---|---|---|
| Menstrual | 1-5 | Rest, restore |
| Follicular | 6-13 | Rising, creative |
| Ovulation | 14-16 | Peak, social |
| Luteal | 17-28 | Focused, inward |

---

## Gemini AI Integration

The "Ask Cleopatra" feature in the journal uses **Gemini 1.5 Flash** with streaming responses. The AI persona:
- Speaks as Cleopatra herself — direct, regal, ancient wisdom
- Adapts tone based on current cycle phase
- Responds to mood rating context
- Never uses generic self-help language
- Ends each response with a penetrating insight or question

Get your API key at [Google AI Studio](https://aistudio.google.com/app/apikey) and set `EXPO_PUBLIC_GEMINI_API_KEY` in `.env`.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_GEMINI_API_KEY` | Yes | Google AI Studio key for Gemini |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project identifier |
| `FIREBASE_API_KEY` | Yes | Firebase web API key |
| `FIREBASE_AUTH_DOMAIN` | Yes | Firebase Auth domain |
| `FIREBASE_STORAGE_BUCKET` | Yes | Firebase Storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Yes | FCM sender ID |
| `REVENUECAT_API_KEY_IOS` | Prod | RevenueCat iOS key |
| `REVENUECAT_API_KEY_ANDROID` | Prod | RevenueCat Android key |
| `APP_CHECK_DEBUG_TOKEN` | Dev | App Check bypass for simulators |
