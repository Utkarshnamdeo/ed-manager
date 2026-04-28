import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAttendanceRecordsBySession, useCreateAttendanceRecord } from '../../hooks/useAttendanceRecords'
import { useStudents } from '../../hooks/useStudents'
import { useMembershipsByStudent } from '../../hooks/useMemberships'
import { useClassCardsByStudent } from '../../hooks/useClassCards'
import { calcEstimatedValue, computeDisabled } from '../../lib/combinationLogic'
import { AddStudentInline } from './AddStudentInline'
import type { ClassSession, Student, PricingConfig, CombinationToken, PassType, MembershipTier } from '../../types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface CheckInPanelProps {
  session: ClassSession
  pricingConfig: PricingConfig | null
  markedBy: string
}

// ─── State machine ────────────────────────────────────────────────────────────

type PanelState =
  | { step: 'search' }
  | { step: 'pass'; student: Student }
  | { step: 'noPass'; student: Student }
  | { step: 'addStudent'; searchQuery: string }
  | { step: 'party'; student: Student }

// ─── Type guard ───────────────────────────────────────────────────────────────

function isMembershipTier(pt: PassType): pt is MembershipTier {
  return pt === 'gold' || pt === 'silver' || pt === 'bronze'
}

// ─── Token label helper ───────────────────────────────────────────────────────

function tokenLabel(token: CombinationToken, pricingConfig: PricingConfig | null, t: (key: string, opts?: Record<string, unknown>) => string): string {
  switch (token) {
    case 'gold':       return t('dashboard.checkin.gold')
    case 'silver':     return t('dashboard.checkin.silver')
    case 'bronze':     return t('dashboard.checkin.bronze')
    case 'card':       return t('dashboard.checkin.card')
    case 'usc':        return t('dashboard.checkin.usc')
    case 'eversports': return t('dashboard.checkin.eversports')
    case 'dropin':     return t('dashboard.checkin.dropin', { rate: pricingConfig?.dropInRate ?? 13 })
    case 'trial':      return t('dashboard.checkin.trial')
    case 'cash':       return t('dashboard.checkin.cash')
  }
}

// ─── PassFlowPanel — handles 'pass' state ────────────────────────────────────

interface PassFlowPanelProps {
  session: ClassSession
  student: Student
  pricingConfig: PricingConfig | null
  onConfirm: (combination: CombinationToken[], notes: string) => Promise<void>
  onCancel: () => void
}

