import { useQuery, useMutation } from '@tanstack/react-query'
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { queryClient } from '../lib/queryClient'
import type { Teacher } from '../types'

const COLLECTION = 'teachers'
const QUERY_KEY = ['teachers'] as const

function docToTeacher(id: string, data: Record<string, unknown>): Teacher {
  return {
    id,
    firstName: data.firstName as string,
    lastName: data.lastName as string,
    email: data.email as string,
    ratePerStudent: data.ratePerStudent as number,
    monthlyFloor: (data.monthlyFloor as number | null) ?? null,
    reportVisibility: (data.reportVisibility as Teacher['reportVisibility']) ?? {
      showAttendanceDetail: false,
      showEarningsPerSession: false,
      showTotalEarnings: false,
    },
    active: data.active as boolean,
    createdAt: (data.createdAt as { toDate(): Date })?.toDate() ?? new Date(),
  }
}

export function useTeachers() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const q = query(collection(db, COLLECTION), orderBy('lastName'))
      const snap = await getDocs(q)
      return snap.docs.map((d) => docToTeacher(d.id, d.data()))
    },
  })
}

type CreateTeacherInput = Omit<Teacher, 'id' | 'createdAt'>

export function useCreateTeacher() {
  return useMutation({
    mutationFn: async (input: CreateTeacherInput) => {
      await addDoc(collection(db, COLLECTION), {
        ...input,
        createdAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

type UpdateTeacherInput = Partial<Omit<Teacher, 'id' | 'createdAt'>> & { id: string }

export function useUpdateTeacher() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTeacherInput) => {
      await updateDoc(doc(db, COLLECTION, id), updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteTeacher() {
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, COLLECTION, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
