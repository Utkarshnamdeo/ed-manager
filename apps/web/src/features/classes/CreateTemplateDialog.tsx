import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { useCreateClassTemplate } from '../../hooks/useClassTemplates'
import { useTeachers } from '../../hooks/useTeachers'
import { useRooms } from '../../hooks/useRooms'
import type { DanceStyle, ClassLevel, ClassType } from '../../types'

interface CreateTemplateDialogProps {
  defaultDayOfWeek: number
  onClose: () => void
}

export function CreateTemplateDialog({ defaultDayOfWeek, onClose }: CreateTemplateDialogProps) {
  const { t } = useTranslation('classes')
  const createTemplate = useCreateClassTemplate()
  const { data: teachers } = useTeachers()
  const { data: rooms } = useRooms()

  const [form, setForm] = useState({
    name: '',
    style: 'bachata' as DanceStyle,
    level: 'beginner' as ClassLevel,
    type: 'regular' as ClassType,
    dayOfWeek: defaultDayOfWeek,
    startTime: '19:00',
    endTime: '20:30',
    teacherId: teachers?.[0]?.id ?? '',
    roomId: rooms?.[0]?.id ?? '',
    isSubscription: false,
  })

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.teacherId || !form.roomId) return
    await createTemplate.mutateAsync({
      ...form,
      regularStudentIds: [],
      active: true,
    })
    onClose()
  }

  const styles: DanceStyle[] = ['bachata', 'kizomba', 'salsa', 'zouk', 'afro', 'other']
  const levels: ClassLevel[] = ['beginner', 'intermediate', 'advanced', 'open']
  const types: ClassType[] = ['regular', 'special', 'workshop', 'event', 'party']
  const days = [0, 1, 2, 3, 4, 5, 6] as const

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/25 z-40 animate-[fadeIn_0.15s_ease]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-[1rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 animate-[fadeIn_0.15s_ease] flex flex-col max-h-[90vh]">
          <div className="px-6 py-5 border-b border-border shrink-0">
            <Dialog.Title className="text-[1.0625rem] font-bold m-0 text-foreground">
              {t('addTemplate')}
            </Dialog.Title>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
            <div className="px-6 py-5 flex flex-col gap-4">

              {/* Name */}
              <div>
                <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.name')}</label>
                <input
                  className="form-input w-full"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder={t('form.name')}
                  required
                  autoFocus
                />
              </div>

              {/* Style + Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.style')}</label>
                  <select className="form-input w-full" value={form.style} onChange={(e) => setField('style', e.target.value as DanceStyle)}>
                    {styles.map((s) => <option key={s} value={s}>{t(`style.${s}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.level')}</label>
                  <select className="form-input w-full" value={form.level} onChange={(e) => setField('level', e.target.value as ClassLevel)}>
                    {levels.map((l) => <option key={l} value={l}>{t(`level.${l}`)}</option>)}
                  </select>
                </div>
              </div>

              {/* Type + Day */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.type')}</label>
                  <select className="form-input w-full" value={form.type} onChange={(e) => setField('type', e.target.value as ClassType)}>
                    {types.map((tp) => <option key={tp} value={tp}>{t(`type.${tp}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.dayOfWeek')}</label>
                  <select className="form-input w-full" value={form.dayOfWeek} onChange={(e) => setField('dayOfWeek', Number(e.target.value))}>
                    {days.map((d) => <option key={d} value={d}>{t(`days.${d}`)}</option>)}
                  </select>
                </div>
              </div>

              {/* Start + End time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.startTime')}</label>
                  <input className="form-input w-full" type="time" value={form.startTime} onChange={(e) => setField('startTime', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.endTime')}</label>
                  <input className="form-input w-full" type="time" value={form.endTime} onChange={(e) => setField('endTime', e.target.value)} required />
                </div>
              </div>

              {/* Teacher */}
              <div>
                <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.teacher')}</label>
                <select className="form-input w-full" value={form.teacherId} onChange={(e) => setField('teacherId', e.target.value)} required>
                  <option value="">—</option>
                  {(teachers ?? []).map((tc) => (
                    <option key={tc.id} value={tc.id}>{tc.firstName} {tc.lastName}</option>
                  ))}
                </select>
              </div>

              {/* Room */}
              <div>
                <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.room')}</label>
                <select className="form-input w-full" value={form.roomId} onChange={(e) => setField('roomId', e.target.value)} required>
                  <option value="">—</option>
                  {(rooms ?? []).map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Subscription toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isSubscription} onChange={(e) => setField('isSubscription', e.target.checked)} />
                <span className="text-sm text-foreground">{t('form.isSubscription')}</span>
              </label>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end gap-2 shrink-0">
              <Dialog.Close asChild>
                <button type="button" className="btn-secondary">{t('actions.cancel')}</button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={createTemplate.isPending || !form.name.trim() || !form.teacherId || !form.roomId}
                className="btn-primary"
              >
                {createTemplate.isPending ? '…' : t('addTemplate')}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
