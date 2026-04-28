# Elite Manager — UI Design Document

**Version:** 2.0 | **Date:** 2026-04-28 | **Stack:** React 19 + TypeScript + Vite 6 + Firebase + Tailwind CSS v4

---

## Context

Elite Manager is a daily-use dance school attendance management app for front-desk staff. The current codebase has a working auth flow and a left-sidebar shell, but all content pages are placeholders. This document defines the complete UI design for the production app — covering design tokens, layout, page specs, component catalog, key interaction flows, and performance considerations.

**Design inspiration:** Eversports, Fitogram, Linear — premium, modern, fast, list-focused. Not a spreadsheet; not a cluttered dashboard.

---

## 1. Design System

### 1.1 Color Palette — Full Token Set

Add to `apps/web/src/index.css` inside the existing `@theme {}` block:

```css
/* Light mode additions */
--color-primary-hover:        oklch(0.53 0.21 240);
--color-primary-subtle:       oklch(0.93 0.05 240);

--color-secondary-hover:      oklch(0.48 0.23 285);
--color-secondary-subtle:     oklch(0.93 0.05 285);

--color-surface:              oklch(0.97 0 0);      /* inner panels, alt table rows */
--color-foreground-secondary: oklch(0.35 0 0);      /* secondary text */
--color-border-strong:        oklch(0.80 0 0);      /* inputs focused, dividers */

--color-destructive-hover:    oklch(0.48 0.21 25);
--color-destructive-subtle:   oklch(0.94 0.05 25);

--color-warning-hover:        oklch(0.63 0.19 85);
--color-warning-subtle:       oklch(0.95 0.07 85);

--color-success:              oklch(0.62 0.18 145);
--color-success-hover:        oklch(0.55 0.19 145);
--color-success-subtle:       oklch(0.94 0.05 145);
--color-success-foreground:   oklch(0.98 0 0);

--radius-sm:   0.25rem;
--radius-lg:   0.75rem;
--radius-xl:   1rem;
--radius-full: 9999px;

/* Membership tier accents (dot/text only, never full backgrounds) */
--color-tier-gold:   oklch(0.78 0.16 85);
--color-tier-silver: oklch(0.68 0.04 240);
--color-tier-bronze: oklch(0.65 0.12 50);
```

Dark mode — add in `@media (prefers-color-scheme: dark)` + `.dark` class:

```css
--color-primary:              oklch(0.68 0.18 240);
--color-primary-subtle:       oklch(0.22 0.06 240);
--color-secondary:            oklch(0.65 0.20 285);
--color-secondary-subtle:     oklch(0.22 0.06 285);
--color-background:           oklch(0.12 0 0);
--color-surface:              oklch(0.16 0 0);
--color-card:                 oklch(0.18 0 0);
--color-card-foreground:      oklch(0.92 0 0);
--color-foreground:           oklch(0.92 0 0);
--color-foreground-secondary: oklch(0.70 0 0);
--color-muted:                oklch(0.22 0 0);
--color-muted-foreground:     oklch(0.55 0 0);
--color-border:               oklch(0.28 0 0);
--color-border-strong:        oklch(0.38 0 0);
--color-destructive:          oklch(0.62 0.20 25);
--color-destructive-subtle:   oklch(0.22 0.06 25);
--color-warning:              oklch(0.76 0.17 85);
--color-warning-subtle:       oklch(0.22 0.07 85);
--color-success:              oklch(0.68 0.17 145);
--color-success-subtle:       oklch(0.22 0.06 145);
```

Theme preference stored in `localStorage` key `elite-manager-theme` (`"light"` | `"dark"` | `"system"`). Toggle in sidebar footer.

#### Semantic Status Badge Colors

| Concept | Light BG | Light Text | Dark BG | Dark Text |
|---|---|---|---|---|
| Checked in | success-subtle | success | success-subtle | success |
| Trial | secondary-subtle | secondary | secondary-subtle | secondary |
| Cancelled | destructive-subtle | destructive | destructive-subtle | destructive |
| Active session | primary-subtle | primary | primary-subtle | primary |
| Completed | muted | foreground-secondary | muted | foreground-secondary |

#### Credit Warning Visual States

