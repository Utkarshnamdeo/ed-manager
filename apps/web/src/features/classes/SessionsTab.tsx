import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { startOfDay, endOfDay, addDays, startOfMonth, endOfMonth } from 'date-fns'
import { useClassSessionsByDateRange } from '../../hooks/useClassSessions'
import { useUpdateClassSession } from '../../hooks/useClassSessions'
import { useTeachers } from '../../hooks/useTeachers'
import { useRooms } from '../../hooks/useRooms'
import { EditSessionDialog } from './EditSessionDialog'
import type { ClassSession } from '../../types'

type FilterKey = 'today' | 'thisWeek' | 'thisMonth'

const STATUS_DOT: Record<string, string> = {
  planned:   'bg-warning',
  active:    'bg-success',
  completed: 'bg-muted-foreground',
  cancelled: 'bg-destructive',
}

const STATUS_BADGE: Record<string, string> = {
  planned:   'bg-warning-subtle text-[oklch(0.48_0.14_85)]',
  active:    'bg-success-subtle text-success',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive-subtle text-destructive',
}

interface SessionsTabProps {
  canManage: boolean
}

export function SessionsTab({ canManage }: SessionsTabProps) {
  const { t } = useTranslation('classes')
  const [filter, setFilter] = useState<FilterKey>('today')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editSession, setEditSession] = useState<ClassSession | null>(null)

  const { data: teachers } = useTeachers()
  const { data: rooms } = useRooms()
  const updateSession = useUpdateClassSession()

  const today = new Date()
  const dateRange = {
    today:     { start: startOfDay(today), end: endOfDay(today) },
    thisWeek:  { start: startOfDay(today), end: endOfDay(addDays(today, 6)) },
    thisMonth: { start: startOfMonth(today), end: endOfMonth(today) },
  }

  const { start, end } = dateRange[filter]
  const { data: sessions, isLoading, isError } = useClassSessionsByDateRange(start, end)

  const teacherMap = Object.fromEntries((teachers ?? []).map((t) => [t.id, t]))
  const roomMap = Object.fromEntries((rooms ?? []).map((r) => [r.id, r]))

  const filterKeys: FilterKey[] = ['today', 'thisWeek', 'thisMonth']

  async function handleCancel(session: ClassSession) {
    await updateSession.mutateAsync({ id: session.id, status: 'cancelled' })
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Filter chips */}
      <div className="flex gap-2">
        {filterKeys.map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-[0.8125rem] font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-[background-color,color,border-color] duration-100 ${
              filter === key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border'
            }`}
          >
            {t(`filter.${key}`)}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading && (
        <div className="py-8 text-center text-muted-foreground text-sm">…</div>
      )}

      {isError && (
        <div className="py-8 text-center text-destructive text-sm">
          {t('errors.failedToLoad')}
        </div>
      )}

      {!isLoading && !isError && (sessions ?? []).length === 0 && (
        <div className="py-8 text-center text-muted-foreground text-sm">
          {t('noSessions')}
        </div>
      )}

      {!isLoading && !isError && (sessions ?? []).length > 0 && (
        <div className="bg-card border border-border rounded-[0.75rem] overflow-hidden">
          {/* Column header */}
          <div className="grid grid-cols-[2rem_9rem_1fr_9rem_6rem_6rem_2rem] gap-3 items-center px-4 py-2 bg-muted border-b border-border">
            <div />
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('columns.dateTime')}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('columns.class')}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('form.teacher')}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('form.room')}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('columns.status')}</div>
            <div />
          </div>

          {(sessions ?? []).map((session) => {
            const isExpanded = expandedId === session.id
            const teacher = teacherMap[session.teacherId]
            const room = roomMap[session.roomId]

            return (
              <div key={session.id} className="border-t border-border">
                {/* Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  className={`grid grid-cols-[2rem_9rem_1fr_9rem_6rem_6rem_2rem] gap-3 items-center w-full px-4 py-3.5 bg-transparent border-0 cursor-pointer text-left transition-[background-color] duration-100 hover:bg-muted ${session.status === 'cancelled' ? 'opacity-50' : ''}`}
                >
                  {/* Status dot */}
                  <div className={`size-2 rounded-full ${STATUS_DOT[session.status] ?? 'bg-muted-foreground'}`} />

                  {/* Date + time */}
                  <div className="text-[0.8125rem] text-muted-foreground">
                    <div>{session.date.toLocaleDateString()}</div>
                    <div className="text-xs">{session.startTime}–{session.endTime}</div>
                  </div>

                  {/* Name */}
                  <div>
                    <span className={`text-sm font-medium text-foreground ${session.status === 'cancelled' ? 'line-through' : ''}`}>
                      {session.name}
                    </span>
                    {session.isSpecial && (
                      <span className="ml-2 text-[0.6rem] font-bold uppercase tracking-wide px-1.5 py-[1px] rounded-full bg-warning-subtle text-[oklch(0.50_0.14_85)]">
                        {t(`type.${session.type}`)}
                      </span>
                    )}
                  </div>

                  {/* Teacher */}
                  <div className="text-[0.8125rem] text-muted-foreground truncate">
                    {teacher ? `${teacher.firstName} ${teacher.lastName}` : '—'}
                  </div>

                  {/* Room */}
                  <div className="text-[0.8125rem] text-muted-foreground truncate">
                    {room?.name ?? '—'}
                  </div>

                  {/* Status badge */}
                  <span className={`text-[0.6875rem] font-semibold px-2 py-[2px] rounded-full w-fit ${STATUS_BADGE[session.status] ?? ''}`}>
                    {t(`status.${session.status}`)}
                  </span>

                  {/* Chevron */}
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`text-muted-foreground transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Expanded row */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-muted border-t border-border flex items-center gap-4">
                    {session.notes && (
                      <p className="text-[0.8125rem] text-muted-foreground flex-1 m-0">{session.notes}</p>
                    )}
                    {!session.notes && <div className="flex-1" />}

                    <Link
                      to="/attendance"
                      className="text-[0.8125rem] font-semibold text-primary no-underline"
                    >
                      {t('actions.openCheckin')}
                    </Link>

                    {canManage && session.status !== 'cancelled' && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditSession(session) }}
                          className="text-[0.8125rem] font-semibold text-foreground bg-transparent border-0 cursor-pointer"
                        >
                          {t('actions.edit')}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancel(session) }}
                          disabled={updateSession.isPending}
                          className="text-[0.8125rem] font-semibold text-destructive bg-transparent border-0 cursor-pointer"
                        >
                          {t('actions.cancelSession')}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {editSession && (
        <EditSessionDialog session={editSession} onClose={() => setEditSession(null)} />
      )}
    </div>
  )
}
