# Elite Manager

Elite Manager is a dance school operations app focused on attendance, classes, students, teachers, and rooms.

Current stack:

- Frontend: React 19, TypeScript, Vite 6, Tailwind CSS v4
- Data and auth: Firebase Authentication and Cloud Firestore
- Backend: Firebase Cloud Functions v2 (Node 22, TypeScript)
- Local dev: Firebase Local Emulator Suite


## Current Status

Implemented and usable:

- Login flow with Firebase Auth
- App shell with role-aware navigation
- Attendance page UI
- Dashboard page UI
- Classes module with Templates and Sessions tabs
- Students module with list and add flow
- Teachers module with list, drawer, edit/deactivate
- Rooms module with list, add, edit/deactivate
- Firestore rules and indexes deployment
- Attendance credit deduction trigger on attendance record creation

Partially implemented:

- Reports and Settings routes are referenced in navigation but not fully wired in top-level routes
- Some pages currently use mock or early-stage data/UI assumptions

Not implemented yet:

- Step-up verification callable functions
- Backup callable and scheduled backup logic

## Monorepo Structure

- apps/web: React frontend
- apps/functions: Firebase Cloud Functions
- scripts: local seed and utility scripts
- firestore.rules: Firestore security rules
- firestore.indexes.json: Firestore indexes
- firebase.json: Hosting, Functions, Firestore, emulator config
- .firebaserc: Firebase project aliases

## Requirements

- Node.js 22.x
- Firebase CLI installed and authenticated

Recommended check:

1. node -v
2. npm -v
3. firebase --version
4. firebase login:list

## Firebase Projects and Aliases

Configured aliases:

- default: demo-elite-manager
- dev: elite-manager-app-dev

Important:

- Local emulator workflow uses demo project id
- Deploy workflow should always target elite-manager-app-dev explicitly

## Environment Variables

Frontend reads Vite variables from apps/web:

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

Recommended files:

- apps/web/.env.development for local mode
- apps/web/.env.production for production build mode

Local mode values should point to demo-elite-manager.
Production values should point to elite-manager-app-dev.

## Install

1. cd /Volumes/Development/elite-manager
2. npm install

## Run Local Development

Use two terminals.

Terminal 1:

1. cd /Volumes/Development/elite-manager
2. npm run emulators

Terminal 2:

1. cd /Volumes/Development/elite-manager
2. npm run dev

Optional seed after emulators are up:

1. cd /Volumes/Development/elite-manager
2. npm run seed

Local URLs:

- Web app: Vite output, usually <http://localhost:5173>
- Emulator UI: <http://localhost:4000>
- Auth emulator: <http://localhost:9099>
- Firestore emulator: <http://localhost:8080>
- Functions emulator: <http://localhost:5001>

## Deploy to Dev Project

1. cd /Volumes/Development/elite-manager
2. npm run deploy:dev

What this does:

- Builds web app
- Deploys firestore, functions, and hosting to elite-manager-app-dev
- Builds functions before upload via firebase predeploy

## First Login Setup in Deployed App

Creating a Firebase Authentication user is not enough.
The app also requires a matching Firestore profile document in users/{uid}.

Required users document fields:

- email
- displayName
- role
- teacherId
- active
- permissions map
- createdAt

If this doc is missing, the app shows "User profile not found".

## Available Root Scripts

- npm run dev: starts web app in apps/web
- npm run build: builds web app in apps/web
- npm run typecheck: typechecks web and functions
- npm run seed: seeds emulator data
- npm run emulators: starts Firebase emulators with import/export data
- npm run deploy:dev: builds and deploys to elite-manager-app-dev

## Functions Overview

Exported functions:

- onAttendanceCreated: implemented Firestore trigger for credit deduction
- sendStepUpCode: placeholder, throws Not implemented
- verifyStepUpCode: placeholder, throws Not implemented
- manualBackup: placeholder, throws Not implemented
- scheduledBackup: scheduler scaffold only
- cleanupOldBackups: scheduler scaffold only

## Known Limitations

- Step-up and backup features are not production-ready yet
- Some dashboard and attendance views are still heavily UI-first
- Reports and settings are not fully implemented end-to-end

## Troubleshooting

Invalid project selection:

- Use explicit project in deploy commands:
  firebase deploy --project elite-manager-app-dev

API key invalid in hosted app:

- Ensure correct Vite Firebase env variables were used during build
- Rebuild and redeploy hosting
- Hard refresh browser cache after deploy

User profile not found:

- Create users/{uid} document in Firestore for the authenticated user

Functions deploy type conflict:

- If trigger type changed, delete old function once and redeploy:
  firebase functions:delete FUNCTION_NAME --region us-central1 --project elite-manager-app-dev --force

## Security and Repo Hygiene

Do not commit:

- .env files
- local logs
- local exports and emulator dumps not meant for source control

Current .gitignore already covers most generated files. Keep it strict as you add more local tooling.

## Roadmap Snapshot

Near-term priorities:

- Implement step-up verification functions
- Implement backup pipeline functions
- Complete reports and settings pages
- Align numeric input handling with project conventions
- Add smoke and integration tests for major flows
