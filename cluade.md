# CLAUDE.md

> This file is read automatically by Claude Code at session start.
> Keep it short. Update "Current build status" after every completed step.

---

## What this project is

Dance school attendance management app. Firebase backend, React 19 frontend, TypeScript throughout. Staff use it daily at the front desk to run class check-ins and track student memberships.

Before writing any code, read **spec.md** for types, collections, business rules, and conventions.

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
- Never hard delete anything. Always `active: false`.
- All Firestore reads/writes go through TanStack Query hooks. No raw `setDoc`/`getDoc` in components.
- All user-facing strings go through `t()`. No hardcoded copy anywhere.
- Permission flags come from `users/{uid}.permissions`. Always check the flag, not just the role.
- Financial views require both `viewFinancials: true` AND a valid step-up verification token.

---

## Folder structure

```
apps/
  web/src/
    components/ui/        Radix + CVA primitives
    components/layout/    Shell, nav, sidebar
    features/
      auth/
      students/
      classes/
      attendance/
      teachers/
      reports/
      settings/
    hooks/                TanStack Query wrappers (one file per domain)
    lib/                  Firebase init, i18n config, query client
    locales/              en/, de/ — 7 namespaces each
    pages/                Route-level components
    contexts/             React Context providers
    types/                All TypeScript interfaces — update before UI code
  functions/src/
    attendance/           onAttendanceCreated
    auth/                 sendStepUpCode, verifyStepUpCode
    backup/               manualBackup, scheduledBackup, cleanupOldBackups
    index.ts
```

---

## Pages reference

| Page | Route | Access |
|---|---|---|
| Dashboard | `/` | all roles |
| Calendar | `/calendar` | all roles |
| Check-in | `/sessions/:id` | all roles (teacher: own sessions only) |
| Students | `/students` | staff, admin |
| Student profile | `/students/:id` | staff, admin |
| Class templates | `/templates` | staff, admin |
| Teachers | `/teachers` | admin (read: staff) |
| Rooms | `/rooms` | admin (read: staff) |
| Reports | `/reports` | staff, admin (`viewFinancials` gates sections B+C) |
| Settings | `/settings` | admin only |

### Dashboard
- Today's sessions: class name, teacher, room, roster count, quick check-in link.
- Subscription vs. open/drop-in sessions shown distinctly.
- Key stats: total active students, USC attendances this month, average students per session.

### Calendar (week view)
- Mon–Sun grid. Sessions as blocks — colour-coded by dance style.
- Prev/next week, jump-to-date, Today button.
- Click empty slot → new session form pre-filled with day + time.
- Click block → session detail.
- "Copy from previous week" — clones session shells, no attendance.
- Admin: mark date ranges as closures; sessions on closed dates auto-cancel or get flagged.

### Check-in
- Roster pre-populated from template `regularStudentIds`.
- One-tap status per student: Present / Late / Absent / Trial.
- Expandable row: combination picker, cash amount input, notes.
- Credit warnings: red = 0 credits, yellow = 1 remaining.
- Autocomplete search to add drop-ins. Confirmation step before record is created.
- "Add as new student" inline form — name + membership type only required.

### Students
- Searchable list. Filter by membership tier, active/inactive.
- Profile: contact info, active membership, credits remaining, attendance history.
- Manual credit adjustment with required reason field.
- CSV import (admin only): preview → validate → confirm → import as inactive.

### Reports
- Date-range filter (1 / 3 / 6 / 12 months).
- Section A — Attendance by category: all staff.
- Section B — Estimated revenue per class: `viewFinancials` + step-up verification.
- Section C — Cost vs. revenue margin: `viewFinancials` + step-up verification.
- Teacher compensation: `viewTeacherPay` required.
- Export (Excel, CSV): `exportReports` flag + step-up for financial data.

### Settings
- Pricing config — `configureSystem` required.
- Backup config — NAS path, retention count, schedule toggle, manual trigger, log viewer.
- External providers — add/enable/disable providers.
- User management — roles and permission flags.
- Theme — light / dark / system.
- Language — en / de.

---

## Current build status

**Completed:** steps 1–2 — monorepo scaffold, auth.
**In progress:** step 3 — Firestore security rules baseline.

> Update this section after every completed build step.
> Format: `Completed: steps 1–N. In progress: step N+1 — [name].`