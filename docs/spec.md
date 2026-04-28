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
- never use input type = "number" for number inputs, instead use input type text with inputMode='numeric'
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

**No teacher login.** Teachers are managed resources only — assigned to sessions, their names appear on records. They do not have login accounts. All check-in is performed by admin or staff.

- Restricted UI sections are **hidden entirely**, not disabled.
- Firestore security rules enforce the same restrictions server-side.
- `admin` always has all permission flags set to `true` and cannot be reduced.

### Permission flags (stored on `users` document)

| Flag | Staff default | Controls |
|---|---|---|
| `viewFinancials` | `false` | Revenue totals, class income, margin data |
| `exportReports` | `false` | Download Excel/PDF/CSV reports |
| `manageStudents` | `true` | Create/edit/deactivate students |
| `manageClasses` | `true` | Create/edit class templates and sessions |
| `manageTeachers` | `false` | Add/edit/deactivate teachers |
| `manageRooms` | `false` | Add/edit/deactivate rooms |
| `configureSystem` | `false` | Pricing config, dance styles, class levels |

### Step-up email verification

Required before any view or export that contains revenue data.

1. User with `viewFinancials: true` navigates to a restricted view.
2. App shows prompt: "Enter the code sent to your email."
3. Cloud Function generates a 6-digit single-use code, expires in 10 minutes.
4. User enters code → financial view unlocks for the session.
5. Unlock clears on tab close or 30 minutes of inactivity. Never persisted across sessions.
6. Codes are server-generated, single-use, never stored client-side.

---

## Core Types

```typescript
type Role = 'admin' | 'staff'

// Eversports monthly subscription tiers
type MembershipTier = 'gold' | 'silver' | 'bronze'

// Offline class card purchases
type ClassCardType = 'ten_class' | 'five_class'

// Unified pass type — both memberships and class cards
type PassType = MembershipTier | ClassCardType

type ExternalProvider = 'usc' | 'eversports'

// Atomic booking tokens. Stored as an unordered array on the attendance record.
// 'gold' | 'silver' | 'bronze' | 'card' = studio passes (Eversports or offline)
// 'usc' | 'eversports' = external provider check-in
// 'dropin' = walk-in cash (€13, configurable)
// 'trial' = free trial (students with no active pass only)
// 'cash' = supplement only — combined with another token for specials or shortfall
type CombinationToken =
  | 'gold'        // Gold membership — unlimited, any class
  | 'silver'      // Silver membership — 1 credit (regular) or 2 (special/event)
  | 'bronze'      // Bronze membership — 1 credit (regular) or 2 (special/event)
  | 'card'        // Class card (10-class or 5-class) — 1 credit regular, 2 special/event
  | 'usc'         // Urban Sports Club
  | 'eversports'  // Eversports one-time / non-membership
  | 'dropin'      // Drop-in cash payment (€13 default)
  | 'trial'       // Free trial
  | 'cash'        // Cash supplement (combined with usc/eversports/membership for specials)

// Order never matters: ['silver', 'cash'] === ['cash', 'silver']
type AttendanceCombination = CombinationToken[]

type SessionStatus = 'planned' | 'active' | 'completed' | 'cancelled'

// Party: attendance recorded but 0 credits deducted, combination is always []
type ClassType = 'regular' | 'special' | 'event' | 'party'

type DanceStyle = 'bachata' | 'kizomba' | 'salsa' | 'zouk' | 'afro' | 'other'
// Extensible: dynamic list stored in config/danceStyles

type ClassLevel = 'beginner' | 'intermediate' | 'advanced' | 'open'
// Extensible: dynamic list stored in config/classLevels
```

---

## Credit Rules

| Pass | Regular class | Special / Event | Party |
|---|---|---|---|
| gold | 0 (unlimited) | 0 (unlimited) | 0 |
| silver | 1 credit | 2 credits | 0 |
| bronze | 1 credit | 2 credits | 0 |
| ten_class / five_class | 1 credit | 2 credits | 0 |
| usc / eversports / dropin / trial | 0 | 0 | 0 |

**Credit deduction amount is determined server-side** by reading `session.type` in `onAttendanceCreated`. The `card` token means "this student used their class card" — 1 or 2 credits are deducted depending on session type, never client-side.

**Shortfall:** If a student has 1 credit remaining but attends a special/event (needs 2), the system shows supplement options: `[pass + cash]`, `[pass + USC]`, `[pass + Eversports]`. The 1 credit is deducted and the supplement covers the shortfall. The UI must make all valid supplement options visible.

**Party classes:** `combination: []` (empty). No picker shown. 0 credits deducted.

---

## Combination Selection Rules

These rules drive the UI token picker (CombinationPickerDialog).

### Exclusions — always

- `gold` selected → all others disabled
- `trial` selected → all others disabled
- `dropin` selected → all others disabled
- `silver` selected → `bronze`, `card`, `gold`, `trial`, `dropin` disabled
- `bronze` selected → `silver`, `card`, `gold`, `trial`, `dropin` disabled
- `card` selected → `silver`, `bronze`, `gold`, `trial`, `dropin` disabled

