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
import type { Membership } from '../types'

const COLLECTION = 'memberships'

function membershipQueryKey(studentId: string) {
  return ['memberships', studentId] as const
}

function docToMembership(id: string, data: Record<string, unknown>): Membership {
  return {
    id,
    studentId: data.studentId as string,
    tier: data.tier as Membership['tier'],
    creditsRemaining: (data.creditsRemaining as number | null) ?? null,
    creditsTotal: (data.creditsTotal as number | null) ?? null,
    startDate: (data.startDate as { toDate(): Date })?.toDate() ?? new Date(),
    expiryDate: (data.expiryDate as { toDate(): Date })?.toDate() ?? new Date(),
    active: data.active as boolean,
    createdAt: (data.createdAt as { toDate(): Date })?.toDate() ?? new Date(),
  }
}

export function useMembershipsByStudent(studentId: string) {
  return useQuery({
    queryKey: membershipQueryKey(studentId),
    queryFn: async () => {
      const q = query(
        collection(db, COLLECTION),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc'),
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => docToMembership(d.id, d.data()))
    },
    enabled: !!studentId,
  })
}

type CreateMembershipInput = Omit<Membership, 'id' | 'createdAt'>

export function useCreateMembership() {
  return useMutation({
    mutationFn: async (input: CreateMembershipInput) => {
      const ref = await addDoc(collection(db, COLLECTION), {
        ...input,
        createdAt: serverTimestamp(),
      })
      // Denormalize membership info onto the student doc
      await updateDoc(doc(db, 'students', input.studentId), {
        activeMembershipId: ref.id,
        membershipTier: input.tier,
      })
      return ref.id
    },
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: membershipQueryKey(input.studentId) })
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

type UpdateMembershipInput = Partial<Omit<Membership, 'id' | 'createdAt'>> & {
  id: string
  studentId: string
}

export function useUpdateMembership() {
  return useMutation({
    mutationFn: async ({ id, studentId, ...updates }: UpdateMembershipInput) => {
      await updateDoc(doc(db, COLLECTION, id), updates)
      // When deactivating a membership, clear denormalized fields on the student doc
      if (updates.active === false) {
        await updateDoc(doc(db, 'students', studentId), {
          activeMembershipId: deleteField(),
          membershipTier: deleteField(),
        })
      }
    },
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: membershipQueryKey(input.studentId) })
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}
