# Elite Manager — UI Design Document

**Version:** 1.0 | **Date:** 2026-04-18 | **Stack:** React 19 + TypeScript + Vite 6 + Firebase + Tailwind CSS v4

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
| Present / Active | success-subtle | success | success-subtle | success |
| Late | warning-subtle | warning (darker) | warning-subtle | warning |
| Absent | muted | muted-foreground | muted | muted-foreground |
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
| `/attendance` | Attendance | calendar-check | Today's date dot | All roles |
| `/classes` | Classes | layout-grid | — | admin, staff; teacher (own) |
| `/students` | Students | users | — | admin, staff (manageStudents) |
| `/reports` | Reports | bar-chart | — | admin; staff (exportReports) |
| `/settings` | Settings | settings | — | admin only |

**Sidebar Footer** (border-top, `p-3`):
1. Backup status: `text-xs rounded-md p-2 flex items-center gap-2`
   - Green dot "Last backup: today" | Amber "Last backup: 2d ago" | Red "Backup failed"
   - Click → `/settings#backup`
   - Hidden from teacher role
2. Theme toggle (light/dark/system)
3. Sign out button

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

### 3.2 /attendance — Today's Check-In Hub (highest priority)

```
Topbar: "Attendance"                    [+ Add Drop-in] [Create Session]
─────────────────────────────────────────────────────────────────────
[Date header: Saturday, 18 April 2026 · 3 classes today]

┌─ Session Card (active — border-l-4 border-primary) ─────────────┐
│  ● Bachata Beginner  [Workshop badge?]  19:00–20:30             │
│  Maria Teacher  ·  Room A  ·  8 / 12                           │
│  ─────────────────────────────────────────────────────         │
│  [Search/filter bar]                                           │
│  [Student roster rows]                                         │
│  [Roster footer: counts + "+ Add Drop-in"]                     │
└──────────────────────────────────────────────────────────────────┘
┌─ Session Card (planned — collapsed) ────────────────────────────┐
┌─ Session Card (completed — collapsed, 80% opacity) ─────────────┐
```

#### Session Card States

| Status | Appearance | Expanded by Default |
|---|---|---|
| `active` | Primary 4px left border bar | Yes |
| `planned` | Normal border, muted header | No |
| `completed` | Muted border, 80% opacity | No |
| `cancelled` | Destructive left border, strikethrough | No, cannot expand |

#### Student Roster Row (48px min-height)

`flex items-center px-4 py-2.5 gap-3 hover:bg-muted/50`

```
[Avatar 32px] [Name + Membership Badge]   [Credit Info]   [Check-in Buttons]
```

**Avatar:** 32px circle. Initials, bg color from name hash (8 OKLCH hues at 0.85 chroma 0.12, text at 0.35 same hue).

**Credit display:**
- Gold: nothing shown
- Silver/Bronze: "8 credits left" — green ≥3, amber =2, red ≤1
- Expiry <14 days: amber "Exp. 2 May"
- No pass: "No pass" muted

**Check-in button group** (`flex gap-1.5`): 4 × 32px `rounded-md border text-xs font-bold`

| Button | Icon | Unselected | Selected |
|---|---|---|---|
| Present ✓ | check | muted border | `bg-success text-success-foreground` |
| Late L | clock | muted border | `bg-warning text-warning-foreground` |
| Absent — | x | muted border | `bg-muted text-muted-foreground` |
| Trial T | star | muted border | `bg-secondary text-secondary-foreground` |

When one is selected, the other three dim to `opacity-40`.

**Row ordering:** Checked-in first → regular roster → drop-ins

**Search/filter bar** (above roster, inside card): `flex-1` search input + filter chips "All | Unchecked | Present | Late | Absent"

**Roster footer:** Left: count summary. Right: "+ Add Drop-in" link text.

#### Combination Picker Dialog

Triggered when: no auto-selectable combo (special class + pass, or no pass).

Auto-select (no dialog): Gold/Silver/Bronze + regular class → immediate write.

Dialog: `max-w-sm`, student avatar + name in header. Token card grid `grid grid-cols-3 gap-2 p-4`.

**Token card** (32px icon circle + label + credit cost):
- Default: `border-border hover:border-primary/40 hover:bg-primary-subtle`
- Selected: `border-primary bg-primary-subtle`
- Disabled: `opacity-40 cursor-not-allowed`

