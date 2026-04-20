import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { TemplatesTab } from './TemplatesTab'
import { SessionsTab } from './SessionsTab'
import { CreateTemplateDialog } from './CreateTemplateDialog'
import { CreateSessionDialog } from './CreateSessionDialog'

/* ─── Icons ── */

function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

/* ─── Classes Page ── */

export function ClassesPage() {
  const { t } = useTranslation('classes')
  const { appUser } = useAuth()
  const canManage = appUser?.role === 'admin' || !!appUser?.permissions?.manageClasses

  const [tab, setTab] = useState<'templates' | 'sessions'>('templates')
  const [createTemplateDayOfWeek, setCreateTemplateDayOfWeek] = useState<number | null>(null)
  const [showCreateSession, setShowCreateSession] = useState(false)

  return (
    <div className="page-enter flex flex-col h-full">

      {/* Tab bar + action button */}
      <div className="flex items-center border-b border-border px-7 bg-background shrink-0">
        <div className="flex gap-0 flex-1">
          {(['templates', 'sessions'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`py-3.5 mr-6 bg-transparent border-0 cursor-pointer text-[0.9375rem] font-medium transition-[color,border-color] duration-150 border-b-2 ${
                tab === key
                  ? 'text-primary border-b-primary font-semibold'
                  : 'text-muted-foreground border-b-transparent'
              }`}
            >
              {t(`tabs.${key}`)}
            </button>
          ))}
        </div>

        {canManage && (
          <button
            onClick={() => tab === 'templates' ? setCreateTemplateDayOfWeek(0) : setShowCreateSession(true)}
            className="btn-primary flex items-center gap-1.5 my-2"
          >
            <IconPlus />
            {tab === 'templates' ? t('addTemplate') : t('addSession')}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'templates' && (
          <TemplatesTab
            canManage={canManage}
            onAddTemplate={setCreateTemplateDayOfWeek}
          />
        )}
        {tab === 'sessions' && (
          <SessionsTab
            canManage={canManage}
          />
        )}
      </div>

      {/* Dialogs */}
      {createTemplateDayOfWeek !== null && (
        <CreateTemplateDialog
          defaultDayOfWeek={createTemplateDayOfWeek}
          onClose={() => setCreateTemplateDayOfWeek(null)}
        />
      )}

      {showCreateSession && (
        <CreateSessionDialog
          onClose={() => setShowCreateSession(false)}
        />
      )}
    </div>
  )
}
