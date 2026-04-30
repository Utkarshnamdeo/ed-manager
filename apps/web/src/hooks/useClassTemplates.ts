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
import { SessionStatus, type ClassTemplate } from '../types';

const COLLECTION = 'classTemplates';
const QUERY_KEY = ['classTemplates'] as const;

function docToClassTemplate(id: string, data: Record<string, unknown>): ClassTemplate {
  return {
    id,
    name: data.name as string,
    style: data.style as ClassTemplate['style'],
    level: data.level as ClassTemplate['level'],
    type: data.type as ClassTemplate['type'],
    dayOfWeek: data.dayOfWeek as number,
    startTime: data.startTime as string,
    endTime: data.endTime as string,
    teacherId: data.teacherId as string,
    roomId: data.roomId as string,
    regularStudentIds: (data.regularStudentIds as string[]) ?? [],
    isSubscription: (data.isSubscription as boolean) ?? false,
    active: data.active as boolean,
    createdAt: (data.createdAt as { toDate(): Date; })?.toDate() ?? new Date(),
  };
}

export function useClassTemplates() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const q = query(
        collection(db, COLLECTION),
        where(SessionStatus.Active, '==', true),
        orderBy('dayOfWeek'),
        orderBy('startTime'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => docToClassTemplate(d.id, d.data()));
    },
  });
}

type CreateClassTemplateInput = Omit<ClassTemplate, 'id' | 'createdAt'>;

export function useCreateClassTemplate() {
  return useMutation({
    mutationFn: async (input: CreateClassTemplateInput) => {
      await addDoc(collection(db, COLLECTION), {
        ...input,
        createdAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

type UpdateClassTemplateInput = Partial<Omit<ClassTemplate, 'id' | 'createdAt'>> & { id: string; };

export function useUpdateClassTemplate() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateClassTemplateInput) => {
      await updateDoc(doc(db, COLLECTION, id), updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteClassTemplate() {
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, COLLECTION, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
