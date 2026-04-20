import { useQuery, useMutation } from '@tanstack/react-query'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { startOfDay, endOfDay, formatISO, addDays } from 'date-fns'
import { db } from '../lib/firebase'
import { queryClient } from '../lib/queryClient'
import type { ClassSession } from '../types'

const COLLECTION = 'classSessions'

function docToClassSession(id: string, data: Record<string, unknown>): ClassSession {
  return {
    id,
    templateId: (data.templateId as string | null) ?? null,
    name: data.name as string,
    style: data.style as ClassSession['style'],
    level: data.level as ClassSession['level'],
    type: data.type as ClassSession['type'],
    date: (data.date as { toDate(): Date })?.toDate() ?? new Date(),
    startTime: data.startTime as string,
    endTime: data.endTime as string,
    teacherId: data.teacherId as string,
    originalTeacherId: (data.originalTeacherId as string | null) ?? null,
    roomId: data.roomId as string,
    status: data.status as ClassSession['status'],
    isSpecial: (data.isSpecial as boolean) ?? false,
    capacity: (data.capacity as number | null) ?? null,
    notes: (data.notes as string | null) ?? null,
    createdAt: (data.createdAt as { toDate(): Date })?.toDate() ?? new Date(),
  }
}

export function useClassSessionsByDate(date: Date) {
  const dateKey = formatISO(date, { representation: 'date' })
  return useQuery({
    queryKey: ['classSessions', 'date', dateKey],
    queryFn: async () => {
      const q = query(
        collection(db, COLLECTION),
        where('date', '>=', startOfDay(date)),
        where('date', '<', startOfDay(addDays(date, 1))),
        orderBy('date'),
        orderBy('startTime'),
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => docToClassSession(d.id, d.data()))
    },
    staleTime: 60_000,
  })
}

export function useClassSessionsByDateRange(start: Date, end: Date) {
  const startISO = formatISO(start, { representation: 'date' })
  const endISO = formatISO(end, { representation: 'date' })
  return useQuery({
    queryKey: ['classSessions', 'range', startISO, endISO],
    queryFn: async () => {
      const q = query(
        collection(db, COLLECTION),
        where('date', '>=', startOfDay(start)),
        where('date', '<=', endOfDay(end)),
        orderBy('date'),
        orderBy('startTime'),
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => docToClassSession(d.id, d.data()))
    },
    staleTime: 60_000,
  })
}

type CreateClassSessionInput = Omit<ClassSession, 'id' | 'createdAt'>

export function useCreateClassSession() {
  return useMutation({
    mutationFn: async (input: CreateClassSessionInput) => {
      await addDoc(collection(db, COLLECTION), {
        ...input,
        createdAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classSessions'] })
    },
  })
}

type UpdateClassSessionInput = Partial<Omit<ClassSession, 'id' | 'createdAt'>> & { id: string }

export function useUpdateClassSession() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateClassSessionInput) => {
      await updateDoc(doc(db, COLLECTION, id), updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classSessions'] })
    },
  })
}