| Credits Remaining | Row Badge | Picker Banner |
|---|---|---|
| 3+ | None | None |
| 2 | Amber dot on badge | None |
| 1 | `"1 left"` amber badge | Amber: "Last credit" |
| 0 (shortfall) | `"Shortfall"` red badge | Red: "No credits — shortfall will be recorded" |

---

### 1.2 Typography Scale (Inter font)

| Role | Tailwind | Size | Weight | Usage |
|---|---|---|---|---|
| Display | `text-2xl font-semibold` | 24px | 600 | Page titles (h1) |
| Heading 1 | `text-xl font-semibold` | 20px | 600 | Section headings |
| Heading 2 | `text-base font-semibold` | 16px | 600 | Card headings, dialog titles |
| Heading 3 | `text-sm font-semibold` | 14px | 600 | Subsection labels |
| Body | `text-sm` | 14px | 400 | Primary body text |
| Body Small | `text-xs` | 12px | 400 | Secondary info, timestamps |
| Label | `text-sm font-medium` | 14px | 500 | Form labels, nav items |
| Caption | `text-xs font-medium` | 12px | 500 | Badges, status text |
| Overline | `text-xs font-medium uppercase tracking-wider` | 12px | 500 | Section overlines ("UPCOMING") |

---

### 1.3 Spacing System

Key layout values (4px grid):

| Token | Value | Usage |
|---|---|---|
| `p-3` | 12px | Tight inner padding (nav items, badges) |
| `p-4` | 16px | Default card padding |
| `p-6` | 24px | Page content padding |
| `gap-2` | 8px | Form field gaps, list item internals |
| `gap-3` | 12px | Nav item gaps |
| `gap-4` | 16px | Section spacing within cards |
| `gap-6` | 24px | Card-to-card spacing |

---

### 1.4 Elevation

No heavy shadows. Elevation = border + background contrast.

| Level | CSS |
|---|---|
| Card | `border border-border bg-card` |
| Popover/Dropdown | `border border-border bg-card shadow-sm` |
| Dialog/Modal | `border border-border bg-card shadow-md` |
| Drawer | `border-l border-border bg-card shadow-xl` |

---

### 1.5 Animation

Minimal, purposeful. All transitions respect `prefers-reduced-motion`.

| Interaction | Duration | Notes |
|---|---|---|
| Hover state | 150ms ease-out | bg, border color |
| Dropdown open | 150ms ease-out | scale + fade from 95% |
| Dialog open | 200ms ease-out | fade + scale from 98% |
| Drawer open | 250ms ease-out | slide from right |
| Check-in press | 100ms ease-in-out | scale 96% → back |
| Toast | 300ms ease-out | slide up from bottom-right |

```css
/* In index.css @layer base */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 2. Layout Architecture

### 2.1 Shell (existing `Shell.tsx` — needs rebuild)

```
┌─────────────────────────────────────────────────────────────┐
│  SHELL (100vh flex-row)                                     │
│  ┌─────────────┐  ┌────────────────────────────────────┐   │
│  │  SIDEBAR    │  │  MAIN CONTENT AREA (flex-1)        │   │
│  │  (16rem)    │  │  ┌──────────────────────────────┐  │   │
│  │  flex-col   │  │  │  TOPBAR (52px sticky)        │  │   │
│  │             │  │  │  page title + page actions   │  │   │
│  │  [Logo/EM]  │  │  └──────────────────────────────┘  │   │
│  │  [User]     │  │                                    │   │
│  │  [─────]    │  │  ┌──────────────────────────────┐  │   │
│  │  [Nav items]│  │  │  CONTENT ZONE (p-6)          │  │   │
│  │             │  │  │  flex-col gap-6               │  │   │
│  │  [─────]    │  │  │                              │  │   │
│  │  [Backup]   │  │  └──────────────────────────────┘  │   │
│  │  [Theme]    │  │                                    │   │
│  │  [Sign Out] │  └────────────────────────────────────┘   │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Sidebar Specification

**Logo Block** (64px, border-bottom): monogram square "EM" 28×28px `rounded-md bg-primary text-primary-foreground text-sm font-bold` + "Elite Manager" `text-base font-semibold` + user name+role `text-xs text-muted-foreground`.

**Nav Items** (`py-3 px-2 flex-col gap-0.5`):

