# Dashboard — Feature Spec & Test Plan

> What is implemented, what is not, acceptance criteria for the complete feature,
> data contracts per widget, i18n key requirements, and the test matrix.
> Written against codebase state as of 2026-04-28.

---

## 1. Current Implementation Status

**File:** `apps/web/src/pages/DashboardPage.tsx`

| Widget | Status | Notes |
|---|---|---|
| Welcome greeting | ✅ Done | `t('dashboard.welcome', { name })` + `appUser.displayName` |
| Stat cards (4×) | ⚠️ Static mock | All values and labels are hardcoded — not Firestore-backed |
| Today's Schedule section | ⚠️ Static mock | Rows are hardcoded — not queried from Firestore |
| Analytics charts | ❌ Not present | `design.md §3.2` requires 3 charts; none exist yet |
| Emulator Status block | ✅ Done | Dev-only block; uses `t()` for heading |

### Convention violations

| Violation | File location | Rule |
|---|---|---|
| Hardcoded label strings: "Today's Sessions", "Total Students", "Active Passes", "Check-ins This Week" | `DashboardPage.tsx` L125–L152 | `spec.md`: all user-facing strings via `t()` |
| Hardcoded status labels: "Active", "Planned", "Done" | `DashboardPage.tsx` L82–L84 | Same |
| Hardcoded section heading: "Today's Schedule" | `DashboardPage.tsx` L166 | Same |
| Hardcoded CTA: "Open check-in →" | `DashboardPage.tsx` L170 | Same |
| Hardcoded subtitle: "2 upcoming · 1 done" | `DashboardPage.tsx` L167 | Same — must be computed from session statuses |
| Hardcoded session rows (Bachata Beginner, etc.) | `DashboardPage.tsx` L174–L176 | Data must come from Firestore |
| Hardcoded stat values (4, 127, 89, 156) | `DashboardPage.tsx` L125–L162 | Data must come from Firestore |
| `<a href="/attendance">` — native anchor | `DashboardPage.tsx` L169 | Must be `<Link to="/attendance">` (React Router) |
| Emulator block visible in production | `DashboardPage.tsx` L179 | Must be gated on `import.meta.env.DEV` |
| No test file exists | — | `spec.md`: every feature needs at minimum a typed hook, a component, and a smoke test |

### Routing issues (Shell + App level)

| Issue | Location | Required resolution |
|---|---|---|
| Default route redirects to `/attendance`, not `/dashboard` | `App.tsx` L40 | Decide and record as ADR (see §6) |
| `/rooms` nav link and route both exist | `Shell.tsx` L265, `App.tsx` L60 | `decisions.md`: rooms are Settings-only; remove from top-level nav and routes |
| `/reports` nav link exists but no route defined | `Shell.tsx` L271 | Wildcard bounces user back to `/attendance`; broken UX |
| `/settings` nav link exists but no route defined | `Shell.tsx` L278 | Same |

---

## 2. Acceptance Criteria — Complete Feature

The dashboard is considered complete when every criterion below passes.

### 2.1 Stat cards

| Card | Data definition | Acceptance criterion |
|---|---|---|
| **Today's Sessions** | Count of `classSessions` where `date` = today | Live count; badge shows active/planned breakdown |
| **Total Students** | Count of `students` where `active == true` | Accurate; updates after a student is added or deactivated |
| **Active Passes** | Count of `students` where `active == true AND passType != null` | Correct count; badge shows percentage of total students |
| **Check-ins This Week** | Count of `attendanceRecords` where `markedAt` is within current Mon–Sun week AND `active == true` | Correct count; trend line shows delta vs previous 7-day window |

Sparklines may remain decorative in v1 — acceptable provided no trend copy claims a specific calculation that isn't performed.

### 2.2 Today's Schedule

