# Dance School Management System 

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite 6 |
| Routing | React Router v7, nested routes, `RequireAuth` guard |
| Server state | TanStack Query v5 — all Firestore reads/writes |
| Client state | Zustand — `authStore` (session) + `uiStore` (preferences, persisted) |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS v4 — tokens in `index.css` `@theme {}` block, NOT `tailwind.config.js` |
| Components | Radix UI headless primitives + class-variance-authority (CVA) |
| Charts | Recharts |
| Dates | date-fns |
| i18n | i18next, 4 languages (en/de/es/ru), 7 namespaces, lazy loaded |
| Auth | Firebase Authentication (email + password) |
| Database | Cloud Firestore (real-time, security rules enforced) |
| Functions | Firebase Cloud Functions v2, Node 20, TypeScript |
| Dev environment | Firebase Local Emulator Suite (Auth :9099, Firestore :8080, Functions :5001, UI :4000) |

---

## Monorepo Layout

```
dance-school-app/
├── apps/
│   ├── web/                        React + Vite frontend
│   │   └── src/
│   │       ├── components/
│   │       │   ├── ui/             Radix + CVA primitives
│   │       │   └── layout/         Shell, nav, sidebar
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   ├── students/
│   │       │   ├── classes/
│   │       │   ├── attendance/
│   │       │   ├── teachers/
│   │       │   └── reports/
│   │       ├── hooks/              TanStack Query wrappers per domain
│   │       ├── lib/                Firebase init, i18n config, query client
│   │       ├── locales/            en / de / es / ru × 7 namespaces
│   │       ├── pages/              Route-level page components
│   │       ├── stores/             Zustand stores
│   │       ├── types/              Shared TypeScript interfaces
│   │       └── App.tsx             Router, providers, theme
│   └── functions/
│       └── src/
│           ├── attendance/         onAttendanceCreated trigger (credit deduction)
│           ├── backup/             scheduledBackup + manualBackup callable
│           └── index.ts
├── seed/                           seed.ts — sample data for emulator
├── firestore.rules
├── firestore.indexes.json
└── firebase.json
```

---

## Coding Conventions

- All data fetching via TanStack Query. No raw `fetch` or `useEffect` for server state in components.
- Zustand only for UI state (open modals, selected IDs, theme). Never for server state.
- Tailwind only. No inline styles, no CSS modules.
- Every feature needs at minimum: a typed hook, a component, and a basic smoke test.
- Firestore types are defined in `src/types/`. All documents are typed — no `any`.
- After any schema change, update types in `src/types/` before touching UI code.
- Mobile-first. Every component tested at 375px width first.
- i18n from day one. No hardcoded strings — all user-facing text goes through `t()`.
- Soft deletes everywhere. Use `active: false`, never hard delete.
- Credit deduction logic lives only in Cloud Functions. Never implement it client-side.

---

## Firestore Collections

```
users               Firebase Auth uid + role ('admin' | 'staff') + active flag + permissions map
students            Profile + denormalized membershipType + active flag
memberships         All membership records per student (full history preserved)
teachers            Profile + ratePerStudent + monthlyFloor + reportVisibility flags
rooms               Name + capacity + active flag
classTemplates      Recurring class definitions + regular student roster + subscription flag
classSessions       Individual class instances — status: planned | active | completed | cancelled
attendanceRecords   One doc per student per session — immutable once written, snapshotted
backupLogs          Audit log of every backup run (Functions-only writes)
config/backup       Single doc: NAS path, schedule, retention, enabled flag
config/pricing      Single doc: all configurable revenue rates
```

---

## Core Entities and Types

```typescript
// Membership tier
type MembershipTier = 'gold' | 'silver' | 'bronze'

// Attendance combination — exactly one of these per attendance record
type AttendanceCombination =
  | 'gold'
  | 'bronze_cash' | 'silver_cash'
  | 'bronze_usc'  | 'silver_usc'
  | 'bronze_eversports' | 'silver_eversports'
  | 'usc_cash'
  | 'eversports_cash'
  | '2_bronze' | '2_silver'

// Check-in status
type AttendanceStatus = 'present' | 'late' | 'absent' | 'trial'

// Session status
type SessionStatus = 'planned' | 'active' | 'completed' | 'cancelled'

// Dance styles
type DanceStyle = 'bachata' | 'kizomba' | 'salsa' | 'zouk' | 'afro' | 'other'

// Levels
type ClassLevel = 'beginner' | 'intermediate' | 'advanced' | 'open'
```

---

## Membership Credit Rules

### Gold
- Unlimited monthly access, all class types including special classes.
- Zero credit deductions. Valid while the membership period is active.

### Silver (10-class pass)
- `creditsRemaining`: starts at 10
- `specialClassesUsed`: starts at 0, max 2
- Regular class: deduct 1 from `creditsRemaining`
- Special class with slots remaining (`specialClassesUsed < 2`): deduct 1, increment `specialClassesUsed`
- Special class with slots exhausted: combination becomes `2_silver`, deduct 2 from `creditsRemaining`
- Expiry: 3 months, credits do not roll over