Each item: `[icon 18px] [label text-sm font-medium] [badge?]`
Padding: `py-2 px-3 rounded-md w-full`
States: default=`text-foreground-secondary`, hover=`bg-muted text-foreground`, active=`bg-primary text-primary-foreground`

| Route | Label | Icon | Badge | Visible to |
|---|---|---|---|---|
| `/` | Dashboard | home | — | All roles |
| `/attendance` | Attendance | calendar-check | — | All roles |
| `/classes` | Classes | layout-grid | — | admin, staff |
| `/students` | Students | users | — | admin, staff |
| `/teachers` | Teachers | user-circle | — | admin, staff |
| `/reports` | Reports | bar-chart | — | admin; staff (exportReports) |
| `/settings` | Settings | settings | — | admin only |

No `/rooms` or `/templates` nav items — both managed in Settings.

**Sidebar Footer** (border-top, `p-3`):
1. Theme toggle (light/dark/system)
2. Sign out button

### 2.3 Topbar

**Height:** 52px, `sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm`  
**Layout:** `flex items-center justify-between px-6`  
- Left: page title `text-xl font-semibold`  
- Right: contextual action buttons  
Rendered inside each page — not in Shell — so each page controls its actions.

**Mobile (< 768px):** Sidebar collapses to bottom navigation bar (5 icon-only tabs). Content goes full-width. Topbar gets hamburger at 768–1024px for slide-over sidebar. ≥1024px: sidebar always visible.

---

## 3. Pages

### 3.1 /login

Centered full-viewport layout. `max-w-sm` card: `rounded-xl border border-border bg-card shadow-md p-8`.

Contents: wordmark + subtitle → email input → password input → error banner → submit button.

**Input style:** `w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary`  
Error: `border-destructive focus:ring-destructive/40`

**Submit states:** Default "Sign in" → Loading (spinner + "Signing in…") → Error (banner above button, re-enabled)

---

### 3.2 / — Dashboard (primary check-in surface)

```
Topbar: "Dashboard"                              [+ Add Class (admin)]
────────────────────────────────────────────────────────────────────
[Welcome greeting: Good morning, Anna]

[Today's Classes]
┌─ Session row (collapsed) ────────────────────────────────────────┐
│  ● Bachata Beginner  19:00–20:30  Carlos  Room A  3 checked in  │
└──────────────────────────────────────────────────────────────────┘
    ↓ click row
┌─ Session row (expanded) ─────────────────────────────────────────┐
│  ● Bachata Beginner  19:00–20:30  Carlos  Room A  3 checked in  │
│  ──────────────────────────────────────────────────────────────  │
│  [ Enter student name...                                        ]│
│                                                                  │
│  Checked in (3):                                                 │
│    Anna Schmidt      Silver · 7 left   ✓                        │
│    Marco Rossi       10-class · 4 left ✓                        │
│    Lena Braun        USC               ✓                        │
└──────────────────────────────────────────────────────────────────┘

[Analytics row — 3 small charts]
```

#### Session Row (collapsed) — 52px

`flex items-center px-4 py-3 border border-border rounded-[0.75rem] bg-card gap-3 hover:bg-muted/30 cursor-pointer transition-colors`

Status dot (8px, color by status) + Name `font-semibold flex-1` + Time `text-sm text-muted-foreground` + Teacher `text-sm` + Room `text-sm` + "N checked in" badge.

#### Session Row (expanded — inline, no modal)

Row expands in place. Below the header: a search input + checked-in student list.

**Search input:** `placeholder="Enter student name…"` — filters existing students by name prefix as user types.

**Check-in flow on student selection:**

A. **Student has active pass (gold/silver/bronze/ten_class/five_class):**
   - Regular class → notes field shown, then single "Check in" confirm button. Credits auto-deducted by Cloud Function.
   - Special/event + enough credits → same auto flow.
   - Special/event + 1 credit (shortfall) → `CombinationPickerDialog` opens showing only supplement options: `[pass + cash]` `[pass + USC]` `[pass + Eversports]`.

B. **Student has no pass:**
   - "How are they attending?" button group: `[USC]` `[Eversports]` `[Drop-in €13]` `[Trial (free)]`
   - Select one → notes field → confirm.

C. **Student not found:**
   - `[+ Add Student]` appears below the search dropdown.
   - Inline form: name (required), email, phone.
   - After adding → flows to B above.

