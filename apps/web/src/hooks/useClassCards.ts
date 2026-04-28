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
  deleteField,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { queryClient } from '../lib/queryClient'
import type { ClassCard } from '../types'

const COLLECTION = 'classCards'

function classCardQueryKey(studentId: string) {
  return ['classCards', studentId] as const
}

function docToClassCard(id: string, data: Record<string, unknown>): ClassCard {
  return {
    id,
    studentId: data.studentId as string,
    type: data.type as ClassCard['type'],
    creditsRemaining: (data.creditsRemaining as number) ?? 0,
    creditsTotal: (data.creditsTotal as number) ?? 0,
    purchaseDate: (data.purchaseDate as { toDate(): Date })?.toDate() ?? new Date(),
    expiryDate: (data.expiryDate as { toDate(): Date })?.toDate() ?? new Date(),
    active: data.active as boolean,
    createdAt: (data.createdAt as { toDate(): Date })?.toDate() ?? new Date(),
    createdBy: (data.createdBy as string) ?? '',
  }
}

export function useActiveClassCards() {
  return useQuery({
    queryKey: ['classCards', 'active'],
    queryFn: async () => {
      const q = query(
        collection(db, COLLECTION),
        where('active', '==', true),
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => docToClassCard(d.id, d.data()))
    },
    staleTime: 60_000,
  })
}

export function useClassCardsByStudent(studentId: string) {
  return useQuery({
    queryKey: classCardQueryKey(studentId),
    queryFn: async () => {
      const q = query(
        collection(db, COLLECTION),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc'),
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => docToClassCard(d.id, d.data()))
    },
    enabled: !!studentId,
  })
}

/** Returns the single active class card for a student, or null. */
export function useActiveClassCard(studentId: string) {
  return useQuery({
    queryKey: [...classCardQueryKey(studentId), 'active'],
    queryFn: async () => {
      const q = query(
        collection(db, COLLECTION),
        where('studentId', '==', studentId),
        where('active', '==', true),
      )
      const snap = await getDocs(q)
      if (snap.empty) return null
      return docToClassCard(snap.docs[0].id, snap.docs[0].data())
    },
    enabled: !!studentId,
  })
}

type CreateClassCardInput = Omit<ClassCard, 'id' | 'createdAt'>

export function useCreateClassCard() {
  return useMutation({
    mutationFn: async (input: CreateClassCardInput) => {
      const ref = await addDoc(collection(db, COLLECTION), {
        ...input,
        createdAt: serverTimestamp(),
      })
      // Denormalize class card info onto the student doc
      await updateDoc(doc(db, 'students', input.studentId), {
        activePassId: ref.id,
        passType: input.type,
      })
      return ref.id
    },
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: classCardQueryKey(input.studentId) })
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

type UpdateClassCardInput = Partial<Omit<ClassCard, 'id' | 'createdAt'>> & {
  id: string
  studentId: string
}

export function useUpdateClassCard() {
  return useMutation({
    mutationFn: async ({ id, studentId, ...updates }: UpdateClassCardInput) => {
      await updateDoc(doc(db, COLLECTION, id), updates)
      // When deactivating a class card, clear denormalized fields on the student doc
      if (updates.active === false) {
        await updateDoc(doc(db, 'students', studentId), {
          activePassId: deleteField(),
          passType: deleteField(),
        })
      }
    },
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: classCardQueryKey(input.studentId) })
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}
