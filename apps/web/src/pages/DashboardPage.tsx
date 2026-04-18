import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

/* ─── Sparkline ────────────────────────────────────────────────────────────── */

function Sparkline({ points, color, id }: { points: string; color: string; id: string }) {
  const lastX = points.split(' ').pop()?.split(',')[0] ?? '200'
  return (
    <svg viewBox="0 0 200 44" preserveAspectRatio="none" style={{ width: '100%', height: '44px', display: 'block' }} aria-hidden="true">
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

/* ─── Stat Card ────────────────────────────────────────────────────────────── */

interface StatCardProps {
  label: string
  value: string
  badge: string
  badgeBg: string
  badgeColor: string
  iconBg: string
  iconColor: string
  icon: React.ReactNode
  sparkPoints: string
  sparkColor: string
  sparkId: string
  trend: string
  trendUp: boolean
}

function StatCard(p: StatCardProps) {
  return (
    <div style={{
      backgroundColor: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: '1rem',
      padding: '1.25rem 1.25rem 0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.875rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: p.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.iconColor }}>
          {p.icon}
        </div>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.02em', padding: '0.2rem 0.5rem', borderRadius: '9999px', backgroundColor: p.badgeBg, color: p.badgeColor }}>
          {p.badge}
        </span>
      </div>
      <div>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-foreground)', marginBottom: '0.25rem' }}>
          {p.label}
        </div>
        <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-foreground)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          {p.value}
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 500, color: p.trendUp ? 'var(--color-success)' : 'var(--color-destructive)', marginTop: '0.25rem' }}>
          {p.trend}
        </div>
      </div>
      <div style={{ margin: '0 -1.25rem' }}>
        <Sparkline points={p.sparkPoints} color={p.sparkColor} id={p.sparkId} />
      </div>
    </div>
  )
}

/* ─── Schedule Row ─────────────────────────────────────────────────────────── */

function ScheduleRow({ name, time, teacher, enrolled, capacity, status }: {
  name: string; time: string; teacher: string
  enrolled: number; capacity: number; status: 'active' | 'planned' | 'completed'
}) {
  const dot = { active: 'var(--color-success)', planned: 'var(--color-warning)', completed: 'var(--color-muted-foreground)' }[status]
  const badgeBg = { active: 'var(--color-success-subtle)', planned: 'var(--color-warning-subtle)', completed: 'var(--color-muted)' }[status]
  const badgeColor = { active: 'var(--color-success)', planned: 'oklch(0.48 0.14 85)', completed: 'var(--color-muted-foreground)' }[status]
  const label = { active: 'Active', planned: 'Planned', completed: 'Done' }[status]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: dot, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)', marginTop: '1px' }}>{time} · {teacher}</div>
      </div>
      <div style={{ fontSize: '0.875rem', fontWeight: 600, textAlign: 'right', flexShrink: 0 }}>
        {enrolled} <span style={{ fontWeight: 400, color: 'var(--color-muted-foreground)' }}>/ {capacity}</span>
      </div>
      <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.625rem', borderRadius: '9999px', backgroundColor: badgeBg, color: badgeColor, flexShrink: 0 }}>
        {label}
      </span>
    </div>
  )
}

/* ─── Dashboard Page ───────────────────────────────────────────────────────── */

export function DashboardPage() {
  const { t } = useTranslation()
  const { appUser } = useAuth()

  return (
    <div className="page-enter" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Welcome line */}
      <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--color-muted-foreground)' }}>
        {t('dashboard.welcome', { name: appUser?.displayName ?? '' })}
      </p>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <StatCard
          label="Today's Sessions" value="4" badge="3 active"
          badgeBg="var(--color-success-subtle)" badgeColor="var(--color-success)"
          iconBg="var(--color-primary-subtle)" iconColor="var(--color-primary)"
          sparkPoints="0,36 40,28 80,32 120,18 160,22 200,14"
          sparkColor="oklch(0.55 0.22 265)" sparkId="sp-sessions"
          trend="↑ 1 more than yesterday" trendUp={true}
          icon={<IconCalendar />}
        />
        <StatCard
          label="Total Students" value="127" badge="Active"
          badgeBg="var(--color-secondary-subtle)" badgeColor="var(--color-secondary)"
          iconBg="var(--color-secondary-subtle)" iconColor="var(--color-secondary)"
          sparkPoints="0,36 40,24 80,30 120,20 160,26 200,16"
          sparkColor="oklch(0.55 0.22 285)" sparkId="sp-students"
          trend="↑ 3 enrolled this week" trendUp={true}
          icon={<IconUsers />}
        />
        <StatCard
          label="Active Passes" value="89" badge="70%"
          badgeBg="var(--color-success-subtle)" badgeColor="var(--color-success)"
          iconBg="var(--color-success-subtle)" iconColor="var(--color-success)"
          sparkPoints="0,36 40,30 80,34 120,22 160,18 200,14"
          sparkColor="oklch(0.60 0.18 145)" sparkId="sp-passes"
          trend="↑ 4 new this month" trendUp={true}
          icon={<IconBadge />}
        />
        <StatCard
          label="Check-ins This Week" value="156" badge="+12%"
          badgeBg="var(--color-warning-subtle)" badgeColor="oklch(0.48 0.14 85)"
          iconBg="var(--color-warning-subtle)" iconColor="oklch(0.55 0.16 85)"
          sparkPoints="0,36 40,28 80,34 120,14 160,24 200,20"
          sparkColor="oklch(0.70 0.18 85)" sparkId="sp-checkins"
          trend="↑ 17 vs last week" trendUp={true}
          icon={<IconCheck />}
        />
      </div>

      {/* Today's schedule — 2 sessions only */}
      <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>Today's Schedule</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)', margin: '2px 0 0' }}>2 upcoming · 1 done</p>
          </div>
          <a href="/attendance" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}>
            Open check-in →
          </a>
        </div>
        <ScheduleRow name="Bachata Beginner" time="19:00–20:30" teacher="Maria Lopez" enrolled={3} capacity={20} status="active" />
        <ScheduleRow name="Kizomba Intermediate" time="20:30–22:00" teacher="Carlos Ferreira" enrolled={0} capacity={15} status="planned" />
        <ScheduleRow name="Salsa Open Level" time="18:00–19:30" teacher="Sofia Torres" enrolled={11} capacity={25} status="completed" />
      </div>

      {/* Dev: Firebase Emulator Status */}
      <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1rem 1.25rem' }}>
        <h2 style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-foreground)', margin: '0 0 0.625rem' }}>
          {t('dashboard.emulatorStatus')}
        </h2>
        <div style={{ display: 'flex', gap: '1.5rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem' }}>
          {[['Auth', 9099], ['Firestore', 8080], ['Functions', 5001], ['UI', 4000]].map(([label, port]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>:{port}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

/* ─── Icons ────────────────────────────────────────────────────────────────── */

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
