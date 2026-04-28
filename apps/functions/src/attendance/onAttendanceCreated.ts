import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { getFirestore } from 'firebase-admin/firestore'

type CombinationToken =
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'card'
  | 'usc'
  | 'eversports'
  | 'dropin'
  | 'trial'
  | 'cash'

type ClassType = 'regular' | 'special' | 'event' | 'party'

/**
 * Credit deduction — atomic, server-side only. Never implement client-side.
 *
 * Deduction rules:
 *   silver / bronze / card:
 *     regular class  → 1 credit
 *     special/event  → 2 credits
 *     party          → 0 credits (no deduction)
 *   gold / usc / eversports / dropin / trial / cash → 0 credits always
 */
export const onAttendanceCreated = onDocumentCreated(
  'attendanceRecords/{recordId}',
  async (event) => {
    const record = event.data?.data()
    if (!record) return

    const combination: CombinationToken[] = record.combination ?? []

    // Party classes and empty combinations need no deduction
    if (combination.length === 0) return

    const membershipId: string | null = record.membershipId ?? null
    const classCardId: string | null = record.classCardId ?? null
    const sessionId: string | null = record.sessionId ?? null

    const hasMembershipToken =
      combination.includes('silver') || combination.includes('bronze')
    const hasCardToken = combination.includes('card')

    if (!hasMembershipToken && !hasCardToken) return
    if (!sessionId) return

    const db = getFirestore()

    // Read the session to determine class type (regular vs special/event/party)
    const sessionSnap = await db.doc(`classSessions/${sessionId}`).get()
    if (!sessionSnap.exists) return

    const sessionType: ClassType = sessionSnap.data()?.type ?? 'regular'

    // Party: no deduction regardless of combination
    if (sessionType === 'party') return

    const isSpecialClass = sessionType === 'special' || sessionType === 'event'
    const creditsToDeduct = isSpecialClass ? 2 : 1

    // ── Membership deduction (silver or bronze) ──────────────────────────────
    if (hasMembershipToken && membershipId) {
      const membershipRef = db.doc(`memberships/${membershipId}`)

      await db.runTransaction(async (tx) => {
        const membershipSnap = await tx.get(membershipRef)
        if (!membershipSnap.exists) return

        const current: number = membershipSnap.data()?.creditsRemaining ?? 0
        const shortfall = creditsToDeduct > current
        const shortfallAmount = shortfall ? creditsToDeduct - current : null

        tx.update(membershipRef, {
          creditsRemaining: Math.max(0, current - creditsToDeduct),
          ...(shortfall && { active: false }),
        })

        tx.update(event.data!.ref, {
          shortfall,
          shortfallAmount,
        })
      })

      return
    }

    // ── Class card deduction ─────────────────────────────────────────────────
    if (hasCardToken && classCardId) {
      const cardRef = db.doc(`classCards/${classCardId}`)

      await db.runTransaction(async (tx) => {
        const cardSnap = await tx.get(cardRef)
        if (!cardSnap.exists) return

        const current: number = cardSnap.data()?.creditsRemaining ?? 0
        const shortfall = creditsToDeduct > current
        const shortfallAmount = shortfall ? creditsToDeduct - current : null

        tx.update(cardRef, {
          creditsRemaining: Math.max(0, current - creditsToDeduct),
          ...(shortfall && { active: false }),
        })

        tx.update(event.data!.ref, {
          shortfall,
          shortfallAmount,
        })
      })
    }
  },
)