D. **Party class:**
   - Search only shown. No combination picker. `combination: []` written.

**Notes field:** Single-line text input shown between combination selection and the confirm button. Optional.

**Checked-in list:** Below the search input. Each row: avatar + name + pass type badge + combination tokens + ✓ icon. Ordered by check-in time.

#### Session Card States

| Status | Appearance |
|---|---|
| `active` | Primary 4px left border, full opacity |
| `planned` | Normal border, muted |
| `completed` | Muted border, 80% opacity |
| `cancelled` | Destructive border, cannot expand |

#### Analytics Charts (3 cards, below today's classes)

1. **Check-ins this week** — bar chart per day (Mon–Sun)
2. **Pass type breakdown this month** — donut: gold/silver/bronze/card/usc/eversports/dropin/trial
3. **Daily trend last 30 days** — line chart

---

### 3.3 /attendance — History Calendar (read-only)

```
Topbar: "Attendance"         [< April 2026 >]
────────────────────────────────────────────────
        Mon  Tue  Wed  Thu  Fri  Sat  Sun
Week 1   —    —    —    2    1    3    —
Week 2   —    1    —    2    1    2    —
...
```

Full monthly calendar grid (Mon–Sun). Each day cell shows session count badge (dot or number).

**Day click → day panel (right side or bottom):**
- Lists sessions that day: name, time, teacher
- Shows attendance count per session

**Session click → expands:**
- Teacher name
- Each student who attended: name, pass type badge, combination tokens, notes
- Non-members shown with their source (USC / Eversports / Drop-in / Trial)

**Read-only.** No check-in from this page.

---

### 3.4 /classes — Two Tabs

**Topbar:** "Classes" + tab switcher "Calendar | Sessions"

#### Tab 1: Calendar (monthly)

Monthly calendar grid, sessions as dots/chips color-coded by dance style.
Click a session → detail panel: name, time, teacher, room, status, attendance count.
Admin: Edit + Cancel buttons in the detail panel.

#### Tab 2: Sessions (week view)

7-column grid (Mon–Sun), sessions as time-blocks.

Week navigation: `[< Prev]` `[Today]` `[Next >]`

`[Copy Previous Week]` button (admin only):
- Opens confirmation modal: "Copy 7 sessions from 21–27 Apr to 28 Apr–4 May?"
- Lists session names to be created.
- Confirm → creates session shells (same template/teacher/room/time, new dates, no attendance).

Click a session block → `EditSessionDialog` (admin only).

---

### 3.5 /students — Student Directory

**Topbar:** "Students" + search bar (280px always visible) + `[+ New Student]`

**Filters:** Pass chip group (All / With Pass / No Pass / Gold / Silver / Bronze / 10-Class / 5-Class) + Status (Active/Inactive).

**List table** (sticky column headers):

| Column | Width | Content |
|---|---|---|
| Name | flex-1 | Avatar + name + email |
| Pass | 12rem | Pass type badge + credits remaining |
| Expiry | 7rem | Date, amber if <14 days |
| Last Class | 7rem | Relative date |
| Actions | 4rem | three-dot |

#### Student Detail Drawer (480px)

**Header:** 48px avatar + name `text-xl font-semibold` + pass badge + status badge. Close × icon.

**3 tabs:**

**Profile:** name, email, phone, notes. Inline edit. "Deactivate" destructive button.

**Pass:**
```
┌─ Active Pass Card ─────────────────────────────────────────────┐
│  [Pass badge]  Silver Membership                               │
│  7 / 8 credits  ███████░ (h-2 rounded-full progress bar)      │
│  Expires: 28 May 2026         [Deactivate]                     │
└────────────────────────────────────────────────────────────────┘
[Assign Membership]  [Assign Class Card]

Past passes (collapsible list)
```

Pass type badge designs:
- Gold: `bg-tier-gold/15 text-tier-gold border-tier-gold/30` · "Gold Membership"
- Silver: `bg-tier-silver/15 text-tier-silver` · "Silver · N credits"
- Bronze: `bg-tier-bronze/15 text-tier-bronze` · "Bronze · N credits"
- 10-class: `bg-primary/10 text-primary` · "10-Class Card · N left"
- 5-class: `bg-primary/10 text-primary` · "5-Class Card · N left"
- No pass: `bg-muted text-muted-foreground` · "No pass"

