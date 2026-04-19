## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite 6 |
| Routing | React Router v7, nested routes, `RequireAuth` guard |
| Server state | TanStack Query v5 — all Firestore reads/writes |
| Client state | React Context — multiple contexts per domain if needed |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS v4 — tokens in `index.css` `@theme {}` block, NOT `tailwind.config.js` |
| Components | Radix UI headless primitives + class-variance-authority (CVA) |
| Dates | date-fns |
| i18n | i18next, 2 languages (en/de), lazy loaded |
| Auth | Firebase Authentication (email + password) |
| Database | Cloud Firestore |
| Functions | Firebase Cloud Functions v2, Node 22, TypeScript |
| Dev | Firebase Local Emulator Suite — Auth :9099, Firestore :8080, Functions :5001, UI :4000 |

---

## Coding Conventions

- All data fetching via TanStack Query. No raw `fetch` or `useEffect` for server state.
- React Context for client state. Multiple contexts are fine — one per domain.
- Tailwind only. No inline styles, no CSS modules.
- Every feature needs at minimum: a typed hook, a component, and a smoke test.
- Firestore types live in `src/types/`. No `any` anywhere.
- Update `src/types/` before touching UI code after any schema change.
- Mobile-first. Test every component at 375px first.
- i18n from day one. All user-facing strings go through `t()`. No hardcoded copy.
- Soft deletes everywhere — `active: false`. Never hard delete.
- Credit deduction logic lives only in Cloud Functions. Never implement it client-side.
- Named exports over default exports
- No barrel files (index.ts re-exports) — import from the specific module
  Exception: features/*/index.ts is fine for internal re-exports
- One component per file, PascalCase filenames
- React 19: no forwardRef (refs as props)
- No any, no unused variables

---

## Roles and Permissions

### Roles

| Role | Access |
|---|---|
| `admin` | Full access — all features, settings, reports, user management |
| `staff` | Student management, all sessions, check-in, reports |
| `teacher` | Own classes only — view schedule, run check-in for their sessions |

- Restricted UI sections are **hidden entirely**, not disabled.
- Firestore security rules enforce the same restrictions server-side.
- `admin` always has all permission flags set to `true` and cannot be reduced.

### Permission flags (stored on `users` document)

| Flag | Staff default | Controls |
|---|---|---|
| `viewFinancials` | `false` | Revenue totals, class income, margin data |
| `viewTeacherPay` | `false` | Teacher rates, monthly pay totals |
| `exportReports` | `false` | Download Excel/PDF/CSV reports |
| `manageStudents` | `true` | Create/edit/deactivate students |
| `manageClasses` | `true` | Create/edit class templates and sessions |
| `manageTeachers` | `false` | Add/edit/deactivate teachers |
| `manageRooms` | `false` | Add/edit/deactivate rooms |
| `configureSystem` | `false` | Backup settings, pricing config |

### Step-up email verification

Required before any view or export that contains revenue or teacher pay data.

1. User with `viewFinancials: true` navigates to a restricted view.
2. App shows prompt: "Enter the code sent to your email."
3. Cloud Function generates a 6-digit single-use code, expires in 10 minutes.
4. User enters code → financial view unlocks for the session.
5. Unlock clears on tab close or 30 minutes of inactivity. Never persisted across sessions.
6. Codes are server-generated, single-use, never stored client-side.

Required for: Monthly report sections B and C, teacher compensation with earnings, any export with revenue or pay data.
Not required for: Attendance counts, student profiles, check-in.

---

## Core Types

```typescript
type Role = 'admin' | 'staff' | 'teacher'

type MembershipTier = 'gold' | 'silver' | 'bronze'

type ExternalProvider = 'usc' | 'eversports' // extensible — stored in config/externalProviders

// Atomic payment tokens. Stored as an unordered array on the attendance record.
// Order never matters: ['silver', 'usc'] === ['usc', 'silver']
type CombinationToken =
  | 'gold'        // Gold membership
  | 'silver'      // 1 silver credit
  | '2silver'     // 2 silver credits (special/workshop/event/party only)
  | 'bronze'      // 1 bronze credit
  | '2bronze'     // 2 bronze credits (special/workshop/event/party only)
  | 'usc'         // Urban Sports Club check-in
  | 'eversports'  // Eversports check-in
  | 'cash'        // Cash payment (amount stored in cashAmount field)
  | 'trial'       // Trial class

// 1–2 tokens per record. Validated against the combination matrix on write.
type AttendanceCombination = CombinationToken[]

// Valid combinations:
// ['gold']                  — Gold, any class type
// ['silver']                — 1 silver credit, regular class
// ['2silver']               — 2 silver credits, special class
// ['silver', 'cash']        — 1 silver + cash surcharge, special class
// ['silver', 'usc']         — 1 silver + USC, special class
// ['silver', 'eversports']  — 1 silver + Eversports, special class
// ['bronze']                — 1 bronze credit, regular class
// ['2bronze']               — 2 bronze credits, special class
// ['bronze', 'cash']        — 1 bronze + cash surcharge, special class
// ['bronze', 'usc']         — 1 bronze + USC, special class
// ['bronze', 'eversports']  — 1 bronze + Eversports, special class
// ['usc']                   — USC only, regular class
// ['usc', 'cash']           — USC + cash surcharge, special class
// ['usc', 'eversports']     — USC + Eversports, special class
// ['usc', 'silver']         — USC + 1 silver, special class
// ['usc', 'bronze']         — USC + 1 bronze, special class
// ['eversports']            — Eversports only, regular class
// ['eversports', 'cash']    — Eversports + cash surcharge, special class
// ['cash']                  — Walk-in cash, regular class
// ['trial']                 — Trial, any class

type AttendanceStatus = 'present' | 'late' | 'absent' | 'trial'

type SessionStatus = 'planned' | 'active' | 'completed' | 'cancelled'

// ClassType drives isSpecial on the session document
type ClassType = 'regular' | 'special' | 'workshop' | 'event' | 'party'
// isSpecial = type !== 'regular'

type DanceStyle = 'bachata' | 'kizomba' | 'salsa' | 'zouk' | 'afro' | 'other'

type ClassLevel = 'beginner' | 'intermediate' | 'advanced' | 'open'
```

---

## Combination Selection Rules

These rules drive the UI card picker and are validated server-side in the Cloud Function.
`isSpecial` = session `type` is `special | workshop | event | party`.

### Mutual exclusions (always)
- `gold` selected → all other cards disabled.
- `trial` selected → all other cards disabled.
- `2silver` selected → all other cards disabled.
- `2bronze` selected → all other cards disabled.

### `2silver` / `2bronze` card visibility
- Only visible when `isSpecial = true`. Hidden entirely for regular classes.

### Silver selected
- Regular class: stands alone — all other cards disabled.
- Special class: one secondary allowed — `cash`, `usc`, or `eversports` (mutually exclusive).

### Bronze selected
- Regular class: stands alone — all other cards disabled.
- Special class: same secondary rules as Silver.

### USC selected (no school pass)
- Regular class: stands alone — all other cards disabled.
- Special class: one addition allowed — `eversports`, `cash`, `silver`, or `bronze`.

### Eversports selected (no school pass)
- Regular class: stands alone — all other cards disabled.
- Special class: `cash` can be added only.

### Cash selected (no school pass)
- Regular class: stands alone — all other cards disabled.
- Special class: `usc` or `eversports` can be added as base provider.

### Cash amount field
- Visible whenever `cash` is in the combination array.
- Pre-filled from `config/pricing.dropInCashRate` or surcharge rate for pass+cash.
- Staff can override per record. Stored as `cashAmount` alongside `cashDefault` snapshot.

### Valid combination matrix

| Tokens (unordered) | `isSpecial` | Credits deducted |
|---|---|---|
| `['gold']` | any | 0 |
| `['silver']` | false | 1 silver |
| `['2silver']` | true | 2 silver |
| `['silver', 'cash']` | true | 1 silver |
| `['silver', 'usc']` | true | 1 silver |
| `['silver', 'eversports']` | true | 1 silver |
| `['bronze']` | false | 1 bronze |
| `['2bronze']` | true | 2 bronze |
| `['bronze', 'cash']` | true | 1 bronze |
| `['bronze', 'usc']` | true | 1 bronze |
| `['bronze', 'eversports']` | true | 1 bronze |
| `['usc']` | false | 0 |
| `['usc', 'cash']` | true | 0 |
| `['usc', 'eversports']` | true | 0 |
| `['usc', 'silver']` | true | 1 silver |
| `['usc', 'bronze']` | true | 1 bronze |
| `['eversports']` | false | 0 |
| `['eversports', 'cash']` | true | 0 |
| `['cash']` | false | 0 |
| `['trial']` | any | 0 |

---

## Membership Rules

### Gold
- Unlimited classes, all types including special.
- No credit deduction. Valid while the membership period is active.
- Combination is always `['gold']`.

### Silver (10-class pass)
- `creditsRemaining` starts at 10. Expires after 3 months. Credits do not roll over.
- Regular class: 1 credit → `['silver']`.
- Special class, pick one: `['2silver']`, `['silver', 'cash']`, `['silver', 'usc']`, `['silver', 'eversports']`.

### Bronze (5-class pass)
- `creditsRemaining` starts at 5. Expires after 2 months. Credits do not roll over.
- Identical deduction rules to Silver.

### Credit shortfall
- If deduction would take `creditsRemaining` below 0: deduct what remains, set `creditsRemaining = 0`, `active: false`, write `shortfall: true` and `shortfallAmount` on the record.
- Staff resolve shortfall manually.

### Trial
- No pass required. Combination is `['trial']`. Zero deduction. All other cards locked.

---

## Firestore Collections

### `users`
```
uid               string
email             string
displayName       string
role              'admin' | 'staff' | 'teacher'
teacherId         string | null
active            boolean
permissions {
  viewFinancials    boolean
  viewTeacherPay    boolean
  exportReports     boolean
  manageStudents    boolean
  manageClasses     boolean
  manageTeachers    boolean
  manageRooms       boolean
  configureSystem   boolean
}
createdAt         timestamp
```

### `students`
```
id                   string
firstName            string
lastName             string
email                string | null
phone                string | null
notes                string | null
activeMembershipId   string | null
membershipTier       MembershipTier | null   (denormalized)
active               boolean
createdAt            timestamp
```

### `memberships`
```
id                string
studentId         string
tier              'silver' | 'bronze' | 'gold'
creditsRemaining  number | null   (null for gold)
creditsTotal      number | null   (null for gold)
startDate         timestamp
expiryDate        timestamp
active            boolean
createdAt         timestamp
```

### `teachers`
```
id                string
firstName         string
lastName          string
email             string
ratePerStudent    number          (e.g. 3.50 — for compensation reports)
monthlyFloor      number | null   (minimum payout; null = no floor)
reportVisibility {
  showAttendanceDetail    boolean
  showEarningsPerSession  boolean
  showTotalEarnings       boolean
}
active            boolean
createdAt         timestamp
```

### `rooms`
```
id                string
name              string
capacity          number | null
active            boolean
```

### `classTemplates`
```
id                string
name              string
style             DanceStyle
level             ClassLevel
type              ClassType
dayOfWeek         number   (0–6, 0 = Sunday)
startTime         string   ('19:00')
endTime           string   ('20:30')
teacherId         string
roomId            string
regularStudentIds string[]
isSubscription    boolean
active            boolean
createdAt         timestamp
```

### `classSessions`
```
id                string
templateId        string | null
name              string
style             DanceStyle
level             ClassLevel
type              ClassType
date              timestamp
startTime         string
endTime           string
teacherId         string
originalTeacherId string | null   (set when a substitute replaces the template teacher)
roomId            string
status            SessionStatus
isSpecial         boolean
capacity          number | null
notes             string | null
createdAt         timestamp
```

### `attendanceRecords`
Immutable once written — never update after creation.
```
id                string
sessionId         string
studentId         string
status            AttendanceStatus
combination       CombinationToken[]   (unordered, 1–2 tokens)
membershipId      string | null

membershipSnapshot {                   (frozen at check-in — never mutated)
  tier              MembershipTier
  creditsAtCheckIn  number | null
}

cashAmount        number | null
cashDefault       number | null        (config snapshot at check-in time)
estimatedValue    number               (config snapshot at check-in time)

shortfall         boolean
shortfallAmount   number | null

markedAt          timestamp
markedBy          string               (uid)
```

### `backupLogs`
Written only by Cloud Functions (Admin SDK). Read-only from client.
```
id            string
triggeredBy   'scheduled' | 'manual'
triggeredUid  string | null
status        'success' | 'failure'
startedAt     timestamp
completedAt   timestamp
durationMs    number
fileSizeBytes number | null
filePath      string | null
collections   string[]
error         string | null
```

### `config/pricing`
```
dropInCashRate              number   (default 13)
silverCashSurcharge         number
bronzeCashSurcharge         number
silverPassPrice             number
bronzePassPrice             number
goldMonthlyPrice            number
uscRatePerCheckin           number
eversportsRatePerCheckin    number
specialClassSurcharge       number
trialRate                   number   (default 0)
updatedAt                   timestamp
updatedBy                   string
```

### `config/backup`
```
nasPath         string
retentionCount  number   (default 30)
scheduleEnabled boolean
updatedAt       timestamp
updatedBy       string
```

### `config/externalProviders`
```
providers   Array<{ id: string, name: string, active: boolean }>
```

---

## Cloud Functions

### `onAttendanceCreated` (Firestore trigger)
1. Read `combination: CombinationToken[]` and `isSpecial` from the session.
2. Derive credits to deduct: `'silver'` → 1, `'2silver'` → 2, `'bronze'` → 1, `'2bronze'` → 2, else → 0.
3. Run deduction in a Firestore transaction. Cap at remaining balance, write `shortfall` if underfunded.
4. Snapshot `estimatedValue` from `config/pricing`.

### `sendStepUpCode` (HTTPS Callable)
- Authenticated. Generates a 6-digit single-use code for the calling user.
- Stores hashed code + expiry in `users/{uid}/stepUpCodes` subcollection (server-side only).
- Sends code to user's registered email.

### `verifyStepUpCode` (HTTPS Callable)
- Validates submitted code against the stored hash.
- Returns a short-lived signed token the client uses to unlock the financial view.
- Marks code as used immediately on validation.

### `manualBackup` (HTTPS Callable)
- Admin only. Exports all core collections to a timestamped JSON at the configured NAS path.
- Writes a `backupLogs` document.

### `scheduledBackup` (Cloud Scheduler)
- Daily at 02:00 Europe/Berlin. Same logic as `manualBackup`.

### `cleanupOldBackups` (Cloud Scheduler)
- Weekly. Deletes `backupLogs` documents older than 90 days.

---

## Testing — what NOT to test (the "what to test" is obvious; the exclusions prevent wasted effort):
  - Don't test: Tailwind classes, Radix UI internals, static markup
  - Do test: hook logic, Firestore query behavior, combination/credit calculation logic

---

## CLAUDE.md update triggers — currently missing, leads to bloat:
  - Update only when: new dependency affects architecture, a convention changes,
  - a non-obvious constraint exists that code alone doesn't communicate.
  - Do NOT update for: bug fixes, refactors, individual feature implementation details.

--- 

## Task workflow — the "write plan → get approval → code" discipline is valuable:
  Before starting any feature: read spec.md + relevant code, write a plan, get approval.

---

## Non-Functional Requirements

1. Credit deductions are atomic (Firestore transactions), exclusively server-side.
2. `estimatedValue`, `cashDefault`, and `membershipSnapshot` on attendance records are immutable after creation.
3. All Firestore operations are gated by security rules enforcing role and permission flags.
4. The app runs fully against the Firebase Local Emulator Suite — no live project required for development.
5. Soft deletes throughout — `active: false`. Nothing is hard deleted.
6. Step-up codes are server-generated, single-use, expire after 10 minutes, never stored client-side.
7. Every backup run is logged: status, file size, duration, collections exported, errors.
8. UI supports light, dark, and system theme — persisted per device.
9. Language preference (en/de) persists per device across sessions.

---

## Build Order

1. Monorepo scaffold — Vite, Firebase emulator, i18n, routing, `RequireAuth`
2. Auth — login, session context, role + permissions loading, guard redirects per role
3. Firestore security rules baseline
4. Teachers + rooms CRUD (admin only)
5. Student management — create, edit, deactivate, search
6. Membership management — assign pass, view credits, manual adjustment
7. Class templates — CRUD, roster management
8. Class sessions — create from template or ad-hoc, session list
9. Check-in flow — roster, one-tap status, combination picker, credit warnings
10. `onAttendanceCreated` Cloud Function — credit deduction (atomic)
11. Reports — charts, monthly comparison, step-up verification gate
12. Settings — pricing config, backup config, external providers, user management