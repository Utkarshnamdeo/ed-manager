import { useQuery, useMutation } from '@tanstack/react-query';
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
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { queryClient } from '../lib/queryClient';
import { SessionStatus, type Student } from '../types';

const COLLECTION = 'students';
const QUERY_KEY = ['students'] as const;

function docToStudent(id: string, data: Record<string, unknown>): Student {
  return {
    id,
    name: (data.name as string) ?? '',
    email: (data.email as string | null) ?? null,
    phone: (data.phone as string | null) ?? null,
    notes: (data.notes as string | null) ?? null,
    activePassId: (data.activePassId as string | null) ?? null,
    passType: (data.passType as Student['passType']) ?? null,
    active: data.active as boolean,
    createdAt: (data.createdAt as { toDate(): Date; })?.toDate() ?? new Date(),
  };
}

export function useStudents() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const q = query(
        collection(db, COLLECTION),
        where(SessionStatus.Active, '==', true),
        orderBy('name'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => docToStudent(d.id, d.data()));
    },
  });
}

/**
 * Client-side search over the already-loaded student list.
 * Returns students whose name matches the query string (case-insensitive).
 * Used for the inline check-in search on the dashboard.
 */
export function useStudentSearch(searchQuery: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const q = query(
        collection(db, COLLECTION),
        where(SessionStatus.Active, '==', true),
        orderBy('name'),
      );
      const snap = await getDocs(q);
      const lower = searchQuery.toLowerCase();
      return snap.docs
        .map((d) => docToStudent(d.id, d.data()))
        .filter((s) => s.name.toLowerCase().includes(lower));
    },
    enabled: searchQuery.trim().length > 0,
    staleTime: 30_000,
  });
}

type CreateStudentInput = Omit<Student, 'id' | 'createdAt'>;

export function useCreateStudent() {
  return useMutation({
    mutationFn: async (input: CreateStudentInput) => {
      const ref = await addDoc(collection(db, COLLECTION), {
        ...input,
        createdAt: serverTimestamp(),
      });
      return ref.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

type UpdateStudentInput = Partial<Omit<Student, 'id' | 'createdAt'>> & { id: string; };

export function useUpdateStudent() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateStudentInput) => {
      await updateDoc(doc(db, COLLECTION, id), updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteStudent() {
  return useMutation({
    mutationFn: async (id: string) => {
      // Cascade: delete all memberships and class cards for this student
      const [membershipsSnap, cardsSnap] = await Promise.all([
        getDocs(query(collection(db, 'memberships'), where('studentId', '==', id))),
        getDocs(query(collection(db, 'classCards'), where('studentId', '==', id))),
      ]);
      await Promise.all([
        ...membershipsSnap.docs.map((d) => deleteDoc(d.ref)),
        ...cardsSnap.docs.map((d) => deleteDoc(d.ref)),
      ]);
      await deleteDoc(doc(db, COLLECTION, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['classCards'] });
    },
  });
}
