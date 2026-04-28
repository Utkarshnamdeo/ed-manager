import { useQuery, useMutation } from '@tanstack/react-query'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { queryClient } from '../lib/queryClient'
import type { AttendanceRecord } from '../types'

const COLLECTION = 'attendanceRecords'

function docToAttendanceRecord(id: string, data: Record<string, unknown>): AttendanceRecord {
  return {
    id,
    sessionId: data.sessionId as string,
    studentId: data.studentId as string,
    combination: (data.combination as AttendanceRecord['combination']) ?? [],
    membershipId: (data.membershipId as string | null) ?? null,
    classCardId: (data.classCardId as string | null) ?? null,
    passSnapshot: (data.passSnapshot as AttendanceRecord['passSnapshot']) ?? null,
    estimatedValue: (data.estimatedValue as number) ?? 0,
    shortfall: (data.shortfall as boolean) ?? false,
    shortfallAmount: (data.shortfallAmount as number | null) ?? null,
    notes: (data.notes as string | null) ?? null,
    markedAt: (data.markedAt as { toDate(): Date })?.toDate() ?? new Date(),
    markedBy: (data.markedBy as string) ?? '',
  }
}

export function useAttendanceRecordsBySession(sessionId: string) {
  return useQuery({
    queryKey: ['attendanceRecords', 'session', sessionId],
    queryFn: async () => {
      const q = query(
        collection(db, COLLECTION),
        where('sessionId', '==', sessionId),
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => docToAttendanceRecord(d.id, d.data()))
    },
    staleTime: 30_000,
    enabled: !!sessionId,
  })
}

export function useAttendanceRecordsByStudent(studentId: string) {
  return useQuery({
    queryKey: ['attendanceRecords', 'student', studentId],
    queryFn: async () => {
      const q = query(
        collection(db, COLLECTION),
        where('studentId', '==', studentId),
        orderBy('markedAt', 'desc'),
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => docToAttendanceRecord(d.id, d.data()))
    },
    enabled: !!studentId,
  })
}

type CreateAttendanceRecordInput = Omit<AttendanceRecord, 'id' | 'markedAt'>

export function useCreateAttendanceRecord() {
  return useMutation({
    mutationFn: async (input: CreateAttendanceRecordInput) => {
      await addDoc(collection(db, COLLECTION), {
        ...input,
        markedAt: serverTimestamp(),
      })
    },
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({
        queryKey: ['attendanceRecords', 'session', input.sessionId],
      })
      queryClient.invalidateQueries({
        queryKey: ['attendanceRecords', 'student', input.studentId],
      })
      if (input.membershipId) {
        queryClient.invalidateQueries({ queryKey: ['memberships', input.studentId] })
      }
      if (input.classCardId) {
        queryClient.invalidateQueries({ queryKey: ['classCards', input.studentId] })
      }
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}
