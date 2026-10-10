# NPTEL Quiz Prep

A highly scalable, mobile-first, static question bank platform designed specifically for NPTEL (National Programme on Technology Enhanced Learning) students to practice multiple-choice questions (MCQs), previous year questions (PYQs), and weekly assignments.

Built entirely as a **static front-end application** (no database, no backend API required). Progress is tracked locally in-memory to ensure maximum privacy and offline capability.

## Project Architecture

This project is organized as a monorepo containing a React Web App, an Expo Android App, and shared business logic.

```
nptel-quiz/
├── apps/
│   ├── web/               # React + Vite web application (mobile-first UI)
│   └── mobile/            # Expo + React Native application (Android APK)
├── packages/
│   ├── question-schema/   # TypeScript interfaces and runtime validation for questions
│   └── quiz-core/         # Pure-function quiz engine, scoring, and state management
├── question-bank/         # The static JSON dataset
│   ├── manifest.json      # Directory of all available courses
│   └── courses/           # JSON files containing questions for each course
└── scripts/               # Validation and load testing utilities
```

## Features

- **Practice Modes**: Select specific weeks or practice Previous Year Questions (PYQs).
- **Fast Mode**: Auto-advance to the next question upon selection.
- **Result on Spot**: Immediately see if the selected answer is correct, with explanations.
- **Mark for Review**: Flag questions to review before submitting.
- **Scoring & Accuracy**: Standard scoring, accuracy percentage, and visual review of all answered questions.
- **100% Offline-Capable**: Mobile app bundles the question bank; Web app uses static files that can be fully cached by a CDN/ServiceWorker.

---

## 🚀 Getting Started (Development)

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
From the root directory, install all workspace dependencies:
```bash
npm install
```

### Running the Web Application
```bash
npm run dev:web
```
Opens the web app at `http://localhost:5173`.

### Running the Mobile Application (Android)
```bash
npm run dev:mobile
```
This starts the Expo bundler. You can use the Expo Go app on your phone to scan the QR code, or press `a` to run it on an Android Emulator.

---

## 📦 Building for Production

### Web Application
Build the static bundle for the web app:
```bash
npm run build:web
```
The compiled static files will be located in `apps/web/dist/`.
**Deployment:** Deploy the `apps/web/dist/` directory to any CDN-capable static hosting provider (e.g., Cloudflare Pages, Vercel, GitHub Pages, Netlify).

### Android APK (via Expo EAS)
To generate a downloadable `.apk` file for Android:
1. Ensure you have the EAS CLI installed globally: `npm install -g eas-cli`.
2. Login to Expo: `eas login`.
3. Navigate to the mobile directory: `cd apps/mobile`.
4. Run the build:
```bash
eas build -p android --profile production
```
Once the build is complete, EAS will provide a direct download link to your `.apk`.

---

## 🗄️ Question Bank Management

The question bank consists of a `manifest.json` file and individual course JSON files.

### Validation
Before adding new questions or updating courses, always validate the question bank to catch schema errors, duplicate IDs, or missing references:
```bash
npm run validate:questions
```
This runs `scripts/validate-questions.mjs` which checks the manifest and all linked course files against the strict TypeScript schema.

---

## 🧪 Testing

### Unit Tests
The core logic (`quiz-core`) and schema validation logic (`question-schema`) have comprehensive unit tests written with Vitest.
```bash
npm run test
```

### Load Testing
To ensure the static asset delivery scales to 3,000–5,000 concurrent users, a `k6` load testing script is provided.
1. Install [k6](https://k6.io/).
2. Run the test script against your deployed URL:
```bash
TARGET_URL=https://your-deployment-url.com k6 run scripts/load-test.js
```

## License
MIT License. Free and Open Source for students.