Colors: Gold=`bg-tier-gold/20 text-tier-gold`, Silver=`bg-tier-silver/20 text-tier-silver`, Bronze=`bg-tier-bronze/20 text-tier-bronze`, USC=blue-tint, Eversports=green-tint, Cash=muted, Trial=secondary.

Cash amount field appears when `cash` token selected. Credit warning banner above footer actions.

Footer: "Cancel" ghost + "Confirm Check-in" primary (disabled if no valid combo).

---

### 3.3 /classes — Sessions & Templates

**Topbar:** "Classes" + tab switcher "Sessions | Templates" + `[+ New Session]` or `[+ New Template]`

**Tab bar:** `border-b border-border flex gap-0 px-6`. Active: `border-b-2 border-primary text-primary`.

#### Sessions Tab

Filters row: Date chips (Today/This week/This month/Custom) + Status dropdown + Style dropdown + Search input.

**List rows** (flat, Linear-style): `flex items-center px-6 py-3 border-b border-border hover:bg-muted/50 gap-4`

Columns: Status dot | Date+Time (8rem) | Session name (flex-1, `font-medium`) | Teacher (8rem) | Room (6rem) | Attendance (6rem) | Actions (edit + three-dot)

**Inline row expansion** (on click): `border-b-4 border-primary/30 bg-muted/30` indicator below. Shows session details, "Open Check-in" button, Edit + Cancel.

#### Templates Tab

Grouped by day of week. Section header: `text-xs font-medium uppercase tracking-wider text-muted-foreground py-2 px-6 bg-muted`.

Template rows: Time | Style+Level badge | Name (flex-1) | Teacher | Regulars count | Subscription pill | Actions.

**Template detail — Right drawer (480px):** 3 tabs:
- **Details**: form with inline edit (Edit → Save/Cancel pattern)
- **Roster**: `regularStudentIds` management with add/remove
- **Sessions**: upcoming sessions list from this template

**Create Template — Dialog (max-w-lg):** 3-step flow with "Step 1 of 3" progress indicator. Steps: Basic info → Assignment → Initial roster.

---

### 3.4 /students — Student Directory

**Topbar:** "Students" + search bar (280px always visible) + `[+ New Student]`

**Filters:** Membership chip group (All/Gold/Silver/Bronze/No Pass) + Status (Active/Inactive) + Sort dropdown.

**List table** (sticky column headers):

| Column | Width | Content |
|---|---|---|
| Name | flex-1 | Avatar + full name + email |
| Membership | 10rem | Tier badge + credits badge |
| Expiry | 7rem | Date, amber if <14 days |
| Last Class | 7rem | Relative date |
| Actions | 4rem | Edit + three-dot |

#### Student Detail Drawer (480px)

**Header:** 48px avatar + name `text-xl font-semibold` + membership badge + status badge. Close × + pencil edit icons.

**3 tabs:**

**Profile:** Contact info, notes. Inline edit. "Deactivate" destructive button.

**Membership:**
```
┌─ Membership Card ─────────────────────────────────────────┐
│  [Tier badge]  Silver Pass                                │
│  8 / 10 credits  ████████░░ (h-2 rounded-full progress)  │
│  Expires: 2 May 2026         [Edit]  [Deactivate]         │
└───────────────────────────────────────────────────────────┘
```
Below: membership history collapsible + "Assign New Membership" button.

**Attendance History:** Date range filter. List: date | session | status badge | combo tokens | credits used. `viewFinancials` gate for `estimatedValue` column. Virtual scroll for large lists.

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

Sub-nav sections: General | Pricing | Backup | Teachers | Rooms | Users | External Providers.

#### Backup

Status card:
```
Last backup: Today, 02:01 · Success · 2.4 MB · 14s
                              [Trigger Manual Backup]
```

Config form: NAS path | Retention count | Schedule toggle (Radix Switch: `w-10 h-6 rounded-full bg-border data-[state=checked]:bg-primary`).

Backup log table: Date | Triggered by | Status badge | Size | Duration. Last 10, "View all" link.

#### Teachers

Table with edit drawer (Profile tab + Settings tab with rate/floor inputs). Deactivate with confirm.

#### Rooms

Inline-edit list. "+ Add Room" opens 2-field dialog (name, capacity).

#### Users

Table: Name | Email | Role dropdown | Permission toggles (in expanded drawer). Invite + Deactivate.

---

## 4. Component Catalog

### 4.1 Button (CVA)

Base: `inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-[background-color,border-color,opacity,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50`

Variants: `primary` | `secondary` | `outline` | `ghost` | `destructive` | `link`

