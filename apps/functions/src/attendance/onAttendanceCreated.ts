import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { getFirestore } from 'firebase-admin/firestore'

type CombinationToken =
  | 'gold' | 'silver' | '2silver' | 'bronze' | '2bronze'
  | 'usc' | 'eversports' | 'cash' | 'trial'

// Credit deduction — atomic, server-side only. Never implement client-side.
export const onAttendanceCreated = onDocumentCreated(
  'attendanceRecords/{recordId}',
  async (event) => {
    const record = event.data?.data()
    if (!record) return

    const combination: CombinationToken[] = record.combination ?? []
    let silverDeduction = 0
    let bronzeDeduction = 0

    if (combination.includes('silver')) silverDeduction = 1
    if (combination.includes('2silver')) silverDeduction = 2
    if (combination.includes('bronze')) bronzeDeduction = 1
    if (combination.includes('2bronze')) bronzeDeduction = 2

    const totalDeduction = silverDeduction + bronzeDeduction
    if (totalDeduction === 0) return

    const membershipId: string | null = record.membershipId ?? null
    if (!membershipId) return

    const db = getFirestore()
    const membershipRef = db.doc(`memberships/${membershipId}`)

    await db.runTransaction(async (tx) => {
      const membershipSnap = await tx.get(membershipRef)
      if (!membershipSnap.exists) return

      const current: number = membershipSnap.data()?.creditsRemaining ?? 0
      const shortfall = totalDeduction > current
      const shortfallAmount = shortfall ? totalDeduction - current : null

      tx.update(membershipRef, {
        creditsRemaining: Math.max(0, current - totalDeduction),
        ...(shortfall && { active: false }),
      })

      tx.update(event.data!.ref, {
        shortfall,
        shortfallAmount,
      })
    })
  },
)