Credit warning overrides: 2 credits → amber dot | 1 credit → full badge turns warning | 0 → destructive badge "Expired".

**History:** List of attendance records. Each row: date | session name | combination tokens | notes. `viewFinancials` gate for `estimatedValue` column. Virtual scroll for large lists.

---

### 3.5 /reports — Statistics & Exports

**Topbar:** "Reports" + `< April 2026 >` month selector + `[Export]` (exportReports permission gate)

**Layout: three sections stacked:**

**Section A — Attendance Overview:**

Stat cards grid `grid grid-cols-2 md:grid-cols-4 gap-4`: Sessions, Total Check-ins, Avg per Session, Attendance Rate.

Card: `rounded-lg border border-border bg-card p-4`. Label `text-xs uppercase tracking-wider text-muted-foreground` + Value `text-2xl font-semibold` + Trend `text-xs`.

Attendance by Style table: simple `<table>` — Style | Sessions | Total | Avg | Rate.

**Section B — Financial Overview (viewFinancials gate):**

If not step-up verified → show OTP gate. If verified → revenue by token type table.

**Section C — Teacher Compensation (viewTeacherPay gate):** Same step-up gate pattern.

#### Step-Up Verification Gate

```
[Lock icon 32px]
"Financial data requires additional verification"
"A 6-digit code has been sent to your email."

[○][○][○][○][○][○]  (6 × 40×48px inputs, auto-focus-next on entry)

[Resend code — 60s countdown]    [Verify]
```

States: Idle → Filled (all 6) → Loading → Error (red borders, "Invalid code") → Success (gate fades out, data fades in).

#### Export Dialog

`max-w-sm`. Format: Excel / CSV / PDF radio. Include sections checkboxes (Financial/Teacher gated by step-up). "Download" button.

---

### 3.6 /settings — Configuration (admin only)

**Layout:** Left subnav (200px) + right content panel.

Sub-nav sections: Pricing | Dance Styles | Class Levels | Membership Types | Class Card Types | External Providers | Templates | Rooms | Users.

#### Pricing

Fields: Drop-in rate (€) | Gold monthly price | Silver monthly price | Bronze monthly price | 10-class card price | 5-class card price | USC per-checkin rate | Eversports per-checkin rate.
Save button. Values pre-filled from `config/pricing`.

#### Dance Styles

List of active styles with toggle switches. `[+ Add Style]` input at bottom.
Feeds into the DanceStyle options for templates and sessions.

#### Class Levels

Same pattern as dance styles. `[+ Add Level]` input.

#### Membership Types (read-only reference)

Cards showing: Gold (unlimited, 30 days), Silver (8 credits, 30 days), Bronze (4 credits, 30 days).

#### Class Card Types (read-only reference)

Cards showing: 10-Class Card (10 credits, 4 months), 5-Class Card (5 credits, 4 months).

#### External Providers

Toggle cards: USC (enabled/disabled), Eversports (enabled/disabled). Controls whether the tokens appear in the check-in picker.

#### Templates

List grouped by day of week. Each row: Time | Style+Level | Name | Teacher | Actions.

`[+ New Template]` button → form dialog: name, style, level, type, day of week, start/end time, teacher, room.

Click a template → `TemplateDetailDrawer` (3 tabs: Details, Roster, Sessions).

#### Rooms

Inline-edit list. `[+ Add Room]` → 2-field form (name, capacity). Deactivate button per row.

#### Users

Table: Name | Email | Role (admin/staff) | Permission toggles (in expanded drawer). Deactivate button.

---

## 4. Component Catalog

### 4.1 Button (CVA)

Base: `inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-[background-color,border-color,opacity,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50`

Variants: `primary` | `secondary` | `outline` | `ghost` | `destructive` | `link`

Sizes: `sm` (h-7 px-2.5 text-xs) | `default` (h-8 px-3) | `lg` (h-9 px-4) | `icon` (h-8 w-8 p-0)

Loading: replace children with `<Spinner className="w-4 h-4 animate-spin" />`.

### 4.2 Pass Badge

`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium`

