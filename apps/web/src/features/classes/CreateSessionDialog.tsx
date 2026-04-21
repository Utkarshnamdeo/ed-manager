import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { useCreateClassSession } from '../../hooks/useClassSessions'
import { useClassTemplates } from '../../hooks/useClassTemplates'
import { useTeachers } from '../../hooks/useTeachers'
import { useRooms } from '../../hooks/useRooms'
import type { DanceStyle, ClassLevel, ClassType, ClassTemplate } from '../../types'

interface CreateSessionDialogProps {
  onClose: () => void
  defaultDate?: Date
}

export function CreateSessionDialog({ onClose, defaultDate }: CreateSessionDialogProps) {
  const { t } = useTranslation('classes')
  const createSession = useCreateClassSession()
  const { data: templates } = useClassTemplates()
  const { data: teachers } = useTeachers()
  const { data: rooms } = useRooms()

  const defaultDateStr = defaultDate
    ? defaultDate.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    templateId: '' as string | null,
    name: '',
    style: 'bachata' as DanceStyle,
    level: 'beginner' as ClassLevel,
    type: 'regular' as ClassType,
    date: defaultDateStr,
    startTime: '19:00',
    endTime: '20:30',
    teacherId: teachers?.[0]?.id ?? '',
    roomId: rooms?.[0]?.id ?? '',
    isSpecial: false,
    capacity: '' as string | number,
    notes: '',
  })

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function applyTemplate(tmpl: ClassTemplate) {
    setForm((prev) => ({
      ...prev,
      templateId: tmpl.id,
      name: tmpl.name,
      style: tmpl.style,
      level: tmpl.level,
      type: tmpl.type,
      startTime: tmpl.startTime,
      endTime: tmpl.endTime,
      teacherId: tmpl.teacherId,
      roomId: tmpl.roomId,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.teacherId || !form.roomId || !form.date) return
    await createSession.mutateAsync({
      templateId: form.templateId || null,
      name: form.name.trim(),
      style: form.style,
      level: form.level,
      type: form.type,
      date: new Date(form.date),
      startTime: form.startTime,
      endTime: form.endTime,
      teacherId: form.teacherId,
      originalTeacherId: null,
      roomId: form.roomId,
      status: 'planned',
      isSpecial: form.isSpecial,
      capacity: form.capacity === '' ? null : Number(form.capacity),
      notes: form.notes.trim() || null,
    })
    onClose()
  }

  const styles: DanceStyle[] = ['bachata', 'kizomba', 'salsa', 'zouk', 'afro', 'other']
  const levels: ClassLevel[] = ['beginner', 'intermediate', 'advanced', 'open']
  const types: ClassType[] = ['regular', 'special', 'workshop', 'event', 'party']

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/25 z-40 animate-[fadeIn_0.15s_ease]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-[1rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 animate-[fadeIn_0.15s_ease] flex flex-col max-h-[90vh]">
          <div className="px-6 py-5 border-b border-border shrink-0">
            <Dialog.Title className="text-[1.0625rem] font-bold m-0 text-foreground">
              {t('addSession')}
            </Dialog.Title>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
            <div className="px-6 py-5 flex flex-col gap-4">

              {/* Template (optional) */}
              <div>
                <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.template')}</label>
                <select
                  className="form-input w-full"
                  value={form.templateId ?? ''}
                  onChange={(e) => {
                    const tmpl = (templates ?? []).find((t) => t.id === e.target.value)
                    if (tmpl) applyTemplate(tmpl)
                    else setField('templateId', null)
                  }}
                >
                  <option value="">— {t('form.template')}</option>
                  {(templates ?? []).map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.name')}</label>
                <input
                  className="form-input w-full"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
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

              {/* Type + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.type')}</label>
                  <select className="form-input w-full" value={form.type} onChange={(e) => setField('type', e.target.value as ClassType)}>
                    {types.map((tp) => <option key={tp} value={tp}>{t(`type.${tp}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.date')}</label>
                  <input className="form-input w-full" type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} required />
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

              {/* Room + Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.room')}</label>
                  <select className="form-input w-full" value={form.roomId} onChange={(e) => setField('roomId', e.target.value)} required>
                    <option value="">—</option>
                    {(rooms ?? []).map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.capacity')}</label>
                  <input
                    className="form-input w-full"
                    type="text"
                    inputMode="numeric"
                    value={form.capacity}
                    onChange={(e) => setField('capacity', e.target.value)}
                    placeholder="—"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.notes')}</label>
                <textarea
                  className="form-input w-full resize-none"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="—"
                />
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end gap-2 shrink-0">
              <Dialog.Close asChild>
                <button type="button" className="btn-secondary">{t('actions.cancel')}</button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={createSession.isPending || !form.name.trim() || !form.teacherId || !form.roomId}
                className="btn-primary"
              >
                {createSession.isPending ? '…' : t('addSession')}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