### Bronze (5-class pass)
- `creditsRemaining`: starts at 5
- `specialClassesUsed`: starts at 0, max 2
- Same deduction logic as Silver
- Expiry: 2 months, credits do not roll over

### Credit deduction rules (ALL server-side only)
| Combination | Credits deducted | Pool |
|---|---|---|
| gold | 0 | — |
| bronze_cash | 1 | bronze |
| silver_cash | 1 | silver |
| bronze_usc | 1 | bronze |
| silver_usc | 1 | silver |
| bronze_eversports | 1 | bronze |
| silver_eversports | 1 | silver |
| usc_cash | 0 | no school pass |
| eversports_cash | 0 | no school pass |
| 2_bronze | 2 | bronze (regular pool) |
| 2_silver | 2 | silver (regular pool) |

### Pass deactivation
- `creditsRemaining` reaches 0 → set `active: false` server-side.
- Double deduction would go below 0 → cap at remaining balance, flag shortfall for staff resolution.

---

## Attendance Record — Key Fields

```typescript
interface AttendanceRecord {
  id: string
  sessionId: string
  studentId: string
  status: AttendanceStatus
  combination: AttendanceCombination
  membershipSnapshot: {        // frozen at check-in time, never mutated
    tier: MembershipTier
    creditsAtCheckIn: number
    specialSlotsAtCheckIn: number
  }
  estimatedValueSnapshot: number  // frozen at check-in time
  surchargeAmount?: number        // for + cash combinations
  dropInRateOverride?: number     // staff override of the default drop-in rate
  markedAt: Timestamp
  markedBy: string               // uid
}
```

**Immutability rule:** Once written, `membershipSnapshot` and `estimatedValueSnapshot` are never updated. Rate config changes must not affect historical records.

---

## Roles and Permissions

### Roles
- `admin`: all permission flags always true, cannot be reduced
- `staff`: individual flags set by admin

### Permission flags (on `users` document)
| Flag | Staff default | Controls |
|---|---|---|
| `viewFinancials` | false | Revenue totals, class income, margin data |
| `viewTeacherPay` | false | Teacher rates, monthly pay totals |
| `exportReports` | false | Download Excel/PDF reports |
| `manageStudents` | true | Create/edit/deactivate students |
| `manageClasses` | true | Create/edit class templates and sessions |
| `manageTeachers` | false | Add/edit/deactivate teachers |
| `manageRooms` | false | Add/edit/deactivate rooms |
| `configureSystem` | false | Backup settings, pricing config |

### UI rule
Restricted sections are **hidden entirely**, not disabled. Never show a greyed-out button if the user lacks the permission.

---

## Step-Up Email Verification

Required for any view or export with revenue or teacher pay data.

Flow:
1. User with `viewFinancials: true` navigates to a restricted view.
2. Prompt: "Enter the code sent to your email."
3. Cloud Function generates a 6-digit single-use code, expires in 10 minutes.
4. User enters code → financial view unlocks for the session (cleared on tab close or 30 min inactivity).
5. Unlock is never persisted across sessions.

Required for: Monthly comparison report sections B and C, teacher compensation with earnings, any export containing revenue or pay data.
NOT required for: Attendance counts, student profiles, check-in operations.

---

## Pages and Features

### Dashboard
- Today's sessions with student counts and quick links to check-in.
- Subscription classes vs. open/drop-in classes shown distinctly.
- Key stats: total active students, USC attendances this month, average students per session.

### Calendar (week view)
- Mon–Sun grid of all scheduled sessions as blocks (class name, teacher, room, time, roster size).
- Colour-coded by dance style.
- Prev/next week navigation, jump-to-date, Today button.
- Click empty slot → new class form pre-filled with day + time.
- Click block → session detail / edit.
- "Copy from previous week" button — clones session shells, excludes attendance.
- Admin can mark date ranges as holidays/closures; sessions on closed dates are auto-cancelled or flagged.

### Check-In (session detail)
- Pre-populated roster from class template.
- Four one-tap statuses per student: Present / Late / Absent / Trial.
- Expandable per-student row: set attendance combination, note surcharge.
- Visual warnings: red badge = 0 credits, yellow badge = 1 credit remaining, orange badge = special slots exhausted.
- Autocomplete search to add drop-in students not on the roster.
- Physical confirmation step before any attendance record is created (prevents wrong-student check-in).
- "Add as new student" inline form if no match found (only name + membership type required).

### Students
- List with search + filter by membership type, active/inactive status.
- Student profile: contact details, membership history, attendance record, credits remaining, special slots used.
- Manual credit adjustment with reason log.
- CSV import (admin only): preview with validation, duplicate detection, imported as inactive.

### Class Templates
- CRUD for recurring templates: day of week, time, teacher, room, style, level, subscription/open flag.
- Default student roster per template (drives check-in pre-population).

