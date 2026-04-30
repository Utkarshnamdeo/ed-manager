import { useTranslation } from 'react-i18next';
import { type ClassSession, type Teacher, type Room, SessionStatus } from '../../types';

const STATUS_DOT: Record<string, string> = {
  planned: 'bg-warning',
  active: 'bg-success',
  completed: 'bg-muted-foreground',
  cancelled: 'bg-destructive',
};

interface SessionCalendarCardProps {
  session: ClassSession;
  teacher: Teacher | undefined;
  room: Room | undefined;
  onClick: () => void;
}

export function SessionCalendarCard({ session, teacher, room, onClick }: SessionCalendarCardProps) {
  const { t } = useTranslation('classes');
  const isCancelled = session.status === SessionStatus.Cancelled;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2.5 rounded-[0.625rem] border border-border bg-card hover:shadow-sm hover:-translate-y-px transition-[transform,box-shadow,opacity] duration-100 cursor-pointer ${ isCancelled ? 'opacity-40' : 'hover:border-border-strong' }`}
    >
      {/* Time + status dot */}
      <div className="flex items-center gap-1.5 mb-1">
        <div className={`size-1.5 rounded-full shrink-0 ${ STATUS_DOT[session.status] ?? 'bg-muted-foreground' }`} />
        <span className="text-[0.6875rem] text-muted-foreground font-medium">
          {session.startTime}–{session.endTime}
        </span>
      </div>

      {/* Class name */}
      <div className={`text-[0.8125rem] font-semibold text-foreground leading-tight mb-0.5 ${ isCancelled ? 'line-through' : '' }`}>
        {session.name}
      </div>

      {/* Level */}
      <div className="text-[0.75rem] text-muted-foreground">
        {t(`level.${ session.level }`)}
      </div>

      {/* Teacher */}
      {teacher && (
        <div className="text-[0.75rem] text-muted-foreground truncate mt-0.5">
          {teacher.firstName} {teacher.lastName}
        </div>
      )}

      {/* Room */}
      {room && (
        <div className="text-[0.6875rem] text-muted-foreground/60 truncate mt-0.5">
          {room.name}
        </div>
      )}

      {/* Special badge */}
      {session.isSpecial && !isCancelled && (
        <span className="inline-block mt-1 text-[0.6rem] font-bold uppercase tracking-wide px-1.5 py-[1px] rounded-full bg-warning-subtle text-[oklch(0.50_0.14_85)]">
          {t(`type.${ session.type }`)}
        </span>
      )}
    </button>
  );
}
