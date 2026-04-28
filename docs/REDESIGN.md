
## Background

The original design was built on assumptions that didn't match how the studio actually operates. This redesign replaces those assumptions with the real business model.

The app replaces a physical register. Staff use it at the front desk to record who attended each class. The data model must capture every real-world payment/booking scenario without being overly complex.

---

## Booking Channels

Students arrive via one of five channels:

| Channel | Token | Notes |
|---|---|---|
| **Gold membership** | `gold` | Unlimited Eversports subscription, monthly |
| **Silver membership** | `silver` | 8 credits/month, Eversports, 1–2 credits per class |
| **Bronze membership** | `bronze` | 4 credits/month, Eversports, 1–2 credits per class |
| **10-class card** | `card` | 10 credits, 4 months, offline purchase |
| **5-class card** | `card` | 5 credits, 4 months, offline purchase |
| **Urban Sports Club** | `usc` | External membership, paid externally |
| **Eversports one-time** | `eversports` | Non-membership Eversports booking |
| **Drop-in** | `dropin` | Walk-in cash, €13 (configurable) |
| **Trial** | `trial` | Free, always available for students with no active pass |
| **Cash supplement** | `cash` | Supplement only; combined with another token for specials/shortfall |

---

## Credit Rules

| Pass Type | Regular Class | Special / Event | Party |
|---|---|---|---|
| gold | 0 (unlimited) | 0 (unlimited) | 0 |
| silver | 1 credit | 2 credits | 0 |
| bronze | 1 credit | 2 credits | 0 |
| ten_class / five_class | 1 credit | 2 credits | 0 |
| usc / eversports / dropin / trial | 0 | 0 | 0 |

**Shortfall**: If a student has 1 credit remaining but attends a special/event (requires 2 credits), the system shows supplement options: `[pass + cash]`, `[pass + USC]`, `[pass + Eversports]`. The 1 credit is used and the supplement covers the shortfall.

**Party classes**: Attendance is recorded but combination is `[]` and 0 credits are deducted. No combination picker is shown.

---

## Membership vs Class Cards (Terminology)

- **Membership**: Monthly Eversports subscription (gold/silver/bronze). Stored in `memberships` collection. Renews monthly.
- **Class Card** (also called "Pass"): Offline purchase (10-class or 5-class). Stored in `classCards` collection. Expires 4 months from purchase.
- Both types share the `PassType` union in TypeScript.
- The `Student` document stores `activePassId` + `passType` (denormalized) for fast roster display.

---

## Drop-in Policy

