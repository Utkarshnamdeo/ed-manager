import { useTranslation } from 'react-i18next'
import type { ClassTemplate, Teacher, Room } from '../../types'

const STYLE_BG: Record<string, string> = {
  bachata: 'bg-primary-subtle',
  kizomba: 'bg-secondary-subtle',
  salsa:   'bg-success-subtle',
  zouk:    'bg-warning-subtle',
  afro:    'bg-muted',
  other:   'bg-muted',
}

interface TemplateCardProps {
  template: ClassTemplate
  teacher: Teacher | undefined
  room: Room | undefined
  onClick: () => void
}

export function TemplateCard({ template, teacher, room, onClick }: TemplateCardProps) {
  const { t } = useTranslation('classes')
  const bgClass = STYLE_BG[template.style] ?? 'bg-muted'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-[0.625rem] px-3 py-2.5 border border-transparent hover:border-border transition-[border-color,background-color] duration-100 cursor-pointer ${bgClass}`}
    >
      {/* Style + level pill */}
      <div className="flex justify-between items-start gap-1 mb-1.5">
        <span className="text-[0.8125rem] font-bold text-foreground leading-tight">
          {template.name}
        </span>
        <span className="text-[0.6rem] font-bold uppercase tracking-wide text-muted-foreground shrink-0 mt-[2px]">
          {t(`level.${template.level}`)}
        </span>
      </div>

      {/* Time */}
      <div className="text-[0.75rem] text-muted-foreground">
        {template.startTime}–{template.endTime}
      </div>

      {/* Teacher · Room */}
      {(teacher || room) && (
        <div className="text-[0.75rem] text-muted-foreground mt-0.5 truncate">
          {teacher ? `${teacher.firstName} ${teacher.lastName}` : ''}
          {teacher && room ? ' · ' : ''}
          {room ? room.name : ''}
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[0.6875rem] font-semibold text-muted-foreground">
          {t('roster.studentCount', { count: template.regularStudentIds.length })}
        </span>
        {template.isSubscription && (
          <span className="text-[0.6rem] font-bold uppercase tracking-wide px-1.5 py-[1px] rounded-full bg-primary text-primary-foreground">
            Sub
          </span>
        )}
      </div>
    </button>
  )
}
