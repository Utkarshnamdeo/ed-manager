import { useQuery, useMutation } from '@tanstack/react-query'
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { queryClient } from '../lib/queryClient'
import type { Room } from '../types'

const COLLECTION = 'rooms'
const QUERY_KEY = ['rooms'] as const

function docToRoom(id: string, data: Record<string, unknown>): Room {
  return {
    id,
    name: data.name as string,
    capacity: (data.capacity as number | null) ?? null,
    active: data.active as boolean,
  }
}

export function useRooms() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const q = query(collection(db, COLLECTION), orderBy('name'))
      const snap = await getDocs(q)
      return snap.docs.map((d) => docToRoom(d.id, d.data()))
    },
  })
}

type CreateRoomInput = Omit<Room, 'id'>

export function useCreateRoom() {
  return useMutation({
    mutationFn: async (input: CreateRoomInput) => {
      await addDoc(collection(db, COLLECTION), input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

type UpdateRoomInput = Partial<Omit<Room, 'id'>> & { id: string }

export function useUpdateRoom() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateRoomInput) => {
      await updateDoc(doc(db, COLLECTION, id), updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