- Drop-in students ARE added to the student database (so they're searchable on return visits).
- A returning drop-in's attendance history is shown in their student drawer with class counts.
- This enables staff to upsell memberships to frequent drop-ins.
- Drop-in students have `passType: null` — they appear in the student roster with a "No pass" badge.
- When checking in a drop-in: the system shows the "How are they attending?" picker (USC / Eversports / Drop-in €13 / Trial).

---

## Roles

| Role | Description |
|---|---|
| `admin` | Full access — all features, settings, reports, user management |
| `staff` | Take attendance, assign/record memberships and class cards. Cannot configure system. |

**Teacher login does not exist.** Teachers are managed resources (assigned to sessions, their names appear on records) but they do not have login accounts. All check-in is performed by admin or staff.

---

## Data Model

### Firestore Collections

#### `students/{id}`

```
name: string
email: string | null
phone: string | null
notes: string | null
activePassId: string | null        ← denormalized from memberships or classCards
passType: PassType | null          ← denormalized
active: boolean
createdAt: Timestamp
```

#### `memberships/{id}`

Eversports monthly subscriptions only.

```
studentId: string
tier: 'gold' | 'silver' | 'bronze'
creditsRemaining: number | null    ← null for gold
creditsTotal: number | null        ← null for gold; 8 for silver, 4 for bronze
startDate: Timestamp
expiryDate: Timestamp              ← startDate + 30 days
active: boolean
createdAt: Timestamp
createdBy: string                  ← uid of admin/staff who recorded it
```

#### `classCards/{id}`

Offline purchases only (10-class, 5-class).

```
studentId: string
type: 'ten_class' | 'five_class'
creditsRemaining: number           ← starts at creditsTotal
creditsTotal: number               ← 10 or 5
purchaseDate: Timestamp
expiryDate: Timestamp              ← purchaseDate + 4 months
active: boolean
createdAt: Timestamp
createdBy: string
```

#### `attendanceRecords/{id}`

Immutable in intent. Can be corrected by admin (set active: false, create new record).

```
sessionId: string
studentId: string
combination: CombinationToken[]    ← [] for party classes
membershipId: string | null        ← set if silver/bronze/gold membership used
classCardId: string | null         ← set if 10-class/5-class card used
passSnapshot: {
  type: PassType
  creditsAtCheckIn: number | null
} | null
estimatedValue: number
shortfall: boolean
shortfallAmount: number | null
notes: string | null               ← optional note by admin/staff
markedAt: Timestamp
markedBy: string                   ← uid
active: boolean                    ← false = soft-deleted/corrected record
```

#### `classSessions/{id}`

```
templateId: string | null
name: string
style: DanceStyle
level: ClassLevel
type: 'regular' | 'special' | 'event' | 'party'
date: Timestamp
startTime: string                  ← 'HH:MM'
endTime: string
teacherId: string
originalTeacherId: string | null
roomId: string
status: 'planned' | 'active' | 'completed' | 'cancelled'
isSpecial: boolean                 ← true if type !== 'regular'
capacity: number | null
notes: string | null
createdAt: Timestamp
```

#### `classTemplates/{id}`

```
name: string
style: DanceStyle
level: ClassLevel
type: ClassType
dayOfWeek: number                  ← 0–6
startTime: string
endTime: string
teacherId: string
roomId: string
regularStudentIds: string[]
isSubscription: boolean
active: boolean
createdAt: Timestamp
```

#### `config/pricing`

```
dropInRate: number                 ← default 13
silverMonthlyPrice: number
bronzeMonthlyPrice: number
goldMonthlyPrice: number
tenClassCardPrice: number
fiveClassCardPrice: number
uscRatePerCheckin: number          ← for revenue estimation
eversportsRatePerCheckin: number
updatedAt: Timestamp
updatedBy: string
```

#### `config/danceStyles`

```
styles: string[]                   ← dynamic list of active styles
updatedAt: Timestamp
updatedBy: string
```

#### `config/classLevels`

```
levels: string[]                   ← dynamic list of active levels
updatedAt: Timestamp
updatedBy: string
```

---

## Pages & Routes

| Route | Component | Access |
|---|---|---|
| `/` | DashboardPage | all |
| `/attendance` | AttendancePage (calendar history) | all |
| `/classes` | ClassesPage (calendar + sessions) | all |
| `/students` | StudentsPage | admin, staff |
| `/teachers` | TeachersPage | admin, staff |
| `/reports` | ReportsPage | admin, staff |
| `/settings` | SettingsPage | admin only |

Removed: `/rooms` (moved to Settings → Rooms section)

---

## Dashboard (Check-in Surface)

The dashboard is the primary place where attendance is taken.

**Layout:**

1. Welcome greeting
2. Today's classes list (from `classSessions` where `date == today`)
   - Click a class row → row expands inline
   - Admin-only: [+ Add Class] button
3. Analytics (3 charts): weekly check-ins, pass type breakdown, 30-day trend

**Inline check-in flow:**

- Single search field: "Enter student name…"
- Student found with active pass → auto-deduct based on pass type; notes field shown before confirm
- Student found with no pass → "How are they attending?" picker: [USC] [Eversports] [Drop-in €13] [Trial]
- For special/event + pass with 1 credit (shortfall) → supplement picker shown
- Student not found → [+ Add Student] inline form
- Party class → student search only, no combination picker

---

## Attendance Page (History Calendar)

Read-only monthly calendar view.

- Calendar grid (Mon–Sun)
- Each day shows session count badge
- Click a day → session list for that day
- Click a session → attendee list: name, pass type badge, combination, notes

---

## Classes Page (Two Tabs)

**Tab 1: Calendar** — monthly view, color-coded by dance style, click to view/edit/cancel sessions

**Tab 2: Sessions (week view)**

- 7-column week grid
- Week navigation: prev/next + Today
- [Copy Previous Week] → copies session shells from previous 7 days to current week (no attendance)

Templates are managed in Settings → Templates.

---

## Settings Page

| Section | Content |
|---|---|
| Pricing | Drop-in rate, membership prices, card prices |
| Dance Styles | Add/toggle styles (feeds DanceStyle type) |
| Class Levels | Add/toggle levels (feeds ClassLevel type) |
| Membership Types | Reference view (gold/silver/bronze) |
| Class Card Types | Reference view (10-class/5-class) |
| External Providers | Enable/disable USC, Eversports |
| Templates | Create/edit/delete class templates (form-based) |
| Rooms | List, add, edit, deactivate rooms |
| Users | Manage admin/staff accounts, toggle permission flags |

---

## Cloud Function: `onAttendanceCreated`

Runs when a new `attendanceRecords/{id}` document is created.

```
1. Read classSessions/{sessionId} to get session.type
2. If session.type === 'party' OR combination === [] → return (no deduction)
3. If 'silver' or 'bronze' in combination:
     creditsToDeduct = (type === 'special' || type === 'event') ? 2 : 1
     → transaction on memberships/{membershipId}
4. If 'card' in combination:
     creditsToDeduct = (type === 'special' || type === 'event') ? 2 : 1
     → transaction on classCards/{classCardId}
5. If creditsToDeduct > creditsRemaining:
     deduct what's available, shortfall=true, shortfallAmount, mark pass active=false
6. Update pass + attendance record in same transaction
```

---

## Test Strategy

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
- Attendance records: can be updated (not immutable)

### Component tests

- `CheckInInline`: auto check-in for pass holders; source picker for no-pass students; shortfall supplement picker
- `AttendancePage`: calendar renders, day click, session expand shows attendees
- `SettingsPage`: pricing save, style add, template create

### Integration tests (emulator)

- Full check-in: search → select → credit deducted → record created
- Drop-in: unknown name → add student → dropin combination → in DB
- Special shortfall: 1 credit → picker → [silver+cash] → record created, pass deactivated
- Copy-previous-week: session shells created for new week
