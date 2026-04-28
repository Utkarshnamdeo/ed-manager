import { useQuery } from '@tanstack/react-query'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { startOfWeek, addWeeks, formatISO } from 'date-fns'
import { db } from '../lib/firebase'

export function useWeeklyCheckinCount() {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
  const weekEnd = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 })
  const weekKey = formatISO(weekStart, { representation: 'date' })

  return useQuery({
    queryKey: ['attendanceRecords', 'weekly', weekKey],
    queryFn: async () => {
      const q = query(
        collection(db, 'attendanceRecords'),
        where('active', '==', true),
        where('markedAt', '>=', weekStart),
        where('markedAt', '<', weekEnd),
      )
      const snap = await getDocs(q)
      return snap.size
    },
    staleTime: 60_000,
  })
}
