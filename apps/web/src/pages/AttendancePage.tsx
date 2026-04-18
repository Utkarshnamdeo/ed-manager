import { useState } from 'react'
import type { AttendanceStatus } from '../types'

/* ─── Avatar ───────────────────────────────────────────────────────────────── */

const AVATAR_HUES = [15, 45, 145, 200, 240, 285, 320, 355]

function nameHash(name: string): number {
  let h = 0
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return Math.abs(h)
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const hue = AVATAR_HUES[nameHash(name) % 8]
  const bg = `oklch(0.88 0.10 ${hue})`
  const color = `oklch(0.38 0.14 ${hue})`
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: '9999px',
        backgroundColor: bg,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size <= 32 ? '0.6875rem' : '0.875rem',
        fontWeight: 700,
        flexShrink: 0,
        letterSpacing: '-0.01em',
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  )
}

/* ─── Membership Badge ─────────────────────────────────────────────────────── */

type Tier = 'gold' | 'silver' | 'bronze' | 'trial' | 'drop-in' | 'usc'

const TIER_STYLES: Record<Tier, { bg: string; color: string; label: string }> = {
  gold:    { bg: 'oklch(0.96 0.06 85)',  color: 'oklch(0.55 0.14 85)',  label: 'Gold' },
  silver:  { bg: 'oklch(0.93 0.03 240)', color: 'oklch(0.45 0.06 240)', label: 'Silver' },
  bronze:  { bg: 'oklch(0.94 0.05 50)',  color: 'oklch(0.50 0.10 50)',  label: 'Bronze' },
  trial:   { bg: 'var(--color-secondary-subtle)', color: 'var(--color-secondary)', label: 'Trial' },
  'drop-in': { bg: 'var(--color-muted)', color: 'var(--color-muted-foreground)', label: 'Drop-in' },
  usc:     { bg: 'oklch(0.93 0.05 220)', color: 'oklch(0.45 0.14 220)', label: 'USC' },
}

function MembershipBadge({ tier, credits }: { tier: Tier; credits?: number | null }) {
  const s = TIER_STYLES[tier]
  const lowCredit = typeof credits === 'number' && credits <= 2

  const badgeBg = lowCredit && credits === 1
    ? 'var(--color-warning-subtle)'
    : lowCredit && credits === 0
    ? 'var(--color-destructive-subtle)'
    : s.bg

  const badgeColor = lowCredit && credits === 1
    ? 'oklch(0.50 0.14 85)'
    : lowCredit && credits === 0
    ? 'var(--color-destructive)'
    : s.color

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.15rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.6875rem',
        fontWeight: 600,
        backgroundColor: badgeBg,
        color: badgeColor,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
      {typeof credits === 'number' && tier !== 'gold' && (
        <> · {credits}</>
      )}
    </span>
  )
}

/* ─── Check-in Button Group ────────────────────────────────────────────────── */

const CHECKIN_BUTTONS: { status: AttendanceStatus; label: string; title: string; selectedBg: string; selectedColor: string }[] = [
  { status: 'present', label: '✓', title: 'Present', selectedBg: 'var(--color-success)', selectedColor: 'var(--color-success-foreground)' },
  { status: 'late',    label: 'L', title: 'Late',    selectedBg: 'var(--color-warning)', selectedColor: 'var(--color-warning-foreground)' },
  { status: 'absent',  label: '—', title: 'Absent',  selectedBg: 'var(--color-muted)',   selectedColor: 'var(--color-foreground-secondary)' },
  { status: 'trial',   label: 'T', title: 'Trial',   selectedBg: 'var(--color-secondary)', selectedColor: 'var(--color-secondary-foreground)' },
]

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
    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }} role="group" aria-label="Check-in status">
      {CHECKIN_BUTTONS.map(({ status, label, title, selectedBg, selectedColor }) => {
        const isSelected = current === status
        const isDimmed = current !== null && !isSelected
        return (
          <button
            key={status}
            title={title}
            aria-label={title}
            aria-pressed={isSelected}
            onClick={() => onChange(studentId, status)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: isSelected ? 'none' : '1px solid var(--color-border)',
              backgroundColor: isSelected ? selectedBg : 'var(--color-card)',
              color: isSelected ? selectedColor : 'var(--color-muted-foreground)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isDimmed ? 0.35 : 1,
              transition: 'background-color 0.12s, opacity 0.12s, border-color 0.12s',
              fontFamily: 'inherit',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Student Row ──────────────────────────────────────────────────────────── */

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
  const rowBg = status === 'present'
    ? 'oklch(0.97 0.02 145)'
    : status === 'late'
    ? 'oklch(0.98 0.02 85)'
    : 'transparent'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.625rem 1rem',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: rowBg,
        transition: 'background-color 0.15s',
        minHeight: '52px',
      }}
    >
      {/* Avatar */}
      <Avatar name={student.name} size={32} />

      {/* Name + badge */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.875rem',
            fontWeight: isCheckedIn ? 600 : 500,
            color: 'var(--color-foreground)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {student.name}
        </div>
        <div style={{ marginTop: '2px' }}>
          <MembershipBadge tier={student.tier} credits={student.credits} />
        </div>
      </div>

      {/* Credit info */}
      {typeof student.credits === 'number' && student.tier !== 'gold' && (
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: student.credits <= 1
              ? 'var(--color-destructive)'
              : student.credits === 2
              ? 'oklch(0.52 0.14 85)'
              : 'var(--color-muted-foreground)',
            flexShrink: 0,
            minWidth: '60px',
            textAlign: 'right',
          }}
        >
          {student.credits === 0 ? 'Expired' : `${student.credits} left`}
        </div>
      )}

      {/* Check-in buttons */}
      <CheckInButtons studentId={student.id} current={status} onChange={onStatusChange} />
    </div>
  )
}

