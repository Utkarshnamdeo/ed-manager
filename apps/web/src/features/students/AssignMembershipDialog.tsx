import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslation } from 'react-i18next';
import { addDays } from 'date-fns';
import { useCreateMembership } from '../../hooks/useMemberships';
import { useAuth } from '../../contexts/AuthContext';
import { MembershipTier } from '../../types';

interface AssignMembershipDialogProps {
  studentId: string;
  defaultTier?: MembershipTier;
  onClose: () => void;
}

function toDateInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

// All Eversports memberships renew monthly (30 days)
const EXPIRY_DAYS: Record<MembershipTier, number> = {
  gold: 30,
  silver: 30,
  bronze: 30,
};

const DEFAULT_CREDITS: Record<MembershipTier, number | null> = {
  gold: null,
  silver: 8,
  bronze: 4,
};

export function AssignMembershipDialog({ studentId, defaultTier, onClose }: AssignMembershipDialogProps) {
  const { t } = useTranslation('students');
  const { appUser } = useAuth();
  const createMembership = useCreateMembership();

  const today = new Date();
  const initialTier = defaultTier ?? MembershipTier.Silver;
  const [tier, setTier] = useState<MembershipTier>(initialTier);
  const [startDate, setStartDate] = useState(toDateInput(today));
  const [expiryDate, setExpiryDate] = useState(toDateInput(addDays(today, EXPIRY_DAYS[initialTier])));
  const [creditsTotal, setCreditsTotal] = useState<string>(
    DEFAULT_CREDITS[initialTier] != null ? String(DEFAULT_CREDITS[initialTier]) : ''
  );

  function handleTierChange(newTier: MembershipTier) {
    setTier(newTier);
    const credits = DEFAULT_CREDITS[newTier];
    setCreditsTotal(credits != null ? String(credits) : '');
    setExpiryDate(toDateInput(addDays(new Date(startDate), EXPIRY_DAYS[newTier])));
  }

  function handleStartDateChange(val: string) {
    setStartDate(val);
    setExpiryDate(toDateInput(addDays(new Date(val), EXPIRY_DAYS[tier])));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const creditsNum = tier === MembershipTier.Gold ? null : (creditsTotal === '' ? null : Number(creditsTotal));
    await createMembership.mutateAsync({
      studentId,
      tier,
      creditsRemaining: creditsNum,
      creditsTotal: creditsNum,
      startDate: new Date(startDate),
      expiryDate: new Date(expiryDate),
      active: true,
      createdBy: appUser?.uid ?? '',
    });
    onClose();
  }

  const tiers: MembershipTier[] = [MembershipTier.Gold, MembershipTier.Silver, MembershipTier.Bronze];

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/25 z-50 animate-[fadeIn_0.15s_ease]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card border border-border rounded-[1rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-[51] animate-[fadeIn_0.15s_ease]">
          <div className="px-6 py-5 border-b border-border">
            <Dialog.Title className="text-[1.0625rem] font-bold m-0 text-foreground">
              {t('assignMembership.title')}
            </Dialog.Title>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 flex flex-col gap-4">

              {/* Tier */}
              <div>
                <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-2">{t('assignMembership.tier')}</label>
                <div className="flex gap-2">
                  {tiers.map((tp) => (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => handleTierChange(tp)}
                      className={`flex-1 py-2 rounded-[0.5rem] border text-sm font-semibold cursor-pointer transition-[background-color,border-color] duration-100 ${ tier === tp
                        ? tp === MembershipTier.Gold ? 'badge-gold border-[oklch(0.55_0.14_85)]' :
                          tp === MembershipTier.Silver ? 'badge-silver border-[oklch(0.45_0.06_240)]' :
                            'badge-bronze border-[oklch(0.50_0.10_50)]'
                        : 'bg-card text-muted-foreground border-border'
                        }`}
                    >
                      {t(`tier.${ tp }`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start date */}
              <div>
                <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('assignMembership.startDate')}</label>
                <input
                  className="form-input w-full"
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                />
              </div>

              {/* Expiry date */}
              <div>
                <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('assignMembership.expiryDate')}</label>
                <input
                  className="form-input w-full"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>

              {/* Credits (not for gold) */}
              {tier !== MembershipTier.Gold && (
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('assignMembership.creditsTotal')}</label>
                  <input
                    className="form-input w-full"
                    type="text"
                    inputMode="numeric"
                    value={creditsTotal}
                    onChange={(e) => setCreditsTotal(e.target.value)}
                    required
                  />
                </div>
              )}

            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
              <Dialog.Close asChild>
                <button type="button" className="btn-secondary">{t('actions.cancel')}</button>
              </Dialog.Close>
              <button type="submit" disabled={createMembership.isPending} className="btn-primary">
                {createMembership.isPending ? '…' : t('assignMembership.assign')}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
