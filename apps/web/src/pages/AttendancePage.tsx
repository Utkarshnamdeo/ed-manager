import { useState } from 'react'
import { addDays, format, isToday } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useClassSessionsByDate } from '../hooks/useClassSessions'
import { useStudents, useCreateStudent } from '../hooks/useStudents'
import { useTeachers } from '../hooks/useTeachers'
import { useRooms } from '../hooks/useRooms'
import { useClassTemplates } from '../hooks/useClassTemplates'
import { useAttendanceRecordsBySession } from '../hooks/useAttendanceRecords'
import { useCreateAttendanceRecord } from '../hooks/useAttendanceRecords'
import { usePricingConfig } from '../hooks/usePricingConfig'
import { useAuth } from '../contexts/AuthContext'
import { CombinationPickerDialog } from '../features/attendance/CombinationPickerDialog'
import type { ClassSession, Student, Teacher, Room, AttendanceStatus, ClassTemplate, AttendanceCombination, AttendanceRecord } from '../types'

/* ─── Avatar ─────────────────────────────────────────────── */

const AVATAR_HUE_CLASSES = [
  'avatar-h-0','avatar-h-1','avatar-h-2','avatar-h-3',
  'avatar-h-4','avatar-h-5','avatar-h-6','avatar-h-7',
]

function nameHash(name: string): number {
  let h = 0
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return Math.abs(h)
}

function Avatar({ name }: { name: string }) {
  const hueClass = AVATAR_HUE_CLASSES[nameHash(name) % 8]
  const initials = name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  return (
    <div
      aria-hidden="true"
      className={`size-8 rounded-full flex items-center justify-center font-bold shrink-0 tracking-[-0.01em] select-none text-[0.6875rem] ${hueClass}`}
    >
      {initials}
    </div>
  )
}

/* ─── Membership Badge ────────────────────────────────────── */

const TIER_CLASS: Record<string, string> = {
  gold:   'badge-gold',
  silver: 'badge-silver',
  bronze: 'badge-bronze',
}

function MembershipBadge({ tier }: { tier: string | null }) {
  if (!tier) return <span className="inline-flex items-center py-[0.15rem] px-2 rounded-full text-[0.6875rem] font-semibold bg-muted text-muted-foreground">No pass</span>
  return (
    <span className={`inline-flex items-center py-[0.15rem] px-2 rounded-full text-[0.6875rem] font-semibold whitespace-nowrap capitalize ${TIER_CLASS[tier] ?? 'bg-muted text-muted-foreground'}`}>
      {tier}
    </span>
  )
}

/* ─── Check-in Button Group ───────────────────────────────── */

const STATUS_BUTTON_CLASSES: Record<AttendanceStatus, { selected: string; unselected: string }> = {
  present: { selected: 'bg-success text-success-foreground border-0',    unselected: 'bg-card text-muted-foreground border border-border' },
  late:    { selected: 'bg-warning text-warning-foreground border-0',     unselected: 'bg-card text-muted-foreground border border-border' },
  absent:  { selected: 'bg-muted text-foreground-secondary border-0',     unselected: 'bg-card text-muted-foreground border border-border' },
  trial:   { selected: 'bg-secondary text-secondary-foreground border-0', unselected: 'bg-card text-muted-foreground border border-border' },
}

const STATUS_BUTTON_LABELS: Record<AttendanceStatus, { label: string; title: string }> = {
  present: { label: '✓', title: 'Present' },
  late:    { label: 'L', title: 'Late' },
  absent:  { label: '—', title: 'Absent' },
  trial:   { label: 'T', title: 'Trial' },
}

/* ─── Student Row ─────────────────────────────────────────── */

interface StudentRowProps {
  student: Student
  currentStatus: AttendanceStatus | null
  onStatusClick: (s: AttendanceStatus) => void
  locked: boolean
}

