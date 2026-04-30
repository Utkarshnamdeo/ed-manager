import { useTranslation } from 'react-i18next';
import { SessionStatus, type ClassSession } from '../../types';

/* ─── Props ── */

export interface SessionRowProps {
  session: ClassSession;
  teacherName: string;
  checkedInCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode; // CheckInPanel slot — Phase 4 will pass it in
}

/* ─── Status maps ── */

const DOT: Record<string, string> = {
  active: 'bg-success',
  planned: 'bg-warning',
  completed: 'bg-muted-foreground',
  cancelled: 'bg-destructive',
};

const BADGE: Record<string, string> = {
  active: 'bg-success-subtle text-success',
  planned: 'bg-warning-subtle text-[oklch(0.48_0.14_85)]',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive-subtle text-destructive',
};

/* ─── Chevron icon ── */

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* ─── SessionRow ── */

export function SessionRow({
  session,
  teacherName,
  checkedInCount,
  isExpanded,
  onToggle,
  children,
}: SessionRowProps) {
  const { t } = useTranslation();
  const isCancelled = session.status === SessionStatus.Cancelled;

  const statusLabel: Record<string, string> = {
    active: t('dashboard.schedule.statusActive'),
    planned: t('dashboard.schedule.statusPlanned'),
    completed: t('dashboard.schedule.statusDone'),
    cancelled: t('dashboard.schedule.statusCancelled'),
  };

  const handleClick = () => {
    if (isCancelled) return;
    onToggle();
  };

  return (
    <div className={`border-b border-border last:border-b-0 ${ isCancelled ? 'opacity-50' : '' }`}>
      <div
        className={`flex items-center gap-4 px-5 py-3.5 ${ isCancelled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-muted/30 transition-colors' }`}
        onClick={handleClick}
        role={isCancelled ? undefined : 'button'}
        tabIndex={isCancelled ? undefined : 0}
        onKeyDown={(e) => {
          if (!isCancelled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className={`size-2 rounded-full shrink-0 ${ DOT[session.status] ?? 'bg-muted-foreground' }`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">{session.name}</div>
          <div className="text-xs text-muted-foreground mt-[1px]">
            {session.startTime}–{session.endTime} · {teacherName}
          </div>
        </div>
        <div className="text-sm font-semibold text-right shrink-0">
          {t('dashboard.schedule.enrolled', {
            enrolled: checkedInCount,
            capacity: session.capacity ?? '∞',
          })}
        </div>
        <span className={`text-[0.6875rem] font-bold px-2.5 py-[0.2rem] rounded-full shrink-0 ${ BADGE[session.status] ?? 'bg-muted text-muted-foreground' }`}>
          {statusLabel[session.status] ?? session.status}
        </span>
        <div className="shrink-0 text-muted-foreground">
          {!isCancelled && (isExpanded ? <ChevronDown /> : <ChevronRight />)}
        </div>
      </div>
      {isExpanded && !isCancelled && children && (
        <div className="border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
}
