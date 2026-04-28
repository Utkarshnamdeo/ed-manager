import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useDashboardStats } from '../../hooks/useDashboardStats'
import { useClassSessionsByDate } from '../../hooks/useClassSessions'
import { useTeachers } from '../../hooks/useTeachers'
import { StatCards } from './StatCards'
import { SessionRow } from './SessionRow'

export function DashboardPage() {
  const { t } = useTranslation()
  const { appUser } = useAuth()
  const stats = useDashboardStats()
  const { data: sessions = [] } = useClassSessionsByDate(new Date())
  const { data: teachers = [] } = useTeachers()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const teacherMap = new Map(teachers.map((teacher) => [teacher.id, `${teacher.firstName} ${teacher.lastName}`]))

  return (
    <div className="page-enter p-7 flex flex-col gap-6">

      {/* Welcome */}
      <p className="m-0 text-[0.9375rem] text-muted-foreground">
        {t('dashboard.welcome', { name: appUser?.displayName ?? '' })}
      </p>

      {/* Stat cards */}
      <StatCards stats={stats} />

      {/* Schedule section */}
      <div className="bg-card border border-border rounded-[1rem] overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-[0.9375rem] font-bold m-0 tracking-[-0.01em]">
              {t('dashboard.schedule.heading')}
            </h2>
            <p className="text-xs text-muted-foreground m-0 mt-[2px]">
              {t('dashboard.schedule.subtitle', {
                upcoming: stats.plannedSessionCount + stats.activeSessionCount,
                done: stats.completedSessionCount,
              })}
            </p>
          </div>
          <Link to="/attendance" className="text-[0.8125rem] font-bold text-primary no-underline">
            {t('dashboard.schedule.openCheckin')} →
          </Link>
        </div>

        {/* Session list */}
        {stats.isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-b-0 animate-pulse">
              <div className="size-2 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-2.5 bg-muted rounded w-1/4" />
              </div>
              <div className="h-3 bg-muted rounded w-12 shrink-0" />
              <div className="h-5 bg-muted rounded-full w-14 shrink-0" />
            </div>
          ))
        ) : stats.isError ? (
          <p className="p-5 text-sm text-muted-foreground">{t('errors.failedToLoad')}</p>
        ) : sessions.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">{t('dashboard.schedule.empty')}</p>
        ) : (
          sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              teacherName={teacherMap.get(session.teacherId) ?? '—'}
              checkedInCount={0}
              isExpanded={expandedId === session.id}
              onToggle={() => {
                if (session.status === 'cancelled') return
                setExpandedId((prev) => (prev === session.id ? null : session.id))
              }}
            />
          ))
        )}
      </div>

      {/* Emulator status — DEV only */}
      {import.meta.env.DEV && (
        <div className="bg-card border border-border rounded-[1rem] px-5 py-4">
          <h2 className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground m-0 mb-2.5">
            {t('dashboard.emulatorStatus')}
          </h2>
          <div className="flex gap-6 font-mono text-[0.8125rem]">
            {[['Auth', 9099], ['Firestore', 8080], ['Functions', 5001], ['UI', 4000]].map(([label, port]) => (
              <div key={String(label)} className="flex flex-col gap-[1px]">
                <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-[0.05em]">{String(label)}</span>
                <span className="text-success font-semibold">:{String(port)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