function StudentRow({ student, currentStatus, onStatusClick, locked }: StudentRowProps) {
  const rowBgClass =
    currentStatus === 'present' ? 'bg-[oklch(0.97_0.02_145)]' :
    currentStatus === 'late'    ? 'bg-[oklch(0.98_0.02_85)]'  :
    'bg-transparent'

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-border transition-[background-color] duration-150 min-h-[52px] ${rowBgClass}`}>
      <Avatar name={`${student.firstName} ${student.lastName}`} />

      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis ${currentStatus ? 'font-semibold' : ''}`}>
          {student.firstName} {student.lastName}
        </div>
        <div className="mt-[2px]">
          <MembershipBadge tier={student.membershipTier} />
        </div>
      </div>

      {/* Check-in buttons */}
      <div className="flex gap-1 shrink-0" role="group" aria-label="Check-in status">
        {(Object.keys(STATUS_BUTTON_LABELS) as AttendanceStatus[]).map((status) => {
          const isSelected = currentStatus === status
          const isDimmed = currentStatus !== null && !isSelected
          const { label, title } = STATUS_BUTTON_LABELS[status]
          const cls = STATUS_BUTTON_CLASSES[status]
          return (
            <button
              key={status}
              title={title}
              aria-label={title}
              aria-pressed={isSelected}
              disabled={locked && !isSelected}
              onClick={() => onStatusClick(status)}
              className={`size-8 rounded-[6px] text-xs font-bold flex items-center justify-center transition-[background-color,opacity,border-color] duration-[120ms] cursor-pointer ${isSelected ? cls.selected : cls.unselected} ${isDimmed ? 'opacity-35' : ''} ${locked && !isSelected ? 'cursor-not-allowed' : ''}`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Session Card ────────────────────────────────────────── */

const STATUS_DOT_CLASS: Record<string, string> = {
  active:    'bg-success',
  planned:   'bg-warning',
  completed: 'bg-muted-foreground',
  cancelled: 'bg-destructive',
}

interface SessionCardProps {
  session: ClassSession
  teacher: Teacher | undefined
  room: Room | undefined
  template: ClassTemplate | undefined
  studentMap: Record<string, Student>
  markedById: string
}

interface PendingCheckIn {
  student: Student
  status: AttendanceStatus
}

function SessionCard({ session, teacher, room, template, studentMap, markedById }: SessionCardProps) {
  const { t } = useTranslation('attendance')
  const { data: pricingConfig } = usePricingConfig()
  const { data: records = [] } = useAttendanceRecordsBySession(session.id)
  const createRecord = useCreateAttendanceRecord()
  const createStudent = useCreateStudent()

  const [expanded, setExpanded] = useState(session.status === 'active')
  const [pending, setPending] = useState<PendingCheckIn | null>(null)
  const [rosterSearch, setRosterSearch] = useState('')
  const [rosterFilter, setRosterFilter] = useState<'all' | 'unchecked' | 'present'>('all')
  const [showDropIn, setShowDropIn] = useState(false)
  const [dropInSearch, setDropInSearch] = useState('')
  const [extraRosterIds, setExtraRosterIds] = useState<string[]>([])

  // Build roster: template regulars + any drop-ins already checked in + manually added
  const regularIds = template?.regularStudentIds ?? []
  const checkedInIds = records.map((r) => r.studentId)
  const rosterIds = [...new Set([...regularIds, ...checkedInIds, ...extraRosterIds])]
  const roster = rosterIds.map((id) => studentMap[id]).filter(Boolean)

  // Map studentId → attendance record
  const recordMap = Object.fromEntries(records.map((r) => [r.studentId, r]))

  // Counts
  const presentCount = records.filter((r) => r.status === 'present').length
  const checkedInCount = records.length
  const isActive = session.status === 'active'
  const isCancelled = session.status === 'cancelled'

  const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : '—'
  const roomName = room?.name ?? '—'
  const timeLabel = `${session.startTime}–${session.endTime}`

  function handleStatusClick(student: Student, status: AttendanceStatus) {
    if (recordMap[student.id]) return // already checked in, immutable

    if (status === 'absent') {
      // Direct write — no combination needed
      createRecord.mutate({
        sessionId: session.id,
        studentId: student.id,
        status: 'absent',
        combination: [],
        membershipId: null,
        membershipSnapshot: null,
        cashAmount: null,
        cashDefault: pricingConfig?.dropInCashRate ?? null,
        estimatedValue: 0,
        shortfall: false,
        shortfallAmount: null,
        markedBy: markedById,
      })
      return
    }

    // present / late / trial → open combination picker
    setPending({ student, status })
  }

  function handlePickerConfirm(result: {
    combination: AttendanceCombination
    cashAmount: number | null
    estimatedValue: number
    membershipId: string | null
    membershipSnapshot: AttendanceRecord['membershipSnapshot']
  }) {
    if (!pending) return
    createRecord.mutate({
      sessionId: session.id,
      studentId: pending.student.id,
      status: pending.status,
      combination: result.combination,
      membershipId: result.membershipId,
      membershipSnapshot: result.membershipSnapshot,
      cashAmount: result.cashAmount,
      cashDefault: pricingConfig?.dropInCashRate ?? null,
      estimatedValue: result.estimatedValue,
      shortfall: false,
      shortfallAmount: null,
      markedBy: markedById,
    })
    setPending(null)
  }

  async function handleDropInSelect(studentId: string) {
    setExtraRosterIds((prev) => [...new Set([...prev, studentId])])
    setShowDropIn(false)
    setDropInSearch('')
  }

  async function handleDropInCreate(name: string) {
    const parts = name.trim().split(/\s+/)
    const firstName = parts[0] ?? name.trim()
    const lastName = parts.slice(1).join(' ') || ''
    const newId = await createStudent.mutateAsync({ firstName, lastName, email: null, phone: null, notes: null, activeMembershipId: null, membershipTier: null, active: true })
    setExtraRosterIds((prev) => [...new Set([...prev, newId])])
    setShowDropIn(false)
    setDropInSearch('')
  }

  // Drop-in suggestions: all students not already on roster
  const dropInSuggestions = Object.values(studentMap).filter((s) => {
    if (rosterIds.includes(s.id)) return false
    if (!dropInSearch.trim()) return false
    const full = `${s.firstName} ${s.lastName}`.toLowerCase()
    return full.includes(dropInSearch.toLowerCase())
  })

  // Filtered roster
  const filteredRoster = roster.filter((student) => {
    const record = recordMap[student.id]
    if (rosterFilter === 'unchecked' && record) return false
    if (rosterFilter === 'present' && record?.status !== 'present') return false
    if (rosterSearch) {
      const name = `${student.firstName} ${student.lastName}`.toLowerCase()
      if (!name.includes(rosterSearch.toLowerCase())) return false
    }
    return true
  })

  return (
    <div className={`bg-card border border-border rounded-[0.875rem] overflow-hidden border-l-4 ${isActive ? 'border-l-primary' : 'border-l-transparent'} ${session.status === 'completed' ? 'opacity-75' : ''}`}>

      {/* Card Header */}
      <button
        onClick={() => !isCancelled && setExpanded((e) => !e)}
        disabled={isCancelled}
        className={`flex items-center w-full px-4 py-3.5 bg-transparent border-0 gap-2.5 text-left ${isCancelled ? 'cursor-default' : 'cursor-pointer'}`}
      >
        <div className={`size-2 rounded-full shrink-0 ${STATUS_DOT_CLASS[session.status] ?? 'bg-muted-foreground'}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[0.9375rem] font-bold text-foreground tracking-[-0.01em] ${isCancelled ? 'line-through' : ''}`}>
              {session.name}
            </span>
            {session.isSpecial && (
              <span className="text-[0.6875rem] font-semibold px-2 py-[0.15rem] rounded-full bg-warning-subtle text-[oklch(0.50_0.14_85)] capitalize">
                {session.type}
              </span>
            )}
          </div>
          <div className="text-[0.8125rem] text-muted-foreground mt-[2px]">
            {timeLabel} · {teacherName} · {roomName}
          </div>
        </div>

        <div className={`text-[0.8125rem] font-semibold shrink-0 text-right ${checkedInCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
          {presentCount} <span className="font-normal text-muted-foreground">/ {roster.length}</span>
        </div>

        {!isCancelled && (
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
      {expanded && !isCancelled && (
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
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Search students…"
                className="form-input w-full pl-7 text-[0.8125rem] rounded-md"
              />
            </div>
            <div className="flex gap-1 shrink-0">
              {(['all', 'unchecked', 'present'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setRosterFilter(f)}
                  className={`text-[0.6875rem] font-semibold px-2.5 py-1 rounded-full cursor-pointer whitespace-nowrap border-0 capitalize ${
                    rosterFilter === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground border border-border'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Student rows */}
          {filteredRoster.length === 0 ? (
            <div className="px-4 py-6 text-center text-muted-foreground text-sm">
              {roster.length === 0 ? 'No students on roster yet.' : 'No students match the filter.'}
            </div>
          ) : (
            filteredRoster.map((student) => {
              const record = recordMap[student.id]
              return (
                <StudentRow
                  key={student.id}
                  student={student}
                  currentStatus={record?.status ?? null}
                  onStatusClick={(s) => handleStatusClick(student, s)}
                  locked={!!record}
                />
              )
            })
          )}

          {/* Drop-in panel */}
          {showDropIn ? (
            <div className="px-4 py-3 border-t border-border bg-background">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  autoFocus
                  value={dropInSearch}
                  onChange={(e) => setDropInSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { setShowDropIn(false); setDropInSearch('') }
                    if (e.key === 'Enter' && dropInSearch.trim() && dropInSuggestions.length === 0) {
                      handleDropInCreate(dropInSearch)
                    }
                  }}
                  placeholder={t('dropIn.search')}
                  className="form-input w-full pl-8 text-[0.8125rem]"
                />
              </div>
              {dropInSearch.trim() && (
                <div className="mt-1.5 flex flex-col border border-border rounded-[0.5rem] overflow-hidden">
                  {dropInSuggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleDropInSelect(s.id)}
                      className="text-left px-3 py-2 text-sm text-foreground hover:bg-muted bg-card border-0 cursor-pointer border-b border-border last:border-b-0"
                    >
                      {s.firstName} {s.lastName}
                      {s.email && <span className="ml-2 text-xs text-muted-foreground">{s.email}</span>}
                    </button>
                  ))}
                  <button
                    onClick={() => handleDropInCreate(dropInSearch)}
                    disabled={createStudent.isPending}
                    className="text-left px-3 py-2 text-sm text-primary hover:bg-muted bg-card border-0 cursor-pointer font-medium"
                  >
                    {createStudent.isPending ? '…' : `${t('dropIn.createNew')} "${dropInSearch}"`}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 py-2 border-t border-border">
              <button
                onClick={() => setShowDropIn(true)}
                className="text-[0.8125rem] font-medium text-primary bg-transparent border-0 cursor-pointer hover:underline px-0"
              >
                {t('addDropIn')}
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted border-t border-border">
            <span className="text-xs text-muted-foreground font-medium">
              {roster.length} on roster · {presentCount} present · {checkedInCount - presentCount} other · {roster.length - checkedInCount} unchecked
            </span>
          </div>
        </div>
      )}

      {/* Combination picker dialog */}
      {pending && (
        <CombinationPickerDialog
          student={pending.student}
          session={session}
          status={pending.status}
          pricingConfig={pricingConfig ?? null}
          onConfirm={handlePickerConfirm}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  )
}

/* ─── Attendance Page ─────────────────────────────────────── */

export function AttendancePage() {
  const { t } = useTranslation('attendance')
  const { appUser } = useAuth()
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const { data: sessions = [], isLoading, isError } = useClassSessionsByDate(selectedDate)
  const { data: students = [] } = useStudents()
  const { data: teachers = [] } = useTeachers()
  const { data: rooms = [] } = useRooms()
  const { data: templates = [] } = useClassTemplates()

  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]))
  const teacherMap = Object.fromEntries(teachers.map((tc) => [tc.id, tc]))
  const roomMap = Object.fromEntries(rooms.map((r) => [r.id, r]))
  const templateMap = Object.fromEntries(templates.map((tmpl) => [tmpl.id, tmpl]))

  const dateLabel = isToday(selectedDate)
    ? `Today, ${format(selectedDate, 'MMMM d')}`
    : format(selectedDate, 'EEEE, MMMM d')

  const sessionCount = sessions.length
  const activeCount = sessions.filter((s) => s.status === 'active').length

  return (
    <div className="page-enter p-7 flex flex-col gap-4">

      {/* Date navigation header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-[0.75rem]">
        <button
          onClick={() => setSelectedDate((d) => addDays(d, -1))}
          aria-label="Previous day"
          className="size-8 flex items-center justify-center rounded-[0.5rem] border border-border hover:bg-muted transition-colors cursor-pointer bg-card shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <span className="text-[0.9375rem] font-bold text-foreground tracking-[-0.01em] flex-1 text-center">
          {dateLabel}
        </span>

        <button
          onClick={() => setSelectedDate((d) => addDays(d, 1))}
          aria-label="Next day"
          className="size-8 flex items-center justify-center rounded-[0.5rem] border border-border hover:bg-muted transition-colors cursor-pointer bg-card shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <span className="text-[0.8125rem] text-muted-foreground font-medium shrink-0 ml-2">
          {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}{activeCount > 0 ? ` · ${activeCount} active` : ''}
        </span>
      </div>

      {/* Loading / error states */}
      {isLoading && (
        <div className="py-10 text-center text-muted-foreground text-sm">Loading…</div>
      )}

      {isError && (
        <div className="py-10 text-center text-destructive text-sm">
          {t('errors.failedToLoad')}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && sessions.length === 0 && (
        <div className="py-10 text-center text-muted-foreground text-sm">
          {t('noSessions')}
        </div>
      )}

      {/* Session cards */}
      {!isLoading && sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          teacher={teacherMap[session.teacherId]}
          room={roomMap[session.roomId]}
          template={session.templateId ? templateMap[session.templateId] : undefined}
          studentMap={studentMap}
          markedById={appUser?.uid ?? ''}
        />
      ))}
    </div>
  )
}
