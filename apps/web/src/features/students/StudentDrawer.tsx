import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { differenceInDays } from 'date-fns'
import { useUpdateStudent, useDeleteStudent } from '../../hooks/useStudents'
import { useMembershipsByStudent, useUpdateMembership } from '../../hooks/useMemberships'
import { useAttendanceRecordsByStudent } from '../../hooks/useAttendanceRecords'
import { MembershipBadge } from './StudentsPage'
import { AssignMembershipDialog } from './AssignMembershipDialog'
import type { Student, Membership, MembershipTier } from '../../types'

/* ─── Icons ── */

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

/* ─── Avatar ── */

const AVATAR_HUE_CLASSES = ['avatar-h-0', 'avatar-h-1', 'avatar-h-2', 'avatar-h-3', 'avatar-h-4', 'avatar-h-5', 'avatar-h-6', 'avatar-h-7']

function nameHash(name: string): number {
  let h = 0
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return Math.abs(h)
}

function DrawerAvatar({ name }: { name: string }) {
  const hueClass = AVATAR_HUE_CLASSES[nameHash(name) % 8]
  const initials = name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  return (
    <div aria-hidden="true" className={`size-12 rounded-full shrink-0 flex items-center justify-center text-sm font-bold select-none ${hueClass}`}>
      {initials}
    </div>
  )
}

/* ─── Profile Tab ── */

