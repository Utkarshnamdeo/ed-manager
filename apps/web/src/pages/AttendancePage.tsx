import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AttendanceStatus } from '../types'

/* ─── Avatar ── */

const AVATAR_HUE_CLASSES = ['avatar-h-0', 'avatar-h-1', 'avatar-h-2', 'avatar-h-3', 'avatar-h-4', 'avatar-h-5', 'avatar-h-6', 'avatar-h-7']

function nameHash(name: string): number {
  let h = 0
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return Math.abs(h)
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const hueClass = AVATAR_HUE_CLASSES[nameHash(name) % 8]
  const initials = name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  const sizeClass = size <= 32 ? 'size-8 text-[0.6875rem]' : 'size-12 text-sm'

  return (
    <div
      aria-hidden="true"
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold shrink-0 tracking-[-0.01em] select-none ${hueClass}`}
    >
      {initials}
    </div>
  )
}

/* ─── Membership Badge ── */

type Tier = 'gold' | 'silver' | 'bronze' | 'trial' | 'drop-in' | 'usc'

const TIER_LABEL: Record<Tier, string> = {
  gold:      'Gold',
  silver:    'Silver',
  bronze:    'Bronze',
  trial:     'Trial',
  'drop-in': 'Drop-in',
  usc:       'USC',
}

const TIER_CLASS: Record<Tier, string> = {
  gold:      'badge-gold',
  silver:    'badge-silver',
  bronze:    'badge-bronze',
  trial:     'bg-secondary-subtle text-secondary',
  'drop-in': 'bg-muted text-muted-foreground',
  usc:       'badge-usc',
}

function MembershipBadge({ tier, credits }: { tier: Tier; credits?: number | null }) {
  const lowCredit = typeof credits === 'number' && credits <= 2
  const badgeClass = lowCredit && credits === 1
    ? 'bg-warning-subtle text-[oklch(0.50_0.14_85)]'
    : lowCredit && credits === 0
    ? 'bg-destructive-subtle text-destructive'
    : TIER_CLASS[tier]

  return (
    <span className={`inline-flex items-center gap-1 py-[0.15rem] px-2 rounded-full text-[0.6875rem] font-semibold whitespace-nowrap ${badgeClass}`}>
      {TIER_LABEL[tier]}
      {typeof credits === 'number' && tier !== 'gold' && <> · {credits}</>}
    </span>
  )
}

/* ─── Check-in Button Group ── */

const STATUS_CLASSES: Record<AttendanceStatus, { selected: string; unselected: string }> = {
  present: { selected: 'bg-success text-success-foreground border-0',           unselected: 'bg-card text-muted-foreground border border-border' },
  late:    { selected: 'bg-warning text-warning-foreground border-0',            unselected: 'bg-card text-muted-foreground border border-border' },
  absent:  { selected: 'bg-muted text-foreground-secondary border-0',            unselected: 'bg-card text-muted-foreground border border-border' },
  trial:   { selected: 'bg-secondary text-secondary-foreground border-0',        unselected: 'bg-card text-muted-foreground border border-border' },
}

const STATUS_LABELS: Record<AttendanceStatus, { label: string; title: string }> = {
  present: { label: '✓', title: 'Present' },
  late:    { label: 'L', title: 'Late' },
  absent:  { label: '—', title: 'Absent' },
  trial:   { label: 'T', title: 'Trial' },
}

function CheckInButtons({
  studentId,
  current,
  onChange,
}: {
  studentId: string
  current: AttendanceStatus | null
  onChange: (id: string, status: AttendanceStatus) => void
}) {
  return (
    <div className="flex gap-1 shrink-0" role="group" aria-label="Check-in status">
      {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((status) => {
        const isSelected = current === status
        const isDimmed = current !== null && !isSelected
        const { label, title } = STATUS_LABELS[status]
        const classes = STATUS_CLASSES[status]
        return (
          <button
            key={status}
            title={title}
            aria-label={title}
            aria-pressed={isSelected}
            onClick={() => onChange(studentId, status)}
            className={`size-8 rounded-[6px] text-xs font-bold flex items-center justify-center transition-[background-color,opacity,border-color] duration-[120ms] cursor-pointer ${isSelected ? classes.selected : classes.unselected} ${isDimmed ? 'opacity-35' : ''}`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Student Row ── */

interface MockStudent {
  id: string
  name: string
  tier: Tier
  credits: number | null
}

function StudentRow({
  student,
  status,
  onStatusChange,
}: {
  student: MockStudent
  status: AttendanceStatus | null
  onStatusChange: (id: string, s: AttendanceStatus) => void
}) {
  const isCheckedIn = status !== null
  const rowBgClass = status === 'present'
    ? 'bg-[oklch(0.97_0.02_145)]'
    : status === 'late'
    ? 'bg-[oklch(0.98_0.02_85)]'
    : 'bg-transparent'

  const creditColor = typeof student.credits === 'number' && student.credits <= 1
    ? 'text-destructive'
    : student.credits === 2
    ? 'text-[oklch(0.52_0.14_85)]'
    : 'text-muted-foreground'

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-border transition-[background-color] duration-150 min-h-[52px] ${rowBgClass}`}>
      <Avatar name={student.name} size={32} />

      <div className="flex-1 min-w-0">
        <div className={`text-sm ${isCheckedIn ? 'font-semibold' : 'font-medium'} text-foreground whitespace-nowrap overflow-hidden text-ellipsis`}>
          {student.name}
        </div>
        <div className="mt-[2px]">
          <MembershipBadge tier={student.tier} credits={student.credits} />
        </div>
      </div>

      {typeof student.credits === 'number' && student.tier !== 'gold' && (
        <div className={`text-xs font-medium shrink-0 min-w-[60px] text-right ${creditColor}`}>
          {student.credits === 0 ? 'Expired' : `${student.credits} left`}
        </div>
      )}

      <CheckInButtons studentId={student.id} current={status} onChange={onStatusChange} />
    </div>
  )
}