### Teachers
- CRUD: name, email, `ratePerStudent`, `monthlyFloor`, `reportVisibility` flags.
- Admin only for write operations.

### Rooms
- CRUD: name, capacity.
- Admin only for write operations.

### Reports
- Date-range filter (1/3/6/12 months).
- Charts: weekly attendance trend (line), membership breakdown (pie), attendance combination distribution (bar), top classes by attendance (bar).
- Monthly comparison report:
  - Section A (attendance by category) — all staff.
  - Section B (estimated revenue per class) — `viewFinancials` required + step-up verification.
  - Section C (cost vs. revenue margin) — `viewFinancials` required + step-up verification.
- Teacher compensation report — `viewTeacherPay` required, export `exportReports` required.
- Export: Excel (.xlsx) and CSV, `exportReports` flag + step-up verification for financial data.

### Settings
- Pricing config (admin): all configurable rates for revenue estimation.
- Teachers and rooms management.
- User management (admin): roles, permission flags.
- Backup: NAS path, retention, schedule toggle, manual backup trigger, backup log viewer.
- Theme: light / dark / system (persisted per device).
- Language: en / de / es / ru (persisted per device).

---

## Cloud Functions

### `onAttendanceCreated` (Firestore trigger)
- Triggered on write to `attendanceRecords`.
- Applies credit deduction based on `combination` and class `isSpecial` flag.
- Checks and updates `specialClassesUsed` counter.
- Deactivates pass if `creditsRemaining` reaches 0.
- Caps double deductions if insufficient credits; flags shortfall.
- Runs under Admin SDK — cannot be bypassed from the browser.
- Must be atomic (Firestore transaction).

### `manualBackup` (HTTPS Callable)
- Authenticated, admin only.
- Exports all 8 core collections to a timestamped JSON on the configured NAS path.
- Writes a `backupLogs` document with: status, file size, duration, collections, errors.

### `scheduledBackup` (Cloud Scheduler)
- Runs daily at 02:00 Europe/Berlin.
- Same logic as `manualBackup`.

### `cleanupOldBackups` (Cloud Scheduler)
- Runs weekly.
- Deletes `backupLogs` documents older than 90 days.

---

## Pricing Configuration (stored in `config/pricing`)

| Key | Description | Default |
|---|---|---|
| `dropInPrice` | Walk-in cash class | €13 |
| `silverPassPrice` | Total price of 10-class Silver pass | configurable |
| `bronzePassPrice` | Total price of 5-class Bronze pass | configurable |
| `goldMonthlyPrice` | Monthly Gold membership fee | configurable |
| `uscRatePerCheckin` | Studio revenue per USC check-in | configurable |
| `eversportsRatePerCheckin` | Studio revenue per Eversports check-in | configurable |
| `specialClassSurcharge` | Estimated surcharge for special class cash | configurable |
| `trialRate` | Estimated value of a trial attendance | configurable |

---

## Non-Functional Requirements

1. Credit deductions are atomic (Firestore transactions) and exclusively server-side.
2. `estimatedValueSnapshot` and `membershipSnapshot` on attendance records are immutable after creation.
3. All Firestore operations are gated by security rules that enforce role and permission flag checks.
4. The app runs fully against the Firebase Local Emulator Suite for development (no live project needed).
5. Soft deletes throughout — `active: false` on students, teachers, rooms, templates. Nothing is hard deleted.
6. Step-up codes are server-generated, single-use, expire after 10 minutes, never stored client-side.
7. Backup logs every run: status, file size, duration, collections exported, errors.
8. UI supports light, dark, and system theme, persisted per device.
9. Language preference persists per device across sessions.

---

## Build Order (recommended)

1. Project scaffold — monorepo, Vite, Firebase emulator, i18n, routing, auth guards
2. Auth flow — login, session store, role/permission loading, `RequireAuth`
3. Firestore security rules baseline
4. Student management — CRUD, roster, search
5. Teachers and rooms CRUD
6. Class templates — CRUD, recurring definition, roster management
7. Class sessions — generate from template, calendar view, copy-week
8. Check-in flow — pre-populated roster, one-tap status, credit warnings
9. `onAttendanceCreated` Cloud Function — credit deduction (atomic)
10. Drop-in student add flow — autocomplete, confirmation step, inline new student form
11. Membership management — passes, credit adjustment, history
12. Reports — charts, monthly comparison, step-up verification gate
13. Teacher compensation report — export
14. Backup system — scheduled + manual, logs
15. Settings — pricing config, user management, theme, language
16. CSV import for students

---

## Local Dev Quick Start

```bash
npm install
echo "VITE_USE_EMULATORS=true" > apps/web/.env.local
firebase emulators:start --import=emulator-data --export-on-exit=emulator-data
# In a separate terminal:
npm run seed
npm run dev
# http://localhost:5173
# Login: admin@danceacademy.com / password123
```