function ProfileTab({ student, canManage, onClose }: { student: Student; canManage: boolean; onClose: () => void }) {
  const { t } = useTranslation('students')
  const updateStudent = useUpdateStudent()
  const deleteStudent = useDeleteStudent()
  const [editing, setEditing] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState({
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email ?? '',
    phone: student.phone ?? '',
    notes: student.notes ?? '',
  })

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    await updateStudent.mutateAsync({
      id: student.id,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    })
    setEditing(false)
  }

  function handleCancel() {
    setForm({ firstName: student.firstName, lastName: student.lastName, email: student.email ?? '', phone: student.phone ?? '', notes: student.notes ?? '' })
    setEditing(false)
    setConfirmDeactivate(false)
  }

  async function handleToggleActive() {
    await updateStudent.mutateAsync({ id: student.id, active: !student.active })
    setConfirmDeactivate(false)
  }

  async function handleDelete() {
    await deleteStudent.mutateAsync(student.id)
    onClose()
  }

  const fields = [
    { key: 'firstName', label: t('form.firstName') },
    { key: 'lastName',  label: t('form.lastName') },
    { key: 'email',     label: t('form.email') },
    { key: 'phone',     label: t('form.phone') },
    { key: 'notes',     label: t('form.notes') },
  ] as const

  return (
    <div className="flex flex-col gap-4">
      {fields.map(({ key, label }) => (
        <div key={key}>
          <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{label}</label>
          {editing
            ? <input className="form-input w-full" value={form[key]} onChange={(e) => setField(key, e.target.value)} />
            : <div className="text-[0.9375rem] text-foreground py-2">{(student[key as keyof Student] as string | null) || '—'}</div>}
        </div>
      ))}

      {canManage && (
        <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
          {confirmDelete ? (
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[0.8125rem] text-foreground m-0">
                {t('actions.deleteConfirm', { name: `${student.firstName} ${student.lastName}` })}
              </p>
              <p className="text-xs text-destructive m-0">{t('actions.deleteWarning')}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1">{t('actions.cancel')}</button>
                <button onClick={handleDelete} disabled={deleteStudent.isPending} className="btn-destructive flex-1">
                  {deleteStudent.isPending ? '…' : t('actions.delete')}
                </button>
              </div>
            </div>
          ) : confirmDeactivate ? (
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[0.8125rem] text-foreground m-0">
                {t('actions.deactivateConfirm', { name: `${student.firstName} ${student.lastName}` })}
              </p>
              <div className="flex gap-2">
                <button onClick={handleCancel} className="btn-secondary flex-1">{t('actions.cancel')}</button>
                <button onClick={handleToggleActive} disabled={updateStudent.isPending} className="btn-destructive flex-1">
                  {t('actions.deactivate')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="btn-destructive-outline"
                >
                  {t('actions.delete')}
                </button>
                <button
                  onClick={() => student.active ? setConfirmDeactivate(true) : handleToggleActive()}
                  className={student.active ? 'btn-secondary' : 'btn-secondary'}
                >
                  {student.active ? t('actions.deactivate') : t('actions.activate')}
                </button>
              </div>
              <div className="flex gap-2 ml-auto">
                {editing ? (
                  <>
                    <button onClick={handleCancel} className="btn-secondary">{t('actions.cancel')}</button>
                    <button onClick={handleSave} disabled={updateStudent.isPending} className="btn-primary">
                      {updateStudent.isPending ? '…' : t('actions.save')}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)} className="btn-secondary">{t('actions.edit')}</button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Membership Card ── */

function MembershipCard({ membership, onDeactivate, onRenew, canManage }: {
  membership: Membership
  onDeactivate: () => void
  onRenew: () => void
  canManage: boolean
}) {
  const { t } = useTranslation('students')
  const today = new Date()
  const daysLeft = differenceInDays(membership.expiryDate, today)
  const creditsLeft = membership.creditsRemaining ?? 0
  const pct = membership.creditsTotal != null && membership.creditsTotal > 0
    ? Math.round((creditsLeft / membership.creditsTotal) * 100)
    : 0

  const isExpiringSoon = daysLeft >= 0 && daysLeft <= 7
  const isExpired = daysLeft < 0
  const isLowCredits = membership.creditsTotal != null && creditsLeft <= 2 && creditsLeft > 0

  const expiryColor =
    isExpired ? 'text-destructive' :
    isExpiringSoon ? 'text-[oklch(0.52_0.14_85)]' :
    'text-muted-foreground'

  const expiryText =
    isExpired ? t('membership.expired') :
    daysLeft === 0 ? t('membership.expiresToday') :
    t('membership.expiresIn', { days: daysLeft })

  return (
    <div className="bg-muted rounded-[0.75rem] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MembershipBadge tier={membership.tier} />
          <span className="text-sm font-semibold text-foreground capitalize">{membership.tier} Pass</span>
          {(isExpiringSoon || isLowCredits) && (
            <span className="text-[0.6rem] font-bold uppercase tracking-wide px-1.5 py-[1px] rounded-full bg-warning-subtle text-[oklch(0.50_0.14_85)]">
              {isExpiringSoon ? t('membership.expiringAlert') : t('membership.lowCreditsAlert')}
            </span>
          )}
        </div>
        {canManage && membership.active && (
          <div className="flex items-center gap-2">
            <button onClick={onRenew} className="text-xs font-semibold text-primary bg-transparent border-0 cursor-pointer">
              {t('membership.renew')}
            </button>
            <button onClick={onDeactivate} className="text-xs text-destructive bg-transparent border-0 cursor-pointer">
              {t('membership.deactivate')}
            </button>
          </div>
        )}
      </div>

      {membership.creditsTotal != null && (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{creditsLeft} / {membership.creditsTotal} credits remaining</span>
            {isLowCredits && <span className="text-[oklch(0.52_0.14_85)]">Low</span>}
          </div>
          <div className="h-2 rounded-full bg-background overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                pct <= 20 ? 'bg-destructive' : pct <= 40 ? 'bg-warning' : 'bg-primary'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {t('membership.started')}: {membership.startDate.toLocaleDateString()}
        </span>
        <span className={expiryColor}>{expiryText}</span>
      </div>
    </div>
  )
}

/* ─── Membership Tab ── */

function MembershipTab({ student, canManage }: { student: Student; canManage: boolean }) {
  const { t } = useTranslation('students')
  const { data: memberships } = useMembershipsByStudent(student.id)
  const updateMembership = useUpdateMembership()
  const [showAssign, setShowAssign] = useState(false)
  const [renewTier, setRenewTier] = useState<MembershipTier | undefined>(undefined)
  const [showPast, setShowPast] = useState(false)

  const active = (memberships ?? []).find((m) => m.active)
  const past = (memberships ?? []).filter((m) => !m.active)

  async function handleDeactivate(m: Membership) {
    await updateMembership.mutateAsync({ id: m.id, studentId: student.id, active: false })
  }

  function handleRenew(m: Membership) {
    setRenewTier(m.tier)
    setShowAssign(true)
  }

  return (
    <div className="flex flex-col gap-4">
      {active ? (
        <MembershipCard
          membership={active}
          onDeactivate={() => handleDeactivate(active)}
          onRenew={() => handleRenew(active)}
          canManage={canManage}
        />
      ) : (
        <p className="text-sm text-muted-foreground py-2">{t('membership.none')}</p>
      )}

      {/* Past memberships */}
      {past.length > 0 && (
        <div>
          <button
            onClick={() => setShowPast((v) => !v)}
            className="text-[0.8125rem] font-semibold text-muted-foreground bg-transparent border-0 cursor-pointer p-0 flex items-center gap-1"
          >
            {t('membership.past')} ({past.length})
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-150 ${showPast ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showPast && (
            <div className="mt-2 flex flex-col gap-2">
              {past.map((m) => {
                const creditsUsed = m.creditsTotal != null && m.creditsRemaining != null
                  ? m.creditsTotal - m.creditsRemaining
                  : null
                return (
                  <div key={m.id} className="flex items-center gap-2 px-3 py-2.5 bg-muted rounded-[0.5rem]">
                    <MembershipBadge tier={m.tier} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">
                        {m.startDate.toLocaleDateString()} – {m.expiryDate.toLocaleDateString()}
                      </div>
                      {creditsUsed !== null && (
                        <div className="text-xs text-muted-foreground/70 mt-0.5">
                          {t('membership.creditsUsed', { used: creditsUsed, total: m.creditsTotal })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {canManage && (
        <button
          onClick={() => { setRenewTier(undefined); setShowAssign(true) }}
          className="text-[0.8125rem] font-semibold text-primary bg-transparent border-0 cursor-pointer p-0 text-left"
        >
          {t('membership.assignNew')}
        </button>
      )}

      {showAssign && (
        <AssignMembershipDialog
          studentId={student.id}
          defaultTier={renewTier}
          onClose={() => { setShowAssign(false); setRenewTier(undefined) }}
        />
      )}
    </div>
  )
}

/* ─── History Tab ── */

function HistoryTab({ student }: { student: Student }) {
  const { t } = useTranslation('students')
  const { data: records } = useAttendanceRecordsByStudent(student.id)

  if (!records || records.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">{t('history.noHistory')}</p>
  }

  const STATUS_BADGE: Record<string, string> = {
    present: 'bg-success-subtle text-success',
    late:    'bg-warning-subtle text-[oklch(0.48_0.14_85)]',
    absent:  'bg-muted text-muted-foreground',
    trial:   'bg-secondary-subtle text-secondary',
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {records.map((r) => (
        <div key={r.id} className="flex items-center gap-3 py-3">
          <div className="text-xs text-muted-foreground w-20 shrink-0">
            {r.markedAt.toLocaleDateString()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[0.8125rem] font-medium text-foreground truncate">
              {r.combination.join(' + ')}
            </div>
          </div>
          <span className={`text-[0.6875rem] font-semibold px-2 py-[2px] rounded-full shrink-0 ${STATUS_BADGE[r.status] ?? 'bg-muted text-muted-foreground'}`}>
            {r.status}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── Student Drawer ── */

interface StudentDrawerProps {
  student: Student
  canManage: boolean
  onClose: () => void
}

export function StudentDrawer({ student, canManage, onClose }: StudentDrawerProps) {
  const { t } = useTranslation('students')
  const [tab, setTab] = useState<'profile' | 'membership' | 'history'>('profile')
  const fullName = `${student.firstName} ${student.lastName}`

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/25 z-40 animate-[fadeIn_0.15s_ease]" />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-[480px] bg-card border-l border-border flex flex-col z-50 animate-[slideInRight_0.2s_ease]">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
          <DrawerAvatar name={fullName} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base text-foreground">{fullName}</div>
            <div className="mt-0.5">
              <MembershipBadge tier={student.membershipTier} />
            </div>
          </div>
          <button onClick={onClose} className="bg-transparent border-0 cursor-pointer text-muted-foreground p-1">
            <IconClose />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          {(['profile', 'membership', 'history'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`py-3 mr-6 bg-transparent border-0 cursor-pointer text-sm transition-[color] duration-150 border-b-2 ${
                tab === key
                  ? 'font-semibold text-primary border-b-primary'
                  : 'font-normal text-muted-foreground border-b-transparent'
              }`}
            >
              {t(`drawer.${key}`)}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {tab === 'profile'     && <ProfileTab student={student} canManage={canManage} onClose={onClose} />}
          {tab === 'membership'  && <MembershipTab student={student} canManage={canManage} />}
          {tab === 'history'     && <HistoryTab student={student} />}
        </div>
      </div>
    </>
  )
}