Variants:
- Gold: `bg-tier-gold/15 text-tier-gold border border-tier-gold/30` · label "Gold"
- Silver: `bg-tier-silver/15 text-tier-silver` · label "Silver · N"
- Bronze: `bg-tier-bronze/15 text-tier-bronze` · label "Bronze · N"
- 10-class: `bg-primary/10 text-primary` · label "10-class · N"
- 5-class: `bg-primary/10 text-primary` · label "5-class · N"
- No pass: `bg-muted text-muted-foreground` · label "No pass"
- USC: blue-tint · "USC"
- Eversports: green-tint · "Eversports"
- Drop-in: muted · "Drop-in"
- Trial: secondary-subtle · "Trial"

Credit warning overrides (silver/bronze/card only):
- 2 credits: amber dot inside badge
- 1 credit: entire badge becomes warning-subtle/warning-foreground, label "1 left"
- 0 credits: destructive-subtle, label "Expired"

### 4.3 Session Status Badge

`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium` + optional 6px leading dot.

Maps: `active`→primary | `planned`→muted | `completed`→muted foreground-secondary | `cancelled`→destructive.

### 4.4 Avatar

Initials-based. 8 OKLCH hues: 0°/30°/60°/120°/180°/240°/285°/320°. Pick: `nameHash % 8`. Bg: `oklch(0.85 0.12 {hue})`, text: `oklch(0.35 0.12 {hue})`.

Sizes: `sm` 24px | `default` 32px | `lg` 48px.

### 4.5 Card

Base: `rounded-lg border border-border bg-card`.

Variants: `default` | `inset` (`rounded-md bg-muted/50 p-3`) | `highlighted` (`border-l-4 border-l-primary`).

Sub-components: `<CardHeader>`, `<CardContent>`, `<CardFooter>` — each `px-4 py-3`.

### 4.6 Dialog (Radix UI)

Overlay: `fixed inset-0 bg-foreground/20 backdrop-blur-[2px] z-40 animate-in fade-in`

Content: `fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full rounded-xl border border-border bg-card shadow-md focus:outline-none animate-in fade-in zoom-in-95`

Sizes: `sm` (max-w-sm) | `md` (max-w-md, default) | `lg` (max-w-lg).

Header: `flex items-center justify-between px-6 py-4 border-b border-border` — title `text-base font-semibold` + × icon button.
Body: `px-6 py-4`. Footer: `flex items-center justify-end gap-2 px-6 py-4 border-t border-border`.

### 4.7 Drawer (Right slide-over)

`fixed right-0 top-0 h-full w-full max-w-[480px] border-l border-border bg-card shadow-xl z-50 flex flex-col animate-in slide-in-from-right`

Header: `flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0`
Body: `flex-1 overflow-y-auto px-6 py-4`
Footer: `px-6 py-4 border-t border-border flex-shrink-0`

Mobile: full-width bottom sheet, max-h-[85vh].

### 4.8 Filter Chip

`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors`

Default: `border-border bg-card text-muted-foreground hover:border-primary/40`
Active: `border-primary bg-primary-subtle text-primary`

### 4.9 Toast

Bottom-right, stacked. Each: `flex items-start gap-3 rounded-lg border border-border bg-card shadow-md px-4 py-3 max-w-[360px] animate-in slide-in-from-bottom`

Types: success | error | warning | info (each with icon + optional description). Auto-dismiss 4s (success/info) or 6s (error/warning). Manual × always present.

### 4.10 Empty State

`flex flex-col items-center justify-center py-16 gap-4 text-center`
48px icon `text-muted-foreground/40` + heading `text-base font-medium` + description `text-sm text-muted-foreground max-w-[240px]` + optional CTA button.

---

## 5. Key Interaction Flows

### 5.1 Check-in — Pass Holder, Regular Class

1. Staff types student name in the expanded row search field.
2. Student appears in dropdown — staff clicks to select.
3. Student has silver pass + regular class → notes field appears + "Check in" button.
4. Staff optionally enters a note, then clicks "Check in".
5. Button shows spinner, student appears in checked-in list with silver badge.
6. Toast: "Ana Schmidt checked in ✓" (4s).
7. Cloud Function fires async, deducts 1 credit. Badge updates via Firestore listener.

### 5.2 Check-in — Special Class Shortfall