/* ─── Session Card ─────────────────────────────────────────────────────────── */

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

const SESSION_STATUS_DOT: Record<string, string> = {
  active:    'var(--color-success)',
  planned:   'var(--color-warning)',
  completed: 'var(--color-muted-foreground)',
  cancelled: 'var(--color-destructive)',
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
  const leftBorderColor = isActive ? 'var(--color-primary)' : 'transparent'

  return (
    <div
      style={{
        backgroundColor: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderLeft: `4px solid ${leftBorderColor}`,
        borderRadius: '0.875rem',
        overflow: 'hidden',
        opacity: session.status === 'completed' ? 0.75 : 1,
      }}
    >
      {/* Card Header */}
      <button
        onClick={() => session.status !== 'cancelled' && setExpanded((e) => !e)}
        disabled={session.status === 'cancelled'}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '0.875rem 1rem',
          background: 'none',
          border: 'none',
          cursor: session.status === 'cancelled' ? 'default' : 'pointer',
          gap: '0.625rem',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        {/* Status dot */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '9999px',
            backgroundColor: SESSION_STATUS_DOT[session.status],
            flexShrink: 0,
          }}
        />

        {/* Session name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.9375rem',
                fontWeight: 700,
                color: 'var(--color-foreground)',
                letterSpacing: '-0.01em',
                textDecoration: session.status === 'cancelled' ? 'line-through' : 'none',
              }}
            >
              {session.name}
            </span>
            {session.type && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--color-warning-subtle)',
                  color: 'oklch(0.50 0.14 85)',
                }}
              >
                {session.type}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted-foreground)', marginTop: '2px' }}>
            {session.time} · {session.teacher} · {session.room}
          </div>
        </div>

        {/* Attendance summary */}
        <div
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: checkedInCount > 0 ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
            flexShrink: 0,
            textAlign: 'right',
          }}
        >
          {presentCount} <span style={{ fontWeight: 400, color: 'var(--color-muted-foreground)' }}>/ {session.students.length}</span>
        </div>

        {/* Chevron */}
        {session.status !== 'cancelled' && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{
              color: 'var(--color-muted-foreground)',
              flexShrink: 0,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {/* Expanded: roster */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--color-border)' }}>
          {/* Search / filter bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 1rem',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-muted)',
            }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <span
                style={{
                  position: 'absolute',
                  left: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-muted-foreground)',
                  display: 'flex',
                  pointerEvents: 'none',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search students…"
                style={{
                  width: '100%',
                  padding: '0.375rem 0.625rem 0.375rem 1.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-card)',
                  color: 'var(--color-foreground)',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              {['All', 'Unchecked', 'Present'].map((f) => (
                <span
                  key={f}
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.625rem',
                    borderRadius: '9999px',
                    backgroundColor: f === 'All' ? 'var(--color-primary)' : 'var(--color-card)',
                    color: f === 'All' ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)',
                    border: f === 'All' ? 'none' : '1px solid var(--color-border)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.625rem 1rem',
              backgroundColor: 'var(--color-muted)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)', fontWeight: 500 }}>
              {session.students.length} students · {presentCount} present · {checkedInCount - presentCount} other · {session.students.length - checkedInCount} unchecked
            </span>
            <button
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'inherit',
              }}
            >
              + Add Drop-in
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Attendance Page ──────────────────────────────────────────────────────── */

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
  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-GB', {
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
    <div className="page-enter" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Date header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.75rem',
        }}
      >
        <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-foreground)', letterSpacing: '-0.01em' }}>
          {formattedDate}
        </span>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted-foreground)', fontWeight: 500 }}>
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
