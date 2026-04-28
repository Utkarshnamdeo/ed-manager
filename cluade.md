# CLAUDE.md

> This file is read automatically by Claude Code at session start.
> Keep it short. Update "Current build status" after every completed step.

---

## What this project is

Dance school attendance management app. Firebase backend, React 19 frontend, TypeScript throughout. Staff use it daily at the front desk to run class check-ins and track student memberships.

Before writing any code, read **spec.md** for types, collections, business rules, and conventions.
If UI features needs to be implemented please check **design.md**, only access **design.md** if UI features needs to be worked on.  

---

## Commands

```bash
# Install all workspace dependencies
npm install

# Start Firebase emulators (Auth, Firestore, Functions, UI)
firebase emulators:start --import=emulator-data --export-on-exit=emulator-data

# Seed sample data (separate terminal, emulators must be running)
npm run seed

# Start dev server
npm run dev
# → http://localhost:5173
# Login: admin@danceacademy.com / password123

# Type check
npm run typecheck

# Run tests
npm run test
```

---

## Non-negotiable rules

- `combination` on attendance records is always `CombinationToken[]` — never a string.
- Credit deduction only in `onAttendanceCreated` Cloud Function. Never client-side.
- All Firestore reads/writes go through TanStack Query hooks. No raw `setDoc`/`getDoc` in components.
- All user-facing strings go through `t()`. No hardcoded copy anywhere.
- Permission flags come from `users/{uid}.permissions`. Always check the flag, not just the role.
- Attendance records are **mutable** — admin/staff can correct them
- Drop-in students ARE added to the student database (`passType: null`).
- Credit deduction amount (1 vs 2) is determined server-side by reading `session.type`. Do not encode as separate tokens.

---
---

## Pages reference

| Page | Route | Access |
|---|---|---|
| Dashboard | `/` | admin, staff |
| Attendance (history calendar) | `/attendance` | admin, staff |
| Classes (calendar + sessions) | `/classes` | admin, staff |
| Students | `/students` | admin, staff |
| Teachers | `/teachers` | admin, staff |
| Reports | `/reports` | admin, staff |
| Settings | `/settings` | admin only |

---

## Current build status

**Completed:** Phase 1 (types/index.ts) · Phase 2 (Firestore rules) · Phase 3 (Cloud Function onAttendanceCreated) · Phase 4 (hooks: useMemberships, useClassCards, useStudents, useAttendanceRecords, useConfig, usePricingConfig).

**In progress:** Phase 5 — Dashboard page (real data + inline check-in).

> Update this section after every completed build step.
