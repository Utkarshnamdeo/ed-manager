import { useTranslation } from 'react-i18next'
import type { DashboardStats } from '../../hooks/useDashboardStats'

/* ─── Props ── */

export interface StatCardsProps {
  stats: DashboardStats
}

/* ─── Sparkline ── */

function Sparkline({ points, color, id }: { points: string; color: string; id: string }) {
  const lastX = points.split(' ').pop()?.split(',')[0] ?? '200'
  return (
    <svg viewBox="0 0 200 44" preserveAspectRatio="none" className="w-full h-[44px] block" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M ${points} L ${lastX},44 L 0,44 Z`} fill={`url(#${id})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Stat Card ── */

interface StatCardProps {
  label: string
  value: string
  badge: string
  badgeClass: string
  iconClass: string
  sparkPoints: string
  sparkColor: string
  sparkId: string
  trend: string
  icon: React.ReactNode
}

function StatCard(p: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-[1rem] pt-5 px-5 pb-0 overflow-hidden flex flex-col gap-3.5">
      <div className="flex items-start justify-between">
        <div className={`size-10 rounded-[10px] flex items-center justify-center ${p.iconClass}`}>
          {p.icon}
        </div>
        {p.badge && (
          <span className={`text-[0.6875rem] font-bold tracking-[0.02em] px-2 py-[0.2rem] rounded-full ${p.badgeClass}`}>
            {p.badge}
          </span>
        )}
      </div>
      <div>
        <div className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-1">
          {p.label}
        </div>
        <div className="text-[1.875rem] font-extrabold text-foreground tracking-[-0.03em] leading-[1.1]">
          {p.value}
        </div>
        {p.trend && (
          <div className="text-xs font-medium mt-1 text-muted-foreground">
            {p.trend}
          </div>
        )}
      </div>
      <div className="-mx-5">
        <Sparkline points={p.sparkPoints} color={p.sparkColor} id={p.sparkId} />
      </div>
    </div>
  )
}

/* ─── Icons ── */

function IconCalendar() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
}
function IconUsers() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function IconBadge() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
}
function IconCheck() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
}

/* ─── StatCards ── */

export function StatCards({ stats }: StatCardsProps) {
  const { t } = useTranslation()

  if (stats.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-[1rem] h-[160px] animate-pulse" />
        ))}
      </div>
    )
  }

  if (stats.isError) {
    return (
      <p className="text-sm text-destructive">{t('errors.failedToLoad')}</p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard
        label={t('dashboard.stats.todaysSessions')}
        value={String(stats.todaySessions.length)}
        badge={t('dashboard.stats.activeCount', { count: stats.activeSessionCount })}
        badgeClass="bg-success-subtle text-success"
        iconClass="bg-primary-subtle text-primary"
        sparkPoints="0,36 40,28 80,32 120,18 160,22 200,14"
        sparkColor="oklch(0.55 0.22 265)"
        sparkId="sp-sessions"
        trend=""
        icon={<IconCalendar />}
      />
      <StatCard
        label={t('dashboard.stats.totalStudents')}
        value={String(stats.activeStudentCount)}
        badge={t('dashboard.stats.active')}
        badgeClass="bg-secondary-subtle text-secondary"
        iconClass="bg-secondary-subtle text-secondary"
        sparkPoints="0,36 40,24 80,30 120,20 160,26 200,16"
        sparkColor="oklch(0.55 0.22 285)"
        sparkId="sp-students"
        trend=""
        icon={<IconUsers />}
      />
      <StatCard
        label={t('dashboard.stats.activePasses')}
        value={String(stats.activePassCount)}
        badge={`${stats.activePassPercent}%`}
        badgeClass="bg-success-subtle text-success"
        iconClass="bg-success-subtle text-success"
        sparkPoints="0,36 40,30 80,34 120,22 160,18 200,14"
        sparkColor="oklch(0.60 0.18 145)"
        sparkId="sp-passes"
        trend=""
        icon={<IconBadge />}
      />
      <StatCard
        label={t('dashboard.stats.weeklyCheckins')}
        value={String(stats.weeklyCheckinCount)}
        badge=""
        badgeClass=""
        iconClass="bg-warning-subtle text-[oklch(0.55_0.16_85)]"
        sparkPoints="0,36 40,28 80,34 120,14 160,24 200,20"
        sparkColor="oklch(0.70 0.18 85)"
        sparkId="sp-checkins"
        trend=""
        icon={<IconCheck />}
      />
    </div>
  )
}