| Criterion | Detail |
|---|---|
| Data source | `classSessions` where `date` = today, ordered by `startTime` asc |
| Empty state | Render `t('dashboard.schedule.empty')` — not a blank area |
| Row fields | Session name, `startTime–endTime`, teacher name (resolved from `teacherId`), `enrolled / capacity`, status badge |
| Status badge | Maps `ClassSession.status` → i18n string; never a hardcoded English label |
| Enrolled count | Count of active `attendanceRecords` for that session |
| Section subtitle | Dynamically derived: `t('dashboard.schedule.subtitle', { upcoming, done })` |
| "Open check-in" | `<Link to="/attendance">`, not `<a href>` |
| Cancelled session | Row displayed at reduced opacity; clicking does not expand (no check-in from cancelled) |

### 2.3 Role-based visibility

| Role | Visibility |
|---|---|
| `admin` | All 4 stat cards; full schedule; "Open check-in" CTA |
| `staff` | Same as admin |
| Either role | Emulator block only rendered when `import.meta.env.DEV === true` |

Analytics charts (bar, donut, line per `design.md §3.2`) are deferred — mark with a `{/* TODO: analytics charts */}` comment.

### 2.4 Loading state

All Firestore-backed widgets must render skeleton placeholders (`bg-muted animate-pulse rounded`) while queries are pending — not zeroes, not empty strings.

### 2.5 Error state

If any query fails, the relevant widget shows `t('errors.failedToLoad')` in place of data. The rest of the page must remain functional.

### 2.6 i18n

All visible strings pass through `t()`. Switching language with the EN/DE toggle updates all dashboard text without a page reload.

---

## 3. Data Contracts

### 3.1 Existing hooks to reuse

| Hook | File | What it queries |
|---|---|---|
| `useClassSessionsByDate(date)` | `hooks/useClassSessions.ts` | `classSessions` where `date` ∈ [startOfDay, startOfNextDay), ordered by `startTime`. `staleTime: 60_000` |
| `useStudents()` | `hooks/useStudents.ts` | `students` where `active == true`, ordered by `name` |
| `useAttendanceRecordsBySession(sessionId)` | `hooks/useAttendanceRecords.ts` | `attendanceRecords` where `sessionId == id`. `staleTime: 30_000` |
| `useTeachers()` | `hooks/useTeachers.ts` | `teachers` where `active == true` — needed for teacher name resolution on schedule rows |

### 3.2 New hooks needed for stat cards

| Hook | Query | Return shape |
|---|---|---|
| `useTodaySessionStats` | Derive from `useClassSessionsByDate(today)` | `{ total: number; active: number; planned: number; completed: number }` |
| `useStudentStats` | Derive from `useStudents()` — count total vs count with `passType !== null` | `{ total: number; withPass: number; passPercentage: number }` |
| `useWeeklyCheckinCount` | New: `attendanceRecords` where `markedAt >= startOfWeek(today)`, `markedAt < endOfWeek(today)`, `active == true` | `{ thisWeek: number; prevWeek: number }` |

`useTodaySessionStats` and `useStudentStats` should derive from hooks already loaded for the schedule widget — no duplicate Firestore reads.

### 3.3 Teacher name resolution

`ScheduleRow` needs teacher names, not IDs. Strategy:

- Load `useTeachers()` in `DashboardPage` (one query, cached).
- Build a `Map<id, firstName + lastName>` and pass it as a prop to `ScheduleRow`.
- This is consistent with how other pages resolve teacher names.

### 3.4 Recommended stale times

| Data | `staleTime` | Rationale |
|---|---|---|
| Today's sessions | 60 000 ms | Sessions rarely change mid-day |
| Students list | 120 000 ms | Enrolment changes are infrequent |
| Attendance records per session | 30 000 ms | Check-ins happen continuously |
| Weekly check-in count | 60 000 ms | Aggregate; slight lag acceptable |

---

## 4. i18n Key Catalogue

### 4.1 Keys already in `locales/en/common.json` and `locales/de/common.json`

```json
"dashboard": {
  "title": "Dashboard",
  "welcome": "Welcome back, {{name}}",
  "emulatorStatus": "Firebase Emulator Suite"
}
