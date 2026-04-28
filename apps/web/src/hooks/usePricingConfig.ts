import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { PricingConfig } from '../types'

const QUERY_KEY = ['config', 'pricing'] as const

function docToPricingConfig(data: Record<string, unknown>): PricingConfig {
  return {
    dropInRate: (data.dropInRate as number) ?? 13,
    silverMonthlyPrice: (data.silverMonthlyPrice as number) ?? 0,
    bronzeMonthlyPrice: (data.bronzeMonthlyPrice as number) ?? 0,
    goldMonthlyPrice: (data.goldMonthlyPrice as number) ?? 0,
    tenClassCardPrice: (data.tenClassCardPrice as number) ?? 0,
    fiveClassCardPrice: (data.fiveClassCardPrice as number) ?? 0,
    uscRatePerCheckin: (data.uscRatePerCheckin as number) ?? 0,
    eversportsRatePerCheckin: (data.eversportsRatePerCheckin as number) ?? 0,
    updatedAt: (data.updatedAt as { toDate(): Date })?.toDate() ?? new Date(),
    updatedBy: (data.updatedBy as string) ?? '',
  }
}

export function usePricingConfig() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'config', 'pricing'))
      if (!snap.exists()) return null
      return docToPricingConfig(snap.data() as Record<string, unknown>)
    },
    staleTime: 5 * 60_000,
  })
}