Sizes: `sm` (h-7 px-2.5 text-xs) | `default` (h-8 px-3) | `lg` (h-9 px-4) | `icon` (h-8 w-8 p-0)

Loading: replace children with `<Spinner className="w-4 h-4 animate-spin" />`.

### 4.2 Membership Badge

`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium`

Variants: Gold (amber/10 tint, tier-gold text+dot) | Silver (gray/10, tier-silver) | Bronze (orange/10, tier-bronze) | Trial (secondary-subtle) | Drop-in (muted) | USC (blue-tint) | Eversports (green-tint).

With credits: `"Silver · 8"` using `·` separator.

Warning override: 2 credits → amber dot on badge | 1 credit → entire badge warning-subtle/warning-foreground | 0 → destructive-subtle, label "Expired".

### 4.3 Status Badge

`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium` + optional 6px leading dot.

Maps: `present`→success | `late`→warning | `absent`→muted | `trial`→secondary | `active`→primary | `planned`→muted | `completed`→muted | `cancelled`→destructive.

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

### 5.1 Check-in — Auto-Selectable

1. Staff clicks ✓ Present for a student with Silver pass + regular class.
2. System auto-selects `['silver']` — no dialog.
3. Button shows 200ms spinner, row goes `opacity-60 pointer-events-none`.
4. On success: button → selected (success) state, row gets green tint, credit count decrements optimistically.
5. Toast: "Ana Schmidt — Present ✓" (4s).
6. Cloud Function fires async, deducts credit. Firestore listener syncs UI.

### 5.2 Check-in — Combination Picker Required

1. Staff clicks ✓ for Silver student in a Workshop (special class).
2. Combination picker dialog opens (200ms fade).
3. Auto-disables Gold (student has Silver), enables Silver/2×Silver/Silver+Cash/etc.
4. Staff selects combo. Credit warning shows if low.
5. Confirm → same loading/success flow.

### 5.3 Drop-in Add Flow

1. Staff clicks "+ Add Drop-in" in roster footer.
2. Popover/sheet: search input with live results from students collection.
3. Select existing student OR "Create new student?" if not found.
4. Combination picker opens (no active pass → all pass tokens disabled, only Cash/USC/Eversports/Trial enabled).
5. Staff selects payment, confirms. Drop-in record written. Student appears in roster with "Drop-in · Cash" badge.

### 5.4 Credit Warning

- 1 credit: amber row, non-blocking warning banner on session card after check-in toast.
- 0 credits + staff checks in anyway: Picker opens with destructive "Shortfall" banner. On confirm: `shortfall: true` written to attendance record.

### 5.5 Step-Up Verification

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
| `/login` | Unauthenticated only | Redirects to `/attendance` if logged in |
| `/attendance` | All roles | Teachers see only their sessions |
| `/classes` | admin, staff; teacher (own) | Full CRUD requires `manageClasses` |
| `/students` | admin, staff (manageStudents) | |
| `/reports` | admin; staff (exportReports) | Financial sections require step-up |
| `/settings` | admin only | Entire route hidden for staff/teacher |

---

## 9. Critical Files

| File | Changes Needed |
|---|---|
| `apps/web/src/index.css` | Add all dark-mode OKLCH tokens, semantic status colors, tier colors, radius scale, motion tokens |
| `apps/web/src/components/layout/Shell.tsx` | Full rebuild: role-aware nav with icons, backup indicator, theme toggle, mobile collapse |
| `apps/web/src/App.tsx` | Add `/classes`, `/students`, `/reports`, `/settings` routes with `React.lazy` + role guards |
| `apps/web/src/pages/AttendancePage.tsx` | Primary implementation target — all check-in UI |
| `apps/web/src/types/index.ts` | Reference only — `AttendanceCombination`, `CombinationToken`, `AttendanceStatus`, `SessionStatus` drive all badge/button logic |

---

## 10. Verification

1. Run `pnpm dev` and open the app.
2. Login flow → redirects to `/attendance`.
3. `/attendance` shows today's sessions; expand active session; check in a student.
4. Check-in auto-selects for regular class; picker opens for special class.
5. Low-credit student (1 credit) shows amber badge; 0-credit shows red "Shortfall" path.
6. `/students` directory: search by name, open drawer, membership tab shows progress bar.
7. `/reports` → step-up gate shows → enter OTP → financial data reveals.
8. Dark mode toggle persists across reloads.
9. Resize to <768px → bottom nav appears, sidebar hidden.
10. Firebase emulator suite running: all Firestore reads/writes go through local emulator.

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
