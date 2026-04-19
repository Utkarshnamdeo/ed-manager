import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

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
  trendUp: boolean
  icon: React.ReactNode
}

function StatCard(p: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-[1rem] pt-5 px-5 pb-0 overflow-hidden flex flex-col gap-3.5">
      <div className="flex items-start justify-between">
        <div className={`size-10 rounded-[10px] flex items-center justify-center ${p.iconClass}`}>
          {p.icon}
        </div>
        <span className={`text-[0.6875rem] font-bold tracking-[0.02em] px-2 py-[0.2rem] rounded-full ${p.badgeClass}`}>
          {p.badge}
        </span>
      </div>
      <div>
        <div className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-1">
          {p.label}
        </div>
        <div className="text-[1.875rem] font-extrabold text-foreground tracking-[-0.03em] leading-[1.1]">
          {p.value}
        </div>
        <div className={`text-xs font-medium mt-1 ${p.trendUp ? 'text-success' : 'text-destructive'}`}>
          {p.trend}
        </div>
      </div>
      <div className="-mx-5">
        <Sparkline points={p.sparkPoints} color={p.sparkColor} id={p.sparkId} />
      </div>
    </div>
  )
}

/* ─── Schedule Row ── */

const SCHEDULE_DOT_CLASS = {
  active:    'bg-success',
  planned:   'bg-warning',
  completed: 'bg-muted-foreground',
} as const

const SCHEDULE_BADGE_CLASS = {
  active:    'bg-success-subtle text-success',
  planned:   'bg-warning-subtle text-[oklch(0.48_0.14_85)]',
  completed: 'bg-muted text-muted-foreground',
} as const

const SCHEDULE_LABEL = {
  active:    'Active',
  planned:   'Planned',
  completed: 'Done',
} as const

function ScheduleRow({ name, time, teacher, enrolled, capacity, status }: {
  name: string; time: string; teacher: string
  enrolled: number; capacity: number; status: 'active' | 'planned' | 'completed'
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-b-0">
      <div className={`size-2 rounded-full shrink-0 ${SCHEDULE_DOT_CLASS[status]}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{name}</div>
        <div className="text-xs text-muted-foreground mt-[1px]">{time} · {teacher}</div>
      </div>
      <div className="text-sm font-semibold text-right shrink-0">
        {enrolled} <span className="font-normal text-muted-foreground">/ {capacity}</span>
      </div>
      <span className={`text-[0.6875rem] font-bold px-2.5 py-[0.2rem] rounded-full shrink-0 ${SCHEDULE_BADGE_CLASS[status]}`}>
        {SCHEDULE_LABEL[status]}
      </span>
    </div>
  )
}

/* ─── Dashboard Page ── */

export function DashboardPage() {
  const { t } = useTranslation()
  const { appUser } = useAuth()

  return (
    <div className="page-enter p-7 flex flex-col gap-6">

      {/* Welcome line */}
      <p className="m-0 text-[0.9375rem] text-muted-foreground">
        {t('dashboard.welcome', { name: appUser?.displayName ?? '' })}
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Today's Sessions" value="4" badge="3 active"
          badgeClass="bg-success-subtle text-success"
          iconClass="bg-primary-subtle text-primary"
          sparkPoints="0,36 40,28 80,32 120,18 160,22 200,14"
          sparkColor="oklch(0.55 0.22 265)" sparkId="sp-sessions"
          trend="↑ 1 more than yesterday" trendUp={true}
          icon={<IconCalendar />}
        />
        <StatCard
          label="Total Students" value="127" badge="Active"
          badgeClass="bg-secondary-subtle text-secondary"
          iconClass="bg-secondary-subtle text-secondary"
          sparkPoints="0,36 40,24 80,30 120,20 160,26 200,16"
          sparkColor="oklch(0.55 0.22 285)" sparkId="sp-students"
          trend="↑ 3 enrolled this week" trendUp={true}
          icon={<IconUsers />}
        />
        <StatCard
          label="Active Passes" value="89" badge="70%"
          badgeClass="bg-success-subtle text-success"
          iconClass="bg-success-subtle text-success"
          sparkPoints="0,36 40,30 80,34 120,22 160,18 200,14"
          sparkColor="oklch(0.60 0.18 145)" sparkId="sp-passes"
          trend="↑ 4 new this month" trendUp={true}
          icon={<IconBadge />}
        />
        <StatCard
          label="Check-ins This Week" value="156" badge="+12%"
          badgeClass="bg-warning-subtle text-[oklch(0.48_0.14_85)]"
          iconClass="bg-warning-subtle text-[oklch(0.55_0.16_85)]"
          sparkPoints="0,36 40,28 80,34 120,14 160,24 200,20"
          sparkColor="oklch(0.70 0.18 85)" sparkId="sp-checkins"
          trend="↑ 17 vs last week" trendUp={true}
          icon={<IconCheck />}
        />
      </div>

      {/* Today's schedule */}
      <div className="bg-card border border-border rounded-[1rem] overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-[0.9375rem] font-bold m-0 tracking-[-0.01em]">Today's Schedule</h2>
            <p className="text-xs text-muted-foreground m-0 mt-[2px]">2 upcoming · 1 done</p>
          </div>
          <a href="/attendance" className="text-[0.8125rem] font-bold text-primary no-underline">
            Open check-in →
          </a>
        </div>
        <ScheduleRow name="Bachata Beginner" time="19:00–20:30" teacher="Maria Lopez" enrolled={3} capacity={20} status="active" />
        <ScheduleRow name="Kizomba Intermediate" time="20:30–22:00" teacher="Carlos Ferreira" enrolled={0} capacity={15} status="planned" />
        <ScheduleRow name="Salsa Open Level" time="18:00–19:30" teacher="Sofia Torres" enrolled={11} capacity={25} status="completed" />
      </div>

      {/* Dev: Firebase Emulator Status */}
      <div className="bg-card border border-border rounded-[1rem] px-5 py-4">
        <h2 className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground m-0 mb-2.5">
          {t('dashboard.emulatorStatus')}
        </h2>
        <div className="flex gap-6 font-mono text-[0.8125rem]">
          {[['Auth', 9099], ['Firestore', 8080], ['Functions', 5001], ['UI', 4000]].map(([label, port]) => (
            <div key={label} className="flex flex-col gap-[1px]">
              <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-[0.05em]">{label}</span>
              <span className="text-success font-semibold">:{port}</span>
            </div>
          ))}
        </div>
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
