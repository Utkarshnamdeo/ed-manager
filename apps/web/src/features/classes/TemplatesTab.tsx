import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useClassTemplates } from '../../hooks/useClassTemplates'
import { useTeachers } from '../../hooks/useTeachers'
import { useRooms } from '../../hooks/useRooms'
import { TemplateCard } from './TemplateCard'
import { TemplateDetailDrawer } from './TemplateDetailDrawer'
import type { ClassTemplate } from '../../types'

// dayOfWeek: 0=Mon … 6=Sun

interface TemplatesTabProps {
  canManage: boolean
  onAddTemplate: (dayOfWeek: number) => void
}

export function TemplatesTab({ canManage, onAddTemplate }: TemplatesTabProps) {
  const { t } = useTranslation('classes')
  const { data: templates, isLoading, isError } = useClassTemplates()
  const { data: teachers } = useTeachers()
  const { data: rooms } = useRooms()
  const [selected, setSelected] = useState<ClassTemplate | null>(null)

  const teacherMap = Object.fromEntries((teachers ?? []).map((t) => [t.id, t]))
  const roomMap = Object.fromEntries((rooms ?? []).map((r) => [r.id, r]))

  const days = [0, 1, 2, 3, 4, 5, 6] as const

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground text-sm">…</div>
  }

  if (isError) {
    return (
      <div className="p-12 text-center text-destructive text-sm">
        {t('errors.failedToLoad')}
      </div>
    )
  }

  return (
    <>
      <div className="p-4">
        {/* 7-column grid: 1px border gaps via bg-border */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-[0.75rem] overflow-hidden">
          {days.map((day) => {
            const dayTemplates = (templates ?? [])
              .filter((tmpl) => tmpl.dayOfWeek === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))

            return (
              <div key={day} className="bg-card flex flex-col min-h-[400px]">
                {/* Column header */}
                <div className="px-2 py-2.5 border-b border-border">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t(`days.${day}`)}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 p-2 flex-1">
                  {dayTemplates.map((tmpl) => (
                    <TemplateCard
                      key={tmpl.id}
                      template={tmpl}
                      teacher={teacherMap[tmpl.teacherId]}
                      room={roomMap[tmpl.roomId]}
                      onClick={() => setSelected(tmpl)}
                    />
                  ))}
                </div>

                {/* Add button */}
                {canManage && (
                  <button
                    onClick={() => onAddTemplate(day)}
                    className="mx-2 mb-2 py-1.5 text-[0.75rem] font-semibold text-muted-foreground border border-dashed border-border rounded-[0.5rem] bg-transparent cursor-pointer transition-[color,border-color] duration-100 hover:text-foreground hover:border-foreground"
                  >
                    {t('addToDay')}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {selected && (
        <TemplateDetailDrawer
          template={selected}
          teachers={teachers ?? []}
          rooms={rooms ?? []}
          canManage={canManage}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