1. Staff selects a silver student with 1 credit remaining attending a special class.
2. System detects shortfall (needs 2, has 1) → `CombinationPickerDialog` opens.
3. Dialog shows only valid supplement combinations: `[Silver + Cash]`, `[Silver + USC]`, `[Silver + Eversports]`.
4. Staff selects combination. Notes field shown. Confirm.
5. Record written with `shortfall: true`. Cloud Function deducts the 1 remaining credit, marks pass inactive.

### 5.3 Check-in — No Pass Student

1. Student found in search with `passType: null`.
2. "How are they attending?" button group appears: `[USC]` `[Eversports]` `[Drop-in €13]` `[Trial (free)]`.
3. Staff taps the relevant option → notes field → confirm.
4. Record written with the selected token (e.g. `['dropin']`). No credits deducted.

### 5.4 Drop-in — New Student

1. Staff types name not found in search.
2. `[+ Add Student]` option appears at bottom of dropdown.
3. Inline form: name (required), email, phone. Save.
4. New student created with `passType: null`. Flows to step 2 of 5.3 above.
5. Student is now in the database and searchable on return visits.

### 5.5 Credit Warning

- 2 credits: amber dot on badge, no banner.
- 1 credit remaining: amber "1 left" badge. After check-in: toast with "Ana is on their last credit — consider renewing their pass."
- 0 credits when trying to check in for a regular class: `CombinationPickerDialog` opens with red "No credits" banner. Staff can still confirm — `shortfall: true` written.

### 5.6 Step-Up Verification

1. User opens `/reports` with `viewFinancials: true`.
2. Cloud Function `sendStepUpCode` called on Section B mount.
3. User enters 6-digit OTP. All 6 entered → Verify activates.
4. On success: signed token in React context. Gate fades, data fades in.
5. Session unlock lasts until tab close or 30min idle.
6. Resend: disabled 60s with countdown.

---

## 6. Accessibility

- All dialogs/drawers: Radix focus traps, focus returns to trigger on close.
- After check-in: focus moves to next unchecked student after 300ms.
- `aria-live="polite"` for check-in confirmations; `aria-live="assertive"` for shortfall warnings.
- Loading states: `aria-busy="true"` on buttons.
- All status conveyed with text + color (never color alone).
- Every input has `<label htmlFor>`, errors have `role="alert"` + `aria-describedby`.
- Role-gated sections use conditional rendering (not `visibility: hidden`) so screen readers never encounter inaccessible content.
- `prefers-reduced-motion`: collapses all transitions to 0.01ms.

---

## 7. Performance

### TanStack Query Cache Strategy

| Query | staleTime | gcTime | Notes |
|---|---|---|---|
| Today's sessions | 60s | 5min | Re-fetch on window focus |
| Student list | 30s | 10min | Invalidate on mutation |
| Membership data | 30s | 10min | Invalidate on attendance write |
| Attendance records | 30s | 5min | + Firestore `onSnapshot` for active sessions |
| Pricing config | 5min | 30min | Rarely changes |
| Reports | 5min | 30min | No window-focus refresh |

- Active session roster: `onSnapshot` for multi-device sync.
- All other queries: `getDocs` + TanStack.

### Code Splitting

Each page: `React.lazy` + `Suspense`. Login is eager (tiny).

### Optimistic Updates

Check-in mutations update local state immediately, roll back on error.

### List Virtualization

`@tanstack/react-virtual` for student list + attendance history when > ~100 rows. Roster rows (max 30) don't need it.

### Offline Resilience

Firestore `enableIndexedDbPersistence`. Show amber banner "You're offline. Changes will sync when reconnected." on `navigator.onLine` + Firestore network events.

### Bundle

Initial JS < 200KB gzipped. Firebase imported modularly. Inter font with `display: swap`, Latin subset.

---

## 8. Route & Permission Summary

| Route | Visible to | Notes |
|---|---|---|
| `/login` | Unauthenticated only | Redirects to `/` if logged in |
| `/` | All roles | Dashboard + check-in |
| `/attendance` | All roles | Read-only history calendar |
| `/classes` | admin, staff | Full CRUD requires `manageClasses` |
| `/students` | admin, staff | Requires `manageStudents` for write |
| `/teachers` | admin, staff | Requires `manageTeachers` for write |
| `/reports` | admin; staff (exportReports) | Financial sections require step-up |
| `/settings` | admin only | Entire route hidden for staff |

