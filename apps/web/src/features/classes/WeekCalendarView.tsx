import { useState } from 'react'
import { startOfWeek, endOfWeek, addWeeks, addDays, format, isSameDay, isToday } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useClassSessionsByDateRange } from '../../hooks/useClassSessions'
import { useTeachers } from '../../hooks/useTeachers'
import { useRooms } from '../../hooks/useRooms'
import { SessionCalendarCard } from './SessionCalendarCard'
import { EditSessionDialog } from './EditSessionDialog'
import { CreateSessionDialog } from './CreateSessionDialog'
import type { ClassSession } from '../../types'

interface WeekCalendarViewProps {
  canManage: boolean
}

export function WeekCalendarView({ canManage }: WeekCalendarViewProps) {
  const { t } = useTranslation('classes')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [editSession, setEditSession] = useState<ClassSession | null>(null)
  const [createForDate, setCreateForDate] = useState<Date | null>(null)

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

  const { data: sessions, isLoading } = useClassSessionsByDateRange(weekStart, weekEnd)
  const { data: teachers } = useTeachers()
  const { data: rooms } = useRooms()

  const teacherMap = Object.fromEntries((teachers ?? []).map((tc) => [tc.id, tc]))
  const roomMap = Object.fromEntries((rooms ?? []).map((r) => [r.id, r]))

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`

  const totalSessions = (sessions ?? []).length

  function goToPrevWeek() {
    setWeekStart((prev) => addWeeks(prev, -1))
  }

  function goToNextWeek() {
    setWeekStart((prev) => addWeeks(prev, 1))
  }

  function goToToday() {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  function getSessionsForDay(day: Date): ClassSession[] {
    return (sessions ?? []).filter((s) => isSameDay(s.date, day))
  }

  return (
    <div className="p-4 flex flex-col gap-4">

      {/* Week navigator */}
      <div className="flex items-center gap-2">
        <button
          onClick={goToPrevWeek}
          aria-label="Previous week"
          className="size-8 flex items-center justify-center rounded-[0.5rem] border border-border bg-card hover:bg-muted transition-colors cursor-pointer shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <p className="text-[0.9375rem] font-semibold text-foreground flex-1 text-center m-0">
          {weekLabel}
        </p>

        <button
          onClick={goToNextWeek}
          aria-label="Next week"
          className="size-8 flex items-center justify-center rounded-[0.5rem] border border-border bg-card hover:bg-muted transition-colors cursor-pointer shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          onClick={goToToday}
          className="text-[0.8125rem] font-semibold text-primary px-3 py-1.5 rounded-full border border-primary/30 hover:bg-primary-subtle transition-colors cursor-pointer bg-transparent shrink-0"
        >
          {t('filter.today')}
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 items-start">
        {days.map((day) => {
          const daySessions = getSessionsForDay(day)
          const isCurrentDay = isToday(day)

          return (
            <div key={day.toISOString()} className="flex flex-col gap-1.5 min-w-0">

              {/* Day header */}
              <div className={`text-center py-2 rounded-[0.5rem] ${isCurrentDay ? 'bg-primary' : ''}`}>
                <div className={`text-[0.625rem] font-bold uppercase tracking-wider ${isCurrentDay ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {format(day, 'EEE')}
                </div>
                <div className={`text-[1rem] font-bold leading-none mt-0.5 ${isCurrentDay ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </div>
              </div>

              {/* Session cards */}
              {isLoading ? (
                <div className="rounded-[0.5rem] bg-muted/60 animate-pulse h-[72px]" />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {daySessions.map((session) => (
                    <SessionCalendarCard
                      key={session.id}
                      session={session}
                      teacher={teacherMap[session.teacherId]}
                      room={roomMap[session.roomId]}
                      onClick={() => setEditSession(session)}
                    />
                  ))}

                  {/* Add session button */}
                  {canManage && (
                    <button
                      onClick={() => setCreateForDate(day)}
                      className="w-full py-2 text-[0.75rem] font-semibold text-muted-foreground/50 hover:text-primary hover:bg-primary-subtle rounded-[0.5rem] border border-dashed border-border hover:border-primary/40 transition-colors cursor-pointer bg-transparent"
                    >
                      {t('addToDay')}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty week state */}
      {!isLoading && totalSessions === 0 && (
        <p className="text-center text-muted-foreground text-sm py-6 m-0">
          {t('noSessions')}
        </p>
      )}

      {/* Dialogs */}
      {editSession && (
        <EditSessionDialog session={editSession} onClose={() => setEditSession(null)} />
      )}

      {createForDate && (
        <CreateSessionDialog defaultDate={createForDate} onClose={() => setCreateForDate(null)} />
      )}
    </div>
  )
}
