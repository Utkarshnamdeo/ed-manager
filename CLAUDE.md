# CLAUDE.md

> This file is read automatically by Claude Code at session start.
> Keep it short. Update "Current build status" after every completed step.

---

## What this project is

Dance school attendance management app. Firebase backend, React 19 frontend, TypeScript throughout. Staff use it daily at the front desk to run class check-ins and track student memberships.

Before writing any code, read **docs/spec.md** for types, collections, business rules, and conventions.
If UI features need to be implemented please check **docs/design.md**, only access **docs/design.md** if UI features need to be worked on.
Read **docs/REDESIGN.md** for the system overview and data model.
Read **docs/decisions.md** when something seems odd or before reversing an architectural choice.

---

## Non-negotiable rules

- **Never run `git commit` or `git push`** — the developer always commits and pushes manually.
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
| Dashboard (check-in surface) | `/dashboard` | admin, staff |
| Attendance (history calendar) | `/attendance` | admin, staff |
| Classes (calendar + sessions) | `/classes` | admin, staff |
| Students | `/students` | admin, staff |
| Teachers | `/teachers` | admin, staff |
| Reports | `/reports` | admin, staff |
| Settings | `/settings` | admin only |

Note: `/` (index) redirects to `/dashboard`.