### Supplements — only for special/event classes

Pass tokens (`silver`, `bronze`, `card`) can be combined with exactly one of: `cash`, `usc`, `eversports`.
External tokens (`usc`, `eversports`) without a pass can be combined with `cash` for specials.
For regular classes, no supplements allowed.

### Valid combinations

| Tokens | Class type | Credits deducted |
|---|---|---|
| `['gold']` | any | 0 |
| `['silver']` | regular | 1 silver credit |
| `['silver', 'cash']` | special/event | 1 silver credit |
| `['silver', 'usc']` | special/event | 1 silver credit |
| `['silver', 'eversports']` | special/event | 1 silver credit |
| `['bronze']` | regular | 1 bronze credit |
| `['bronze', 'cash']` | special/event | 1 bronze credit |
| `['bronze', 'usc']` | special/event | 1 bronze credit |
| `['bronze', 'eversports']` | special/event | 1 bronze credit |
| `['card']` | regular | 1 card credit |
| `['card', 'cash']` | special/event | 1 card credit |
| `['card', 'usc']` | special/event | 1 card credit |
| `['card', 'eversports']` | special/event | 1 card credit |
| `['usc']` | any | 0 |
| `['usc', 'cash']` | special/event | 0 |
| `['eversports']` | any | 0 |
| `['eversports', 'cash']` | special/event | 0 |
| `['dropin']` | any | 0 |
| `['trial']` | any | 0 |
| `[]` | party only | 0 |

---

## Membership and Pass Types

### Memberships (Eversports subscriptions)

Stored in `memberships` collection.

| Tier | Credits/month | Expiry | Notes |
|---|---|---|---|
| gold | unlimited (null) | 30 days | Any class, any type, no deduction |
| silver | 8 | 30 days | 1 credit regular, 2 credits special/event |
| bronze | 4 | 30 days | Same as silver deduction rules |

### Class Cards (offline purchases)

Stored in `classCards` collection.

| Type | Credits | Expiry | Notes |
|---|---|---|---|
| ten_class | 10 | 4 months | Same deduction rules as silver/bronze |
| five_class | 5 | 4 months | Same deduction rules |

### Credit Shortfall

If deduction would exceed `creditsRemaining`: deduct what remains, set `creditsRemaining = 0`, `active: false`, write `shortfall: true` and `shortfallAmount` on the attendance record.

### Trial

Always available for students with no active pass. `combination: ['trial']`. Zero deduction. No other tokens can be combined with trial.

### Drop-in

Students who walk in without a pass pay €13 (configurable in `config/pricing.dropInRate`). `combination: ['dropin']`. They ARE added to the student database so staff can find them on return visits and upsell memberships.

---

## Firestore Collections

### `users`

```
uid               string
email             string
displayName       string
role              'admin' | 'staff'
active            boolean
permissions {
  viewFinancials    boolean
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
name                 string             (single name field)
email                string | null
phone                string | null
notes                string | null
activePassId         string | null      (denormalized from memberships or classCards)
passType             PassType | null    (denormalized)
active               boolean
createdAt            timestamp
```

### `memberships`

Eversports monthly subscriptions only.

```
id                string
studentId         string
tier              'gold' | 'silver' | 'bronze'
creditsRemaining  number | null   (null for gold)
creditsTotal      number | null   (null for gold; 8 for silver, 4 for bronze)
startDate         timestamp
expiryDate        timestamp        (startDate + 30 days)
active            boolean
createdAt         timestamp
createdBy         string           (uid of admin/staff who recorded it)
```

### `classCards`

Offline purchases only (10-class, 5-class).

```
id                string
studentId         string
type              'ten_class' | 'five_class'
creditsRemaining  number           (starts at creditsTotal)
creditsTotal      number           (10 or 5)
purchaseDate      timestamp
expiryDate        timestamp        (purchaseDate + 4 months)
active            boolean
createdAt         timestamp
createdBy         string
```

### `teachers`

```
id                string
firstName         string
lastName          string
email             string
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
isSpecial         boolean         (true if type !== 'regular')
capacity          number | null
notes             string | null
createdAt         timestamp
```

### `attendanceRecords`

Can be corrected by admin (set `active: false`, create a new record).

```
id                string
sessionId         string
studentId         string
combination       CombinationToken[]   ([] for party classes)
membershipId      string | null        (set if Eversports membership used)
classCardId       string | null        (set if class card used)
passSnapshot {                         (frozen at check-in)
  type              PassType
  creditsAtCheckIn  number | null
} | null
estimatedValue    number
shortfall         boolean
shortfallAmount   number | null
notes             string | null        (optional note by admin/staff at check-in)
markedAt          timestamp
markedBy          string               (uid)
active            boolean              (false = soft-deleted/corrected record)
```

### `config/pricing`

```
dropInRate                  number   (default 13)
silverMonthlyPrice          number
bronzeMonthlyPrice          number
goldMonthlyPrice            number
tenClassCardPrice           number
fiveClassCardPrice          number
uscRatePerCheckin           number   (for revenue estimation)
eversportsRatePerCheckin    number   (for revenue estimation)
updatedAt                   timestamp
updatedBy                   string
```

