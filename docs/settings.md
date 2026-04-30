# Settings Feature Guide

Version: 1.0  
Last updated: 2026-04-30  
Status: Planning / Implementation Guide

## Purpose

This document is the implementation reference for the Settings feature. It defines scope, constraints, phased execution, and testing strategy for a production-ready `SettingsPage` in Elite Manager.

This guide improves the initial idea by aligning it with existing project rules:

- Soft delete is the default data lifecycle (`active: false`), not hard delete.
- Current pass types are fixed in TypeScript unions (`MembershipTier`, `ClassCardType`); dynamic custom types are a future extension, not a v1 requirement.
- Class templates are recurring weekly entities (`dayOfWeek`, `startTime`, etc.), not a one-document "whole-week" blob.
- Settings route is admin-only at route/UI level and enforced by Firestore rules.

---

## 1. Full Feature Scope

### 1.1 Access and Navigation

1. Protect the entire settings route for admin only.
2. Render left sub-navigation with sections:
   - Pricing
   - Dance Styles
   - Class Levels
   - Membership Types
   - Class Card Types
   - External Providers
   - Templates
   - Rooms
   - Users
3. Support deep-linking to section state (query param or nested route).

### 1.2 Pricing Section

1. Editable fields:
   - Drop-in rate
   - Gold monthly price
   - Silver monthly price
   - Bronze monthly price
   - 10-class card price
   - 5-class card price
   - USC per-checkin rate
   - Eversports per-checkin rate
2. Read/write source: `config/pricing`.
3. Save metadata: `updatedBy`, `updatedAt`.
4. Numeric validation via text inputs with `inputMode='numeric'`.
5. Dirty-state detection with save/cancel/reset UX.
6. Explicit loading, empty, and error states.

### 1.3 Dance Styles Section

1. Load styles from `config/danceStyles`.
2. Add style.
3. Rename style.
4. Activate/deactivate style (no hard delete).
5. Prevent duplicates and empty values.
6. Persist `updatedBy`, `updatedAt`.

### 1.4 Class Levels Section

1. Same behavior as Dance Styles.
2. Read/write source: `config/classLevels`.

### 1.5 Membership Types Section

V1 scope:

1. Display policy cards (reference):
   - Gold: unlimited, 30 days
   - Silver: 8 credits, 30 days
   - Bronze: 4 credits, 30 days
2. Show current prices from `config/pricing` where relevant.

Note: Adding arbitrary new membership types requires changes to core unions, deduction logic, reports, and UI token handling. Treat as a future extension phase.

### 1.6 Class Card Types Section

V1 scope:

1. Display policy cards (reference):
   - 10-class: 10 credits, 4 months
   - 5-class: 5 credits, 4 months
2. Show current prices from `config/pricing` where relevant.

Note: Adding arbitrary new card types is a schema/domain extension and should be planned separately.

### 1.7 External Providers Section

1. Toggle provider availability for USC and Eversports.
2. Read/write source: `config/externalProviders`.
3. Use a future-safe providers array shape.
4. Provider state must gate check-in token availability.
5. Optional future support for adding new providers.

### 1.8 Templates Section

1. Reuse existing template CRUD behavior.
2. Group templates by weekday.
3. New template action.
4. Edit/deactivate template.
5. Optional detail drawer tabs:
   - Details
   - Roster
   - Sessions

Clarification: Templates are weekly recurring entities (one per schedule slot), not one template record representing the entire week.

### 1.9 Rooms Section

1. Inline list with add/edit/deactivate.
2. Capacity optional.
3. Reuse existing rooms patterns under Settings.
4. Use soft delete (`active: false`) not hard delete.

### 1.10 Users Section

1. Table with name, email, role, active state.
2. Expandable drawer/panel for permission toggles.
3. Role rules:
   - Admin always has full permissions.
   - Staff permissions are toggleable per policy.
4. Activate/deactivate user.
5. Guardrails: prevent lockout (at least one active admin).

### 1.11 Cross-Cutting UX

1. Full i18n coverage (en/de) for all copy.
2. Consistent loading, empty, optimistic, and error states.
3. Unsaved changes warning when switching sections.
4. Query invalidation strategy per section.
5. Accessibility:
   - Keyboard support
   - Focus order
   - ARIA labels/roles

---

## 2. Architecture Decisions

1. Data ownership by section:
   - Pricing -> `config/pricing`
   - Dance Styles -> `config/danceStyles`
   - Class Levels -> `config/classLevels`
   - External Providers -> `config/externalProviders`
   - Rooms -> `rooms` collection
   - Templates -> `classTemplates` collection
   - Users -> `users` collection

2. Domain rules:
   - Use soft delete everywhere.
   - No direct server-state fetch in components; use TanStack Query hooks.
   - No hardcoded user-facing strings.

3. Permission model:
   - Route-level gate for admin.
   - Firestore rules enforce the same constraints server-side.

---

