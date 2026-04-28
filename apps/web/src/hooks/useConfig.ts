import { useQuery, useMutation } from '@tanstack/react-query'
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { queryClient } from '../lib/queryClient'
import { useAuth } from '../contexts/AuthContext'
import type { DanceStylesConfig, ClassLevelsConfig } from '../types'

// ─── Dance Styles ─────────────────────────────────────────────────────────────

const DANCE_STYLES_KEY = ['config', 'danceStyles'] as const

const DEFAULT_DANCE_STYLES = ['bachata', 'kizomba', 'salsa', 'zouk', 'afro', 'other']

export function useDanceStyles() {
  return useQuery({
    queryKey: DANCE_STYLES_KEY,
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'config', 'danceStyles'))
      if (!snap.exists()) return DEFAULT_DANCE_STYLES
      const data = snap.data() as DanceStylesConfig
      return data.styles
    },
    staleTime: 5 * 60_000,
  })
}

export function useUpdateDanceStyles() {
  const { appUser } = useAuth()
  return useMutation({
    mutationFn: async (styles: string[]) => {
      await setDoc(doc(db, 'config', 'danceStyles'), {
        styles,
        updatedAt: serverTimestamp(),
        updatedBy: appUser?.uid ?? '',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DANCE_STYLES_KEY })
    },
  })
}

// ─── Class Levels ─────────────────────────────────────────────────────────────

const CLASS_LEVELS_KEY = ['config', 'classLevels'] as const

const DEFAULT_CLASS_LEVELS = ['beginner', 'intermediate', 'advanced', 'open']

export function useClassLevels() {
  return useQuery({
    queryKey: CLASS_LEVELS_KEY,
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'config', 'classLevels'))
      if (!snap.exists()) return DEFAULT_CLASS_LEVELS
      const data = snap.data() as ClassLevelsConfig
      return data.levels
    },
    staleTime: 5 * 60_000,
  })
}

export function useUpdateClassLevels() {
  const { appUser } = useAuth()
  return useMutation({
    mutationFn: async (levels: string[]) => {
      await setDoc(doc(db, 'config', 'classLevels'), {
        levels,
        updatedAt: serverTimestamp(),
        updatedBy: appUser?.uid ?? '',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASS_LEVELS_KEY })
    },
  })
}
