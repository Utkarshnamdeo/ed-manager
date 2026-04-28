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
import type { ClassSession, Student, Teacher, Room, ClassTemplate } from '../types'

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

/* ─── Pass Badge ──────────────────────────────────────────── */

const PASS_CLASS: Record<string, string> = {
  gold:       'badge-gold',
  silver:     'badge-silver',
  bronze:     'badge-bronze',
  ten_class:  'badge-silver',
  five_class: 'badge-bronze',
}

const PASS_LABEL: Record<string, string> = {
  gold:       'Gold',
  silver:     'Silver',
  bronze:     'Bronze',
  ten_class:  '10-Class',
  five_class: '5-Class',
}

function PassBadge({ passType }: { passType: string | null }) {
  if (!passType) return <span className="inline-flex items-center py-[0.15rem] px-2 rounded-full text-[0.6875rem] font-semibold bg-muted text-muted-foreground">No pass</span>
  return (
    <span className={`inline-flex items-center py-[0.15rem] px-2 rounded-full text-[0.6875rem] font-semibold whitespace-nowrap ${PASS_CLASS[passType] ?? 'bg-muted text-muted-foreground'}`}>
      {PASS_LABEL[passType] ?? passType}
    </span>
  )
}

/* ─── Student Row ─────────────────────────────────────────── */

interface StudentRowProps {
  student: Student
  isCheckedIn: boolean
  onCheckIn: () => void
  locked: boolean
}

function StudentRow({ student, isCheckedIn, onCheckIn, locked }: StudentRowProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-border transition-[background-color] duration-150 min-h-[52px] ${isCheckedIn ? 'bg-[oklch(0.97_0.02_145)]' : 'bg-transparent'}`}>
      <Avatar name={student.name} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis ${isCheckedIn ? 'font-semibold' : ''}`}>
          {student.name}
        </div>
        <div className="mt-[2px]">
          <PassBadge passType={student.passType} />
        </div>
      </div>
      {!locked && (
        <button
          onClick={onCheckIn}
          className="text-[0.8125rem] font-semibold px-3 py-1.5 rounded-[0.5rem] bg-primary text-primary-foreground border-0 cursor-pointer"
        >
          Check in
        </button>
      )}
      {isCheckedIn && (
        <span className="text-[0.75rem] font-semibold text-success px-2 py-1 rounded-full bg-success/10">✓</span>
      )}
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

function SessionCard({ session, teacher, room, template, studentMap, markedById }: SessionCardProps) {
  const { t } = useTranslation('attendance')
  const { data: pricingConfig } = usePricingConfig()
  const { data: records = [] } = useAttendanceRecordsBySession(session.id)
  const createRecord = useCreateAttendanceRecord()
  const createStudent = useCreateStudent()

  const [expanded, setExpanded] = useState(session.status === 'active')
  const [pendingStudent, setPendingStudent] = useState<Student | null>(null)
  const [rosterSearch, setRosterSearch] = useState('')
  const [showDropIn, setShowDropIn] = useState(false)
  const [dropInSearch, setDropInSearch] = useState('')
  const [extraRosterIds, setExtraRosterIds] = useState<string[]>([])

  const regularIds = template?.regularStudentIds ?? []
  const checkedInIds = records.map((r) => r.studentId)
  const rosterIds = [...new Set([...regularIds, ...checkedInIds, ...extraRosterIds])]
  const roster = rosterIds.map((id) => studentMap[id]).filter(Boolean)

  const recordMap = Object.fromEntries(records.map((r) => [r.studentId, r]))

  const checkedInCount = records.length
  const isCancelled = session.status === 'cancelled'

  const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : '—'
  const roomName = room?.name ?? '—'
  const timeLabel = `${session.startTime}–${session.endTime}`

  function handlePickerConfirm(result: {
    combination: import('../types').AttendanceCombination
    estimatedValue: number
    membershipId: string | null
    classCardId: string | null
    passSnapshot: import('../types').AttendanceRecord['passSnapshot']
  }) {
    if (!pendingStudent) return
    createRecord.mutate({
      sessionId: session.id,
      studentId: pendingStudent.id,
      combination: result.combination,
      membershipId: result.membershipId,
      classCardId: result.classCardId,
      passSnapshot: result.passSnapshot,
      estimatedValue: result.estimatedValue,
      shortfall: false,
      shortfallAmount: null,
      notes: null,
      markedBy: markedById,
      active: true,
    })
    setPendingStudent(null)
  }

  async function handleDropInSelect(studentId: string) {
    setExtraRosterIds((prev) => [...new Set([...prev, studentId])])
    setShowDropIn(false)
    setDropInSearch('')
  }

  async function handleDropInCreate(name: string) {
    const newId = await createStudent.mutateAsync({
      name: name.trim(),
      email: null,
      phone: null,
      notes: null,
      activePassId: null,
      passType: null,
      active: true,
    })
    setExtraRosterIds((prev) => [...new Set([...prev, newId])])
    setShowDropIn(false)
    setDropInSearch('')
  }

  const dropInSuggestions = Object.values(studentMap).filter((s) => {
    if (rosterIds.includes(s.id)) return false
    if (!dropInSearch.trim()) return false
    return s.name.toLowerCase().includes(dropInSearch.toLowerCase())
  })

  const filteredRoster = roster.filter((student) => {
    if (rosterSearch) {
      if (!student.name.toLowerCase().includes(rosterSearch.toLowerCase())) return false
    }
    return true
  })

  return (
    <div className={`bg-card border border-border rounded-[0.875rem] overflow-hidden border-l-4 ${session.status === 'active' ? 'border-l-primary' : 'border-l-transparent'} ${session.status === 'completed' ? 'opacity-75' : ''}`}>

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
          {checkedInCount} <span className="font-normal text-muted-foreground">/ {roster.length}</span>
        </div>
        {!isCancelled && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            className={`text-muted-foreground shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : 'rotate-0'}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {/* Expanded: roster */}
      {expanded && !isCancelled && (
        <div className="border-t border-border">
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
          </div>

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
                  isCheckedIn={!!record}
                  onCheckIn={() => setPendingStudent(student)}
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
                      {s.name}
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

          <div className="flex items-center justify-between px-4 py-2.5 bg-muted border-t border-border">
            <span className="text-xs text-muted-foreground font-medium">
              {roster.length} on roster · {checkedInCount} checked in
            </span>
          </div>
        </div>
      )}

      {/* Combination picker dialog */}
      {pendingStudent && (
        <CombinationPickerDialog
          student={pendingStudent}
          session={session}
          pricingConfig={pricingConfig ?? null}
          onConfirm={handlePickerConfirm}
          onClose={() => setPendingStudent(null)}
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

      {isLoading && (
        <div className="py-10 text-center text-muted-foreground text-sm">Loading…</div>
      )}

      {isError && (
        <div className="py-10 text-center text-destructive text-sm">
          {t('errors.failedToLoad')}
        </div>
      )}

      {!isLoading && !isError && sessions.length === 0 && (
        <div className="py-10 text-center text-muted-foreground text-sm">
          {t('noSessions')}
        </div>
      )}

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