## 3. Phase-by-Phase Delivery Plan

## Phase 0: Foundation and Architecture

Goal: Build the settings shell and section framework.

Deliverables:

1. `SettingsPage` two-column layout.
2. Admin-only route guard.
3. URL-synced section state.
4. Reusable settings primitives:
   - Section header
   - Form row
   - Save bar
   - Error banner
5. Complete `settings` locale keys in en/de.

Generation Prompt:

"Implement a production-ready SettingsPage architecture in this React + TypeScript + TanStack Query app. Keep Settings admin-only. Build a left sub-navigation and right content panel with sections: Pricing, Dance Styles, Class Levels, Membership Types, Class Card Types, External Providers, Templates, Rooms, Users. Add URL-synced section state. Add reusable section layout components and save bar patterns. Fill settings locale files in en and de with complete keys for all sections, buttons, states, and validation messages. Preserve existing app styling conventions and permission model."

Acceptance Checks:

1. Admin can access settings.
2. Staff cannot access route.
3. Section switching works with deep links.
4. All visible text uses translations.

---

## Phase 1: Pricing

Goal: Production-grade pricing CRUD.

Deliverables:

1. Form backed by pricing query/mutation.
2. Non-negative numeric validation.
3. Save metadata (`updatedBy`, `updatedAt`).
4. Cancel/reset support.
5. Success and failure states.

Generation Prompt:

"Build the Pricing settings section using existing pricing config patterns. Fields: dropInRate, goldMonthlyPrice, silverMonthlyPrice, bronzeMonthlyPrice, tenClassCardPrice, fiveClassCardPrice, uscRatePerCheckin, eversportsRatePerCheckin. Use text inputs with numeric inputMode. Add zod validation and react-hook-form integration. Implement load, edit, save, cancel, error handling, and query invalidation. Ensure no hardcoded strings and full i18n usage."

Acceptance Checks:

1. Values load from Firestore.
2. Invalid input blocks save with clear errors.
3. Save persists and refreshes dependent consumers.

---

## Phase 2: Dance Styles and Class Levels

Goal: Reusable editable taxonomy management.

Deliverables:

1. Shared editable-list component.
2. Add/rename/deactivate/restore behaviors.
3. Duplicate prevention.
4. Fallback defaults when config docs are missing.

Generation Prompt:

"Implement Dance Styles and Class Levels settings sections using one reusable editable-list component. Support add, rename, deactivate, and restore patterns without hard deleting values. Enforce trimming and case-insensitive duplicate checks. Persist changes to config danceStyles and config classLevels with updatedAt and updatedBy. Keep optimistic UI safe and reversible on mutation errors."

Acceptance Checks:

1. Changes persist correctly.
2. Duplicate values are blocked.
3. Existing templates/sessions remain stable when items are deactivated.

---

## Phase 3: Membership and Class Card Types (Reference v1)

Goal: Clear policy visibility without schema expansion.

Deliverables:

1. Membership type reference cards.
2. Class card type reference cards.
3. Price linking to pricing config.

Generation Prompt:

"Create read-only Settings sections for Membership Types and Class Card Types. Show business rules exactly: Gold unlimited 30 days, Silver 8 credits 30 days, Bronze 4 credits 30 days, 10-class card 10 credits 4 months, 5-class card 5 credits 4 months. Use consistent card UI and i18n labels, and display configured prices from pricing settings where applicable."

Acceptance Checks:

1. Sections are visible and translated.
2. Policy values match domain rules.

Optional Extension Prompt (future):

"Design and implement dynamic membership/card type extensibility, including schema migration, updated type system, cloud function deduction updates, reports compatibility, and backward-compatible UI changes."

---

## Phase 4: External Providers

Goal: Control provider availability from settings.

Deliverables:

1. Typed config model for providers.
2. Toggle UI for USC/Eversports.
3. Hook read/write integration.
4. Attendance picker gating integration.

Generation Prompt:

"Implement External Providers settings with Firestore-backed toggles for USC and Eversports using config externalProviders. Add typed hooks and defaults when doc is missing. Persist provider states and update attendance combination option gating so disabled providers are not selectable in check-in flows. Keep full i18n and admin-only writes."

Acceptance Checks:

1. Provider toggles persist.
2. Attendance UI reflects enabled/disabled providers.

---

## Phase 5: Templates Inside Settings

Goal: Consolidate template management under settings.

Deliverables:

1. List grouped by weekday.
2. Add/edit/deactivate actions.
3. Optional detail drawer tabs.
4. Reuse existing forms/hooks.

Generation Prompt:

"Build Settings Templates section using existing class template domain logic. Show grouped template list by day of week with columns for time, style-level, name, teacher, and actions. Implement create/edit/deactivate with current business constraints. Keep route and state local to settings section. Avoid duplicate business logic by reusing existing hooks and shared form components."

Acceptance Checks:

1. Template CRUD works from settings.
2. Behavior matches existing template rules.