/* ─── Session Card ── */

interface MockSession {
  id: string
  name: string
  type?: string
  time: string
  teacher: string
  room: string
  status: 'active' | 'planned' | 'completed' | 'cancelled'
  capacity: number
  students: MockStudent[]
}

const STATUS_DOT_CLASS: Record<string, string> = {
  active:    'bg-success',
  planned:   'bg-warning',
  completed: 'bg-muted-foreground',
  cancelled: 'bg-destructive',
}

function SessionCard({
  session,
  defaultExpanded,
  checkIns,
  onCheckIn,
}: {
  session: MockSession
  defaultExpanded: boolean
  checkIns: Record<string, AttendanceStatus | null>
  onCheckIn: (studentId: string, status: AttendanceStatus) => void
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const checkedInCount = session.students.filter((s) => checkIns[s.id] !== null && checkIns[s.id] !== undefined).length
  const presentCount = session.students.filter((s) => checkIns[s.id] === 'present').length
  const isActive = session.status === 'active'

  return (
    <div className={`bg-card border border-border rounded-[0.875rem] overflow-hidden border-l-4 ${isActive ? 'border-l-primary' : 'border-l-transparent'} ${session.status === 'completed' ? 'opacity-75' : ''}`}>

      {/* Card Header */}
      <button
        onClick={() => session.status !== 'cancelled' && setExpanded((e) => !e)}
        disabled={session.status === 'cancelled'}
        className={`flex items-center w-full px-4 py-3.5 bg-transparent border-0 gap-2.5 text-left ${session.status === 'cancelled' ? 'cursor-default' : 'cursor-pointer'}`}
      >
        <div className={`size-2 rounded-full shrink-0 ${STATUS_DOT_CLASS[session.status]}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[0.9375rem] font-bold text-foreground tracking-[-0.01em] ${session.status === 'cancelled' ? 'line-through' : ''}`}>
              {session.name}
            </span>
            {session.type && (
              <span className="text-[0.6875rem] font-semibold px-2 py-[0.15rem] rounded-full bg-warning-subtle text-[oklch(0.50_0.14_85)]">
                {session.type}
              </span>
            )}
          </div>
          <div className="text-[0.8125rem] text-muted-foreground mt-[2px]">
            {session.time} · {session.teacher} · {session.room}
          </div>
        </div>

        <div className={`text-[0.8125rem] font-semibold shrink-0 text-right ${checkedInCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
          {presentCount} <span className="font-normal text-muted-foreground">/ {session.students.length}</span>
        </div>

        {session.status !== 'cancelled' && (
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            className={`text-muted-foreground shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : 'rotate-0'}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {/* Expanded: roster */}
      {expanded && (
        <div className="border-t border-border">
          {/* Search / filter bar */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted">
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground flex pointer-events-none">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search students…"
                className="form-input w-full pl-7 text-[0.8125rem] rounded-md"
              />
            </div>
            <div className="flex gap-1 shrink-0">
              {['All', 'Unchecked', 'Present'].map((f) => (
                <span
                  key={f}
                  className={`text-[0.6875rem] font-semibold px-2.5 py-1 rounded-full cursor-pointer whitespace-nowrap ${
                    f === 'All'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground border border-border'
                  }`}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Student rows */}
          {session.students.map((student) => (
            <StudentRow
              key={student.id}
              student={student}
              status={checkIns[student.id] ?? null}
              onStatusChange={onCheckIn}
            />
          ))}

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted border-t border-border">
            <span className="text-xs text-muted-foreground font-medium">
              {session.students.length} students · {presentCount} present · {checkedInCount - presentCount} other · {session.students.length - checkedInCount} unchecked
            </span>
            <button className="text-[0.8125rem] font-semibold text-primary bg-transparent border-0 cursor-pointer p-0">
              + Add Drop-in
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Attendance Page ── */

const MOCK_SESSIONS: MockSession[] = [
  {
    id: 's1',
    name: 'Bachata Beginner',
    time: '19:00–20:30',
    teacher: 'Maria Lopez',
    room: 'Room A',
    status: 'active',
    capacity: 20,
    students: [
      { id: 'st1', name: 'Ana Schmidt',  tier: 'silver', credits: 8 },
      { id: 'st2', name: 'Marco Bauer', tier: 'gold',   credits: null },
      { id: 'st3', name: 'Emma Reyes',  tier: 'bronze', credits: 2 },
    ],
  },
  {
    id: 's2',
    name: 'Kizomba Intermediate',
    time: '20:30–22:00',
    teacher: 'Carlos Ferreira',
    room: 'Room B',
    status: 'planned',
    capacity: 15,
    students: [
      { id: 'st4', name: 'Jonas Weber', tier: 'silver', credits: 3 },
      { id: 'st5', name: 'Mia Klein',   tier: 'gold',   credits: null },
    ],
  },
]

export function AttendancePage() {
  const { i18n } = useTranslation()
  const today = new Date()
  const formattedDate = today.toLocaleDateString(i18n.language, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const allStudentIds = MOCK_SESSIONS.flatMap((s) => s.students.map((st) => st.id))

  const [liveCheckIns, setLiveCheckIns] = useState<Record<string, AttendanceStatus | null>>(() => ({
    ...Object.fromEntries(allStudentIds.map((id) => [id, null as AttendanceStatus | null])),
    st2: 'present' as AttendanceStatus,
  }))

  function handleCheckIn(studentId: string, status: AttendanceStatus) {
    setLiveCheckIns((prev) => ({ ...prev, [studentId]: prev[studentId] === status ? null : status }))
  }

  const sessionCount = MOCK_SESSIONS.length
  const activeCount = MOCK_SESSIONS.filter((s) => s.status === 'active').length

  return (
    <div className="page-enter p-7 flex flex-col gap-4">

      {/* Date header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-[0.75rem]">
        <span className="text-[0.9375rem] font-bold text-foreground tracking-[-0.01em]">
          {formattedDate}
        </span>
        <span className="text-[0.8125rem] text-muted-foreground font-medium">
          {sessionCount} sessions · {activeCount} active
        </span>
      </div>

      {/* Session cards */}
      {MOCK_SESSIONS.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          defaultExpanded={session.status === 'active'}
          checkIns={liveCheckIns}
          onCheckIn={handleCheckIn}
        />
      ))}
    </div>
  )
}