---

## 9. Critical Files

| File | Changes Needed |
|---|---|
| `apps/web/src/index.css` | Add all dark-mode OKLCH tokens, semantic status colors, tier colors, radius scale, motion tokens |
| `apps/web/src/components/layout/Shell.tsx` | Full rebuild: role-aware nav with icons, backup indicator, theme toggle, mobile collapse |
| `apps/web/src/App.tsx` | Add `/classes`, `/students`, `/reports`, `/settings` routes with `React.lazy` + role guards |
| `apps/web/src/pages/AttendancePage.tsx` | Primary implementation target — all check-in UI |
| `apps/web/src/types/index.ts` | Reference only — `AttendanceCombination`, `CombinationToken`, `PassType`, `SessionStatus` drive all badge/button logic |

---

## 10. Verification

1. Run `npm run dev` and open the app.
2. Login flow → redirects to `/` (Dashboard).
3. Dashboard shows today's sessions. Click a session row → inline expansion.
4. Search a student with silver pass + regular class → notes field + check-in. No dialog.
5. Search a silver student with 1 credit + special class → `CombinationPickerDialog` with supplement options only.
6. Search a no-pass student → "How are they attending?" picker shown.
7. Type unknown name → `[+ Add Student]` inline form appears.
8. `/attendance` → monthly calendar. Click a day → session list. Click a session → attendee list. No check-in UI.
9. `/students` → search, open drawer, Pass tab shows progress bar for silver/bronze/card.
10. `/reports` → step-up gate → enter OTP → financial data reveals.
11. `/settings` → Pricing save works. Dance style added to list. Template CRUD.
12. Dark mode toggle persists across reloads.
13. Firebase emulator running: all Firestore reads/writes go through local emulator.

---

## 11. Design Direction v2 — BankDash-Inspired Light UI

**Applied:** 2026-04-18

### Core Shift

Moved from a dark/premium sidebar to a **light sidebar** (BankDash-style). The primary visual weight is now in the content area — cards and stat numbers — rather than the chrome.

### Sidebar

- **Background:** white (`oklch(1 0 0)`)
- **Border:** 1px right border (`oklch(0.90 0 0)`)
- **Active nav state:** left `3px solid primary` border + subtle primary tint background — no filled pill
- **Nav item classes:** `.sidebar-nav-item` (transparent left border) / `.sidebar-nav-item-active` (primary left border)
- Items go **edge-to-edge** (no container left padding) so the border appears at the physical left edge

### Topbar

- **Ownership:** Shell.tsx renders the single topbar — pages do NOT render their own topbars
- **Height:** 64px, border-bottom, `bg-card`
- **Left:** page title resolved from `usePageTitle()` hook via `useLocation()` + static `PAGE_TITLES` map
- **Right:** pill search input (220px, `border-radius: 9999px`) + bell icon button + user avatar circle

### Stat Cards (Dashboard)

Follow the health dashboard reference pattern:
- White card (`bg-card`), `border-radius: 1rem`, `border: 1px solid border`
- Top row: colored icon circle (40px, `border-radius: 10px`) + status badge pill (right-aligned)
- Middle: uppercase overline label (`0.6875rem`, `tracking-wider`) + large value (`1.875rem font-weight 800`) + trend line
- Bottom: full-bleed SVG sparkline (negative margin `0 -1.25rem`) with `linearGradient` fill

### Mock Data Principle

Keep placeholder data minimal — the goal is to demonstrate the UI, not simulate real data volume:
- Attendance page: **2 sessions max**, **3 students max per session**
- Dashboard schedule: **3 rows max**
- No more than needed to show the full range of states (active/planned/completed, gold/silver/bronze tiers)

### Primary Color

Shifted to `oklch(0.55 0.22 265)` (blue-indigo) to match the BankDash palette, closer to indigo than the earlier pure-blue.

### Login Page

- Centered card (`max-width: 22rem`), `border-radius: 1.25rem`, subtle box-shadow
- Logo: "EM" monogram square + "Elite Manager" bold wordmark
- Heading: "Welcome back" / subtitle: "Sign in to your workspace"
- Field component with `onFocus`/`onBlur` inline handlers for focus ring (primary border + primary-subtle shadow)
- Submit button: full-width, 42px, primary bg, loading state "Signing in…"