---

## Phase 6: Rooms in Settings

Goal: Embed rooms management and enforce soft-delete policy.

Deliverables:

1. Rooms subsection UI migrated/reused.
2. Inline add/edit/deactivate flow.
3. Capacity validation and i18n parity.

Generation Prompt:

"Implement Settings Rooms section by reusing existing rooms UI patterns. Keep inline add/edit/deactivate flows and i18n parity. Replace any hard-delete behavior with active false deactivation. Ensure permissions are enforced according to admin and manageRooms policy."

Acceptance Checks:

1. Add/edit/deactivate works.
2. No hard delete path remains.

---

## Phase 7: Users and Permissions

Goal: Manage staff/admin permissions safely.

Deliverables:

1. Users table and permission editor.
2. Staff permission toggles.
3. Activate/deactivate flow.
4. Last-active-admin guardrails.

Generation Prompt:

"Build Settings Users section with a table of user accounts and permission management UI. Support toggling permissions for staff users. Keep admin users fully privileged and non-restrictable by default policy. Add activate/deactivate user flow with confirmation. Enforce guardrails to prevent removing the last active admin. Persist changes to users documents and refresh auth-aware UI consumers."

Acceptance Checks:

1. Permission toggles persist.
2. Admin guardrails hold.
3. Route/write security remains correct.

---

## Phase 8: Hardening, QA, and Docs

Goal: Production readiness.

Deliverables:

1. Unsaved-changes navigation guard.
2. Accessibility pass.
3. Error boundaries for settings sections.
4. Documentation updates.

Generation Prompt:

"Perform hardening on settings implementation: add unsaved changes prompts, keyboard navigation completeness, ARIA labeling, empty/loading/error state consistency, and final type cleanup without any usage. Update project docs with settings architecture, config document contracts, and permission constraints. Keep code style aligned with existing repository conventions."

Acceptance Checks:

1. No TypeScript or lint errors.
2. Keyboard/screen-reader sanity checks pass.
3. Docs reflect final behavior.

---

## 4. Complete Test Plan

### 4.1 Unit Tests

1. Pricing validation schema:
   - Reject negatives
   - Reject non-numeric values
   - Accept valid numeric values
2. Editable list utilities (styles/levels):
   - Trim/normalize
   - Duplicate detection
   - Add/rename/deactivate/restore transitions
3. External provider gating logic:
   - USC disabled -> USC unavailable in picker
   - Eversports disabled -> Eversports unavailable in picker
4. Permission matrix logic:
   - Admin always full permissions
   - Staff toggle boundaries
   - Last active admin protection

### 4.2 Hook Tests (mocked Firestore)

1. Pricing hooks:
   - Existing doc read
   - Missing doc fallback
   - Metadata persistence on save
2. Dance styles/class levels update hooks:
   - Correct writes
   - Query invalidation
3. External providers hooks:
   - Missing doc defaults
   - Toggle persistence
4. Rooms hooks:
   - Deactivate path is used instead of hard delete

### 4.3 Component Tests

1. Settings shell:
   - Section nav renders
   - Panel switching/deep-link sync
2. Pricing form:
   - Initial load
   - Dirty state
   - Save success/failure
3. Styles/levels sections:
   - Add flow
   - Duplicate validation
   - Deactivate/restore
4. External providers:
   - Toggle interaction
   - Save enable/disable behavior
5. Users section:
   - Permission updates
   - Last-admin guard warning/block

### 4.4 Integration Tests

1. Admin can open settings route.
2. Staff is blocked from settings route.
3. External provider toggles affect attendance options.
4. Rooms updates are visible in template/session forms.

### 4.5 Firestore Rules Tests

1. Admin can write all settings/config docs and users.
2. Staff cannot write config docs.
3. Staff write access limited to policy-approved domains.
4. Unauthenticated access denied.
5. User permission updates constrained by role rules.

### 4.6 Regression Tests

1. Existing combination logic tests still pass.
2. Existing dashboard stats tests still pass.
3. Classes/templates flows are not regressed.

---

## 5. Risks and Mitigations

1. Risk: Drift between route-level guard and Firestore permissions.
   - Mitigation: add explicit route tests and rules tests.
2. Risk: Hard-delete behavior accidentally retained in Rooms/Templates.
   - Mitigation: replace delete actions with deactivate and add tests.
3. Risk: i18n gaps from empty locale namespaces.
   - Mitigation: define full key map up front in Phase 0.
4. Risk: Future dynamic pass types conflict with fixed unions.
   - Mitigation: keep v1 reference-only and plan a dedicated migration phase.

---

## 6. Definition of Done

Settings is complete when:

1. All scoped sections are shipped behind correct access control.
2. All writes are policy-compliant and server-enforced.
3. Required test layers pass (unit, hook, component, integration, rules).
4. No TypeScript/lint regressions exist.
5. Documentation and locale content are complete.
