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

## 2-credit deduction for special/event is determined by session.type lookup, not separate tokens

**Decision:** The `card` token means "this student used their class card." Whether 1 or 2 credits are deducted is determined by `onAttendanceCreated` reading `session.type` — not by encoding `2silver` or `2bronze` as separate tokens.

**Why:** The old approach (`2silver`, `2bronze`) duplicated the credit-count concern into the combination array. This meant the combination picker had to know about session types, clients had to pick the right token variant, and adding a new pass type required new token variants. With session-type lookup, the Cloud Function always has the authoritative answer. The combination array records *who paid with what*, not *how many credits*.

**Constraint:** Never add `2x` token variants. The `card` token always means the student's class card was used; credit count is the function's responsibility.

---

## Attendance records are mutable (correctable)

**Decision:** `attendanceRecords` documents CAN be updated by admin/staff. Firestore security rules allow writes. Correction workflow: set `active: false` on the original record, create a new corrected record.

**Why:** The old immutability rule caused problems when staff made mistakes at the front desk. Immutability sounded good in theory but forced workarounds (shadow records, UI hacks). In practice, attendance records need to be correctable — the soft-delete pattern (new record replaces old) achieves the audit trail goal without blocking corrections.

**Constraint:** `passSnapshot` and `estimatedValue` fields are still treated as frozen-at-check-in for historical reporting purposes. The correction pattern is soft-delete + re-create, not field-level editing.

---

## Drop-in students are stored in the student database

**Decision:** When a walk-in student pays drop-in, they get a full `students` document (`passType: null`). There is no separate drop-in entity and no `isDropIn` flag.

**Why:** Staff need to find returning drop-ins by name to see their visit history and upsell memberships. If drop-ins were not in the student database, a second visit would require re-entering the student and there would be no attendance history to show. The "No pass" badge in the roster communicates their status without a separate entity type.

**Constraint:** All students show in the roster. Filter chips ("With pass / Without pass / All") control visibility. `passType: null` is the canonical "no active pass" state.

---

## Memberships and Class Cards are separate Firestore collections

**Decision:** Eversports monthly subscriptions live in `memberships/{id}`; offline class card purchases live in `classCards/{id}`. Both share the `PassType` union in TypeScript.

**Why:** The two product types have different data shapes (membership has `tier`, class card has `type`; different expiry rules — 30 days vs 4 months; different credit amounts — 8/4 vs 10/5). Merging them into a single collection would require discriminating on a type field for every query and write. Separate collections make Firestore security rules cleaner and queries more targeted.

**Constraint:** The `Student` document stores `activePassId` + `passType` (denormalized) pointing to whichever collection is active. Hooks must update both the pass document and the student denormalized fields atomically.

---

## Party classes use an empty combination array

**Decision:** When a student attends a party class, `combination: []` (empty array) is written to the attendance record. No combination picker is shown in the UI.

**Why:** Party classes have a different business logic: attendance is tracked for headcount/history purposes but no payment token applies. An empty array is unambiguous — it cannot be confused with a valid combination. The Cloud Function sees `combination === []` and returns immediately without any credit deduction.

**Constraint:** An empty `combination` is only valid for party-type sessions. Any other session with an empty combination is a data error.

---

## Soft deletes everywhere

**Decision:** Nothing is hard deleted. Students, teachers, rooms, templates, sessions all use `active: false`.

**Why:** Attendance records reference students, teachers, and rooms by ID. Hard-deleting any of these breaks the referential integrity of historical data. A class from 2 years ago still needs to resolve the teacher who taught it.

**Constraint:** All list queries must filter `where('active', '==', true)` by default. Every list component must account for this.

---

## Denormalized passType and activePassId on students

**Decision:** `students` document stores `passType` and `activePassId` even though the source of truth is the `memberships` or `classCards` collection.

**Why:** The check-in roster needs to display the pass type badge for every student in the list. Fetching a membership or class card document per student on every roster load would be N+1 queries. The denormalized field makes the roster a single Firestore query.

**Constraint:** Whenever a membership or class card is created, updated, or deactivated, both the pass document and the parent `students` document must be updated atomically in a transaction.

---

## Teachers collection is separate from users — and there is no teacher login

**Decision:** Teacher profiles live in a `teachers` collection. There is no `teacher` user role and no teacher login.

**Why:** A teacher may exist in the system (assigned to class templates, referenced in attendance history) without ever needing app access. All check-in is performed by admin or staff. Keeping operational data (name, room assignments) separate from authentication data means teachers can be managed without creating Firebase Auth accounts.

---

## Step-up verification uses short-lived server tokens

**Decision:** After a user successfully enters a step-up code, the server returns a short-lived signed token. The client stores this in memory (not localStorage) and attaches it to financial data requests.

**Why:** The alternative — storing a `stepUpVerifiedAt` timestamp in the user's Firestore document — would persist the unlock across sessions and devices, which defeats the purpose. Memory-only storage means the unlock is automatically cleared when the tab closes.

---

## `config/` uses fixed document IDs, not a single document

**Decision:** Pricing lives at `config/pricing`, dance styles at `config/danceStyles`, class levels at `config/classLevels`, external providers at `config/externalProviders` — separate documents in the `config` collection.

**Why:** A single `config` document would need to be read entirely whenever any config value is needed. Splitting by domain means the pricing settings component only subscribes to `config/pricing`, not the entire config object. It also makes Firestore security rules more granular — `configureSystem` can gate writes to individual config documents.

---

## Trial is always available for students with no active pass

**Decision:** The `trial` token is available to any student who has no active pass (`passType === null`). It is never blocked by the combination picker and does not require a separate flag or setup.

**Why:** Trial classes are a standard upsell mechanism — staff should be able to mark any new or passless student as attending on trial with a single tap. Requiring pre-registration or a special status would create friction at the front desk.

**Constraint:** `trial` cannot be combined with any other token. If a student has an active pass, `trial` should not be offered.

---

## Rooms management is inside Settings, not a standalone route

**Decision:** Rooms are managed via Settings → Rooms. There is no `/rooms` route in the navigation.

**Why:** Rooms is not a daily-use feature — it is configuration. Moving it into Settings reduces navigation clutter and groups it with other infrequently-changed config (pricing, styles, templates). Staff who need to manage rooms can find it in Settings without a top-level nav item.
