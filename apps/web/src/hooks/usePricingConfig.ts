import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { PricingConfig } from '../types'

const QUERY_KEY = ['config', 'pricing'] as const

function docToPricingConfig(data: Record<string, unknown>): PricingConfig {
  return {
    dropInCashRate: data.dropInCashRate as number,
    silverCashSurcharge: data.silverCashSurcharge as number,
    bronzeCashSurcharge: data.bronzeCashSurcharge as number,
    silverPassPrice: data.silverPassPrice as number,
    bronzePassPrice: data.bronzePassPrice as number,
    goldMonthlyPrice: data.goldMonthlyPrice as number,
    uscRatePerCheckin: data.uscRatePerCheckin as number,
    eversportsRatePerCheckin: data.eversportsRatePerCheckin as number,
    specialClassSurcharge: data.specialClassSurcharge as number,
    trialRate: data.trialRate as number,
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