### `config/danceStyles`

```
styles      string[]   (dynamic list; default: ['bachata','kizomba','salsa','zouk','afro','other'])
updatedAt   timestamp
updatedBy   string
```

### `config/classLevels`

```
levels      string[]   (dynamic list; default: ['beginner','intermediate','advanced','open'])
updatedAt   timestamp
updatedBy   string
```

### `config/externalProviders`

```
providers   Array<{ id: string, name: string, active: boolean }>
```

---

## Cloud Functions

### `onAttendanceCreated` (Firestore trigger)

Runs when a new `attendanceRecords/{id}` document is created.

```
1. Read combination and sessionId from the new record.
2. Read classSessions/{sessionId} to get session.type.
3. If session.type === 'party' OR combination === [] → return (no deduction).
4. isSpecialClass = session.type in ['special', 'event']
5. If 'silver' or 'bronze' in combination:
     creditsToDeduct = isSpecialClass ? 2 : 1
     → run transaction on memberships/{membershipId}
6. If 'card' in combination:
     creditsToDeduct = isSpecialClass ? 2 : 1
     → run transaction on classCards/{classCardId}
7. If 'gold', 'usc', 'eversports', 'dropin', 'trial', 'cash' only → creditsToDeduct = 0
8. Shortfall: if creditsToDeduct > creditsRemaining:
     deduct what's available, shortfall=true, shortfallAmount, mark pass active=false
9. Update pass + attendance record in same transaction.
```

### `sendStepUpCode` (HTTPS Callable)

- Authenticated. Generates a 6-digit single-use code for the calling user.
- Stores hashed code + expiry in `users/{uid}/stepUpCodes` subcollection (server-side only).
- Sends code to user's registered email.

### `verifyStepUpCode` (HTTPS Callable)

- Validates submitted code against the stored hash.
- Returns a short-lived signed token the client uses to unlock the financial view.
- Marks code as used immediately on validation.

---

### Dashboard

- Welcome greeting.
- Today's classes from `classSessions` where date == today. Click a row → inline expansion for check-in.

### Dashboard Check-in (inline, not a modal)

- Single search field in the expanded row: "Enter student name…"
- Student with active pass → auto check-in based on pass type; notes field; confirm button.
- Student with no pass → "How are they attending?" picker: [USC] [Eversports] [Drop-in €13] [Trial].
- Special/event + pass with 1 credit shortfall → supplement picker (pass + cash/USC/Eversports).
- Student not found → [+ Add Student] inline form.
- Party class → student search only, no combination picker. `combination: []`, 0 credits.

### Attendance (history calendar)

Read-only monthly calendar. Click a day → session list. Click a session → attendee list (name, pass badge, combination, notes). No check-in from this page.

### Classes

Two tabs:

1. **Calendar** — monthly, color-coded by dance style. Click → view/edit/cancel (admin).
2. **Sessions (week view)** — 7-column grid, week navigation, [Copy Previous Week] button.

### Settings

Sidebar nav: Pricing | Dance Styles | Class Levels | Membership Types | Class Card Types | External Providers | Templates | Rooms | Users.

## Testing

### What NOT to test

- Don't test: Tailwind classes, Radix UI internals, static markup
- Do test: hook logic, Firestore query behavior, combination/credit calculation logic

### Unit tests — Cloud Function credit logic

- silver + regular → 1 credit
- silver + special → 2 credits
- silver + party → 0 credits
- bronze + event → 2 credits
- card + special → 2 credits
- gold + any → 0 credits
- dropin/trial/usc/eversports + any → 0 credits
- Shortfall: 1 credit remaining, needs 2 → shortfall=true, credits=0, pass deactivated
- `[silver, cash]` → only 1 silver credit deducted

### Firestore rules tests

- Admin: full write everywhere
- Staff: write attendance, memberships, classCards; cannot write config
- Unauthenticated: denied everywhere
- Attendance records: can be updated (no immutability rule)

---

## CLAUDE.md update triggers

- Update only when: new dependency affects architecture, a convention changes, a non-obvious constraint exists that code alone doesn't communicate.
- Do NOT update for: bug fixes, refactors, individual feature implementation details.

---

## Task workflow

Before starting any feature: read spec.md + relevant code, write a plan, get approval.

---

## Non-Functional Requirements

1. Credit deductions are atomic (Firestore transactions), exclusively server-side.
2. `passSnapshot` and `estimatedValue` on attendance records are frozen at check-in time (written by client; Cloud Function may update `shortfall`/`shortfallAmount`).
3. All Firestore operations are gated by security rules enforcing role and permission flags.
4. The app runs fully against the Firebase Local Emulator Suite — no live project required for development.
5. Soft deletes throughout — `active: false`. Nothing is hard deleted.
6. Step-up codes are server-generated, single-use, expire after 10 minutes, never stored client-side.
7. UI supports light, dark, and system theme — persisted per device.
8. Language preference (en/de) persists per device across sessions.
