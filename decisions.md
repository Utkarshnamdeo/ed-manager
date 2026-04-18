# Architecture decisions

> Why we made the choices we made. Read when something seems odd or when considering a change.

---

## AttendanceCombination is an array, not a string key

**Decision:** `combination` is stored as `CombinationToken[]` (e.g. `['silver', 'cash']`) rather than a compound string key (e.g. `'silver_cash'`).

**Why:** The compound-key approach required 20+ explicit string literals for every possible pairing. Adding a new external provider (e.g. ClassPass) would require adding N new keys for every pass type it can be combined with. The array approach means adding one new token — all existing combination logic handles it automatically.

**Constraint:** The array is always treated as an unordered set. `['silver', 'usc']` and `['usc', 'silver']` are identical. Never rely on index position.

---

## Credit deduction is Cloud Function only

**Decision:** Credit deduction runs exclusively in `onAttendanceCreated`, a Firestore-triggered Cloud Function running under the Admin SDK.

**Why:** Client-side deduction can be bypassed by any user with browser devtools. A malicious or buggy client could decrement credits multiple times, skip deductions, or write arbitrary values. The Cloud Function is the single source of truth and cannot be bypassed from the browser.

**Constraint:** Never implement deduction logic in React components, hooks, or any client-side code. If the function fails, the attendance record still exists but the credit state is inconsistent — the shortfall flag exists for exactly this case.

---

## Attendance records are immutable

**Decision:** Once an `attendanceRecords` document is written, it is never updated. `membershipSnapshot`, `cashDefault`, and `estimatedValue` are frozen at check-in time.

**Why:** Reports generated months later must show what was true when the class happened, not what is true today. If a student upgrades their pass or if pricing rates change, historical records must be unaffected. This makes the database an audit log, not a live view.

**Constraint:** Firestore security rules enforce no client-side updates to attendance records. If a record was created in error, it is soft-deleted (`active: false`) and a corrected record is created.

---

## Soft deletes everywhere

**Decision:** Nothing is hard deleted. Students, teachers, rooms, templates, sessions all use `active: false`.

**Why:** Attendance records reference students, teachers, and rooms by ID. Hard-deleting any of these breaks the referential integrity of historical data. A class from 2 years ago still needs to resolve the teacher who taught it.

**Constraint:** All list queries must filter `where('active', '==', true)` by default. Every list component must account for this.

---

## Denormalized membershipTier on students

**Decision:** `students` document stores `membershipTier` and `activeMembershipId` even though the source of truth is the `memberships` collection.

**Why:** The check-in roster needs to display membership tier as a badge for every student in the list. Fetching a membership document per student on every roster load would be N+1 queries. The denormalized field makes the roster a single Firestore query.

**Constraint:** Whenever a membership is created, updated, or deactivated, both the `memberships` document and the parent `students` document must be updated atomically in a transaction.

---

## Teachers collection is separate from users

**Decision:** Teacher profiles live in a `teachers` collection, separate from `users`. The `users` document has a `teacherId` field linking to the teachers document when `role === 'teacher'`.

**Why:** A teacher may exist in the system (assigned to class templates, referenced in attendance history) before they ever get a login account, or after their account is deactivated. Keeping operational data (name, rate, room assignments) separate from authentication data means the two can evolve independently.

---

## Step-up verification uses short-lived server tokens

**Decision:** After a user successfully enters a step-up code, the server returns a short-lived signed token. The client stores this in memory (not localStorage) and attaches it to financial data requests.

**Why:** The alternative — storing a `stepUpVerifiedAt` timestamp in the user's Firestore document — would persist the unlock across sessions and devices, which defeats the purpose. Memory-only storage means the unlock is automatically cleared when the tab closes.

---

## `config/` uses fixed document IDs, not a single document

**Decision:** Pricing lives at `config/pricing`, backup config at `config/backup`, external providers at `config/externalProviders` — separate documents in the `config` collection.

**Why:** A single `config` document would need to be read entirely whenever any config value is needed. Splitting by domain means the backup settings component only subscribes to `config/backup`, not the entire config object. It also makes Firestore security rules more granular — `configureSystem` can gate writes to `config/pricing` and `config/backup` without exposing them as a single document.