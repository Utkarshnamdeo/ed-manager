import { useQuery, useMutation } from '@tanstack/react-query'
import {
  collection,
  query,
  where,
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
import type { Student } from '../types'

const COLLECTION = 'students'
const QUERY_KEY = ['students'] as const

function docToStudent(id: string, data: Record<string, unknown>): Student {
  return {
    id,
    firstName: data.firstName as string,
    lastName: data.lastName as string,
    email: (data.email as string | null) ?? null,
    phone: (data.phone as string | null) ?? null,
    notes: (data.notes as string | null) ?? null,
    activeMembershipId: (data.activeMembershipId as string | null) ?? null,
    membershipTier: (data.membershipTier as Student['membershipTier']) ?? null,
    active: data.active as boolean,
    createdAt: (data.createdAt as { toDate(): Date })?.toDate() ?? new Date(),
  }
}

export function useStudents() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const q = query(
        collection(db, COLLECTION),
        where('active', '==', true),
        orderBy('lastName'),
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => docToStudent(d.id, d.data()))
    },
  })
}

type CreateStudentInput = Omit<Student, 'id' | 'createdAt'>

export function useCreateStudent() {
  return useMutation({
    mutationFn: async (input: CreateStudentInput) => {
      const ref = await addDoc(collection(db, COLLECTION), {
        ...input,
        createdAt: serverTimestamp(),
      })
      return ref.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

type UpdateStudentInput = Partial<Omit<Student, 'id' | 'createdAt'>> & { id: string }

export function useUpdateStudent() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateStudentInput) => {
      await updateDoc(doc(db, COLLECTION, id), updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteStudent() {
  return useMutation({
    mutationFn: async (id: string) => {
      // Cascade: delete all memberships for this student first
      const membershipsSnap = await getDocs(
        query(collection(db, 'memberships'), where('studentId', '==', id)),
      )
      await Promise.all(membershipsSnap.docs.map((d) => deleteDoc(d.ref)))
      await deleteDoc(doc(db, COLLECTION, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['memberships'] })
    },
  })
}