function PassFlowPanel({ session, student, pricingConfig, onConfirm, onCancel }: PassFlowPanelProps) {
  const { t } = useTranslation()
  const { data: memberships = [] } = useMembershipsByStudent(student.id)
  const { data: classCards = [] } = useClassCardsByStudent(student.id)
  const [notes, setNotes] = useState('')
  const [supplement, setSupplement] = useState<CombinationToken | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const activeMembership = memberships.find(
    (m) => m.id === student.activePassId && m.active
  ) ?? null
  const activeCard = classCards.find(
    (c) => c.id === student.activePassId && c.active
  ) ?? null

  const passToken: CombinationToken =
    student.passType && isMembershipTier(student.passType)
      ? student.passType
      : 'card'

  const isSpecial = session.type === 'special' || session.type === 'event'
  const isGold = passToken === 'gold'
  // For gold or regular classes — no supplement needed
  const showSupplementPicker = isSpecial && !isGold

  const currentSet = new Set<CombinationToken>([passToken, ...(supplement ? [supplement] : [])])
  const disabled = computeDisabled(currentSet, isSpecial)

  const supplementOptions: CombinationToken[] = ['usc', 'eversports', 'cash']

  function buildCombination(): CombinationToken[] {
    if (supplement) return [passToken, supplement]
    return [passToken]
  }

  async function handleConfirm() {
    setSubmitting(true)
    try {
      await onConfirm(buildCombination(), notes)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold">{student.name}</div>

      {/* Pass token pill (pre-selected, not toggleable) */}
      <div className="flex gap-2 flex-wrap">
        <span className="inline-flex items-center h-7 px-3 rounded-full text-xs font-bold bg-primary text-primary-foreground">
          {tokenLabel(passToken, pricingConfig, t)}
        </span>
      </div>

      {/* Supplement picker — only for special/event with non-gold passes */}
      {showSupplementPicker && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {t('dashboard.checkin.supplementLabel')}
          </span>
          <div className="flex gap-2 flex-wrap">
            {supplementOptions.map((token) => {
              const isSelected = supplement === token
              const isDisabled = disabled.has(token)
              return (
                <button
                  key={token}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setSupplement(isSelected ? null : token)}
                  className={[
                    'h-8 px-3 rounded-full text-xs font-semibold border transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:bg-muted',
                    isDisabled ? 'opacity-40 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  {tokenLabel(token, pricingConfig, t)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t('dashboard.checkin.notesPlaceholder')}
        className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="h-8 px-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {t('dashboard.checkin.cancel')}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="h-8 px-4 rounded-md text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {submitting ? '…' : t('dashboard.checkin.confirm')}
        </button>
      </div>
    </div>
  )
}

// ─── NoPassFlowPanel — handles 'noPass' state ─────────────────────────────────

interface NoPassFlowPanelProps {
  student: Student
  pricingConfig: PricingConfig | null
  onConfirm: (combination: CombinationToken[], notes: string) => Promise<void>
  onCancel: () => void
}

function NoPassFlowPanel({ student, pricingConfig, onConfirm, onCancel }: NoPassFlowPanelProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<CombinationToken | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const sources: { token: CombinationToken; label: string }[] = [
    { token: 'usc',       label: t('dashboard.checkin.usc') },
    { token: 'eversports', label: t('dashboard.checkin.eversports') },
    { token: 'dropin',    label: t('dashboard.checkin.dropin', { rate: pricingConfig?.dropInRate ?? 13 }) },
    { token: 'trial',     label: t('dashboard.checkin.trial') },
  ]

  async function handleConfirm() {
    if (!selected) return
    setSubmitting(true)
    try {
      await onConfirm([selected], notes)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold">{student.name}</div>

      {/* Source picker */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {t('dashboard.checkin.sourcePickerLabel')}
        </span>
        <div className="grid grid-cols-2 gap-2">
          {sources.map(({ token, label }) => (
            <button
              key={token}
              type="button"
              onClick={() => setSelected(selected === token ? null : token)}
              className={[
                'h-9 px-3 rounded-lg text-sm font-semibold border transition-colors',
                selected === token
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-muted',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      {selected && (
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('dashboard.checkin.notesPlaceholder')}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="h-8 px-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {t('dashboard.checkin.cancel')}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selected || submitting}
          className="h-8 px-4 rounded-md text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {submitting ? '…' : t('dashboard.checkin.confirm')}
        </button>
      </div>
    </div>
  )
}

// ─── PartyFlowPanel — handles 'party' state ───────────────────────────────────

interface PartyFlowPanelProps {
  student: Student
  onConfirm: (combination: CombinationToken[], notes: string) => Promise<void>
  onCancel: () => void
}

function PartyFlowPanel({ student, onConfirm, onCancel }: PartyFlowPanelProps) {
  const { t } = useTranslation()
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleConfirm() {
    setSubmitting(true)
    try {
      // Party: always empty combination — no tokens, no credit deduction
      await onConfirm([], notes)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold">{student.name}</div>
      <p className="text-xs text-muted-foreground">{t('dashboard.checkin.partyNote')}</p>

      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t('dashboard.checkin.notesPlaceholder')}
        className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="h-8 px-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {t('dashboard.checkin.cancel')}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="h-8 px-4 rounded-md text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {submitting ? '…' : t('dashboard.checkin.checkIn')}
        </button>
      </div>
    </div>
  )
}

// ─── CheckInPanel (main export) ───────────────────────────────────────────────

export function CheckInPanel({ session, pricingConfig, markedBy }: CheckInPanelProps) {
  const { t } = useTranslation()
  const { data: records = [] } = useAttendanceRecordsBySession(session.id)
  const { data: allStudents = [] } = useStudents()
  const createRecord = useCreateAttendanceRecord()

  const [state, setState] = useState<PanelState>({ step: 'search' })
  const [query, setQuery] = useState('')
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false)
  const [studentAdded, setStudentAdded] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const activeRecords = records.filter((r) => r.active !== false)
  const studentMap = new Map(allStudents.map((s) => [s.id, s]))

  // Client-side search
  const lowerQuery = query.toLowerCase()
  const filtered = query.trim()
    ? allStudents
        .filter((s) => s.name.toLowerCase().includes(lowerQuery))
        .slice(0, 8)
    : []

  const hasExactMatch = filtered.some(
    (s) => s.name.toLowerCase() === lowerQuery
  )
  const showAddStudentButton = query.trim().length >= 3 && !hasExactMatch

  function selectStudent(student: Student) {
    setAlreadyCheckedIn(false)
    setShowDropdown(false)

    // Check if already checked in
    const alreadyIn = activeRecords.some((r) => r.studentId === student.id)
    if (alreadyIn) {
      setAlreadyCheckedIn(true)
      setQuery('')
      return
    }

    // Transition based on session type and passType
    if (session.type === 'party') {
      setState({ step: 'party', student })
    } else if (student.passType !== null) {
      setState({ step: 'pass', student })
    } else {
      setState({ step: 'noPass', student })
    }
    setQuery('')
  }

  // Builds passSnapshot from memberships/classCards loaded in PassFlowPanel
  // For noPass and party flows, passSnapshot is null
  async function handleConfirmFromPassFlow(
    student: Student,
    combination: CombinationToken[],
    notes: string,
    memberships: import('../../types').Membership[],
    classCards: import('../../types').ClassCard[],
  ) {
    const activeMembership =
      memberships.find((m) => m.id === student.activePassId && m.active) ?? null
    const activeCard =
      classCards.find((c) => c.id === student.activePassId && c.active) ?? null

    const passSnapshot = activeMembership
      ? {
          type: activeMembership.tier as import('../../types').PassType,
          creditsAtCheckIn: activeMembership.creditsRemaining,
        }
      : activeCard
      ? {
          type: activeCard.type as import('../../types').PassType,
          creditsAtCheckIn: activeCard.creditsRemaining,
        }
      : null

    await createRecord.mutateAsync({
      sessionId: session.id,
      studentId: student.id,
      combination,
      membershipId: activeMembership?.id ?? null,
      classCardId: activeCard?.id ?? null,
      passSnapshot,
      estimatedValue: calcEstimatedValue(combination, pricingConfig),
      shortfall: false,      // Cloud Function sets actual value
      shortfallAmount: null,
      notes: notes.trim() || null,
      markedBy,
      active: true,
    })
    setState({ step: 'search' })
    setQuery('')
  }

  async function handleConfirmSimple(
    student: Student,
    combination: CombinationToken[],
    notes: string,
  ) {
    await createRecord.mutateAsync({
      sessionId: session.id,
      studentId: student.id,
      combination,
      membershipId: null,
      classCardId: null,
      passSnapshot: null,
      estimatedValue: calcEstimatedValue(combination, pricingConfig),
      shortfall: false,
      shortfallAmount: null,
      notes: notes.trim() || null,
      markedBy,
      active: true,
    })
    setState({ step: 'search' })
    setQuery('')
  }

  function handleCancel() {
    setState({ step: 'search' })
    setQuery('')
    setAlreadyCheckedIn(false)
  }

  // After student creation, reset to search — the student will appear once
  // React Query invalidation resolves
  function handleStudentCreated(_newId: string) {
    // After creation, student appears in search results once invalidation resolves
    setState({ step: 'search' })
    setQuery('')
    setStudentAdded(true)
    setTimeout(() => setStudentAdded(false), 4000)
  }

  return (
    <div className="px-5 py-4 flex flex-col gap-4">

      {/* Search / flow area */}
      {state.step === 'search' && (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setAlreadyCheckedIn(false)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder={t('dashboard.checkin.searchPlaceholder')}
              className="w-full h-9 rounded-md border border-border bg-background px-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            {/* Dropdown */}
            {showDropdown && filtered.length > 0 && (
              <ul className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                {filtered.map((student) => (
                  <li key={student.id}>
                    <button
                      type="button"
                      onMouseDown={() => selectStudent(student)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between"
                    >
                      <span>{student.name}</span>
                      {student.passType && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {student.passType.replace('_', ' ')}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
                {showAddStudentButton && (
                  <li>
                    <button
                      type="button"
                      onMouseDown={() => {
                        setState({ step: 'addStudent', searchQuery: query })
                        setShowDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-primary font-medium hover:bg-muted transition-colors border-t border-border"
                    >
                      {t('dashboard.checkin.addStudent')} "{query}"
                    </button>
                  </li>
                )}
              </ul>
            )}

            {/* Add student button when no results */}
            {showDropdown && query.trim().length >= 3 && filtered.length === 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                <button
                  type="button"
                  onMouseDown={() => {
                    setState({ step: 'addStudent', searchQuery: query })
                    setShowDropdown(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-primary font-medium hover:bg-muted transition-colors"
                >
                  {t('dashboard.checkin.addStudent')} "{query}"
                </button>
              </div>
            )}
          </div>

          {alreadyCheckedIn && (
            <p className="text-xs text-warning font-medium">{t('dashboard.checkin.alreadyCheckedIn')}</p>
          )}
          {studentAdded && (
            <p className="text-xs text-success font-medium">{t('dashboard.checkin.studentAdded')}</p>
          )}
        </div>
      )}

      {/* Pass flow — wraps PassFlowPanel to inject membership/classCard data */}
      {state.step === 'pass' && (
        <PassFlowWithData
          session={session}
          student={state.student}
          pricingConfig={pricingConfig}
          onConfirm={(combination, notes, memberships, classCards) =>
            handleConfirmFromPassFlow(state.student, combination, notes, memberships, classCards)
          }
          onCancel={handleCancel}
        />
      )}

      {/* No-pass flow */}
      {state.step === 'noPass' && (
        <NoPassFlowPanel
          student={state.student}
          pricingConfig={pricingConfig}
          onConfirm={(combination, notes) =>
            handleConfirmSimple(state.student, combination, notes)
          }
          onCancel={handleCancel}
        />
      )}

      {/* Add student inline form */}
      {state.step === 'addStudent' && (
        <AddStudentInline
          initialName={state.searchQuery}
          onCreated={handleStudentCreated}
          onCancel={handleCancel}
        />
      )}

      {/* Party flow */}
      {state.step === 'party' && (
        <PartyFlowPanel
          student={state.student}
          onConfirm={(combination, notes) =>
            handleConfirmSimple(state.student, combination, notes)
          }
          onCancel={handleCancel}
        />
      )}

      {/* Checked-in list */}
      {activeRecords.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
            {t('dashboard.checkin.checkedInCount', { count: activeRecords.length })}
          </p>
          <ul className="flex flex-col gap-1">
            {activeRecords.map((record) => {
              const student = studentMap.get(record.studentId)
              return (
                <li key={record.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{student?.name ?? record.studentId}</span>
                  <span className="text-xs text-muted-foreground">
                    {record.combination.length > 0
                      ? record.combination.join(' + ')
                      : t('dashboard.checkin.partyAttendance')}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── PassFlowWithData — thin wrapper that loads memberships/cards for PassFlowPanel ──

interface PassFlowWithDataProps {
  session: ClassSession
  student: Student
  pricingConfig: PricingConfig | null
  onConfirm: (
    combination: CombinationToken[],
    notes: string,
    memberships: import('../../types').Membership[],
    classCards: import('../../types').ClassCard[],
  ) => Promise<void>
  onCancel: () => void
}

function PassFlowWithData({ session, student, pricingConfig, onConfirm, onCancel }: PassFlowWithDataProps) {
  const { data: memberships = [] } = useMembershipsByStudent(student.id)
  const { data: classCards = [] } = useClassCardsByStudent(student.id)

  return (
    <PassFlowPanel
      session={session}
      student={student}
      pricingConfig={pricingConfig}
      onConfirm={(combination, notes) => onConfirm(combination, notes, memberships, classCards)}
      onCancel={onCancel}
    />
  )
}
