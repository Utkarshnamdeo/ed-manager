import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addDays, startOfDay } from 'date-fns';
import { useUpdateClassTemplate, useDeleteClassTemplate } from '../../hooks/useClassTemplates';
import { useClassSessionsByDateRange } from '../../hooks/useClassSessions';
import { useStudents } from '../../hooks/useStudents';
import { type ClassTemplate, type Teacher, type Room, ClassLevel, ClassType, SessionStatus, DanceStyle } from '../../types';

/* ─── Icons ── */

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ─── Details Tab ── */

function DetailsTab({
  template,
  teachers,
  rooms,
  canManage,
  onClose,
}: {
  template: ClassTemplate;
  teachers: Teacher[];
  rooms: Room[];
  canManage: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation('classes');
  const updateTemplate = useUpdateClassTemplate();
  const deleteTemplate = useDeleteClassTemplate();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    name: template.name,
    style: template.style,
    level: template.level,
    type: template.type,
    startTime: template.startTime,
    endTime: template.endTime,
    teacherId: template.teacherId,
    roomId: template.roomId,
    isSubscription: template.isSubscription,
  });

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    await updateTemplate.mutateAsync({ id: template.id, ...form });
    setEditing(false);
  }

  function handleCancel() {
    setForm({
      name: template.name,
      style: template.style,
      level: template.level,
      type: template.type,
      startTime: template.startTime,
      endTime: template.endTime,
      teacherId: template.teacherId,
      roomId: template.roomId,
      isSubscription: template.isSubscription,
    });
    setEditing(false);
  }

  const styles = [DanceStyle.Bachata, DanceStyle.Kizomba, DanceStyle.Salsa, DanceStyle.Zouk, DanceStyle.Afro, 'other'] as const;
  const levels = [ClassLevel.Beginner, ClassLevel.Intermediate, ClassLevel.Advanced, ClassLevel.Open] as const;
  const types = [ClassType.Regular, ClassType.Special, 'workshop', ClassType.Event, ClassType.Party] as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.name')}</label>
          {editing
            ? <input className="form-input w-full" value={form.name} onChange={(e) => setField('name', e.target.value)} />
            : <div className="text-[0.9375rem] text-foreground py-2">{template.name}</div>}
        </div>
        <div>
          <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.style')}</label>
          {editing
            ? (
              <select className="form-input w-full" value={form.style} onChange={(e) => setField('style', e.target.value as typeof form.style)}>
                {styles.map((s) => <option key={s} value={s}>{t(`style.${ s }`)}</option>)}
              </select>
            )
            : <div className="text-[0.9375rem] text-foreground py-2">{t(`style.${ template.style }`)}</div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.level')}</label>
          {editing
            ? (
              <select className="form-input w-full" value={form.level} onChange={(e) => setField('level', e.target.value as typeof form.level)}>
                {levels.map((l) => <option key={l} value={l}>{t(`level.${ l }`)}</option>)}
              </select>
            )
            : <div className="text-[0.9375rem] text-foreground py-2">{t(`level.${ template.level }`)}</div>}
        </div>
        <div>
          <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.type')}</label>
          {editing
            ? (
              <select className="form-input w-full" value={form.type} onChange={(e) => setField('type', e.target.value as typeof form.type)}>
                {types.map((tp) => <option key={tp} value={tp}>{t(`type.${ tp }`)}</option>)}
              </select>
            )
            : <div className="text-[0.9375rem] text-foreground py-2">{t(`type.${ template.type }`)}</div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.startTime')}</label>
          {editing
            ? <input className="form-input w-full" type="time" value={form.startTime} onChange={(e) => setField('startTime', e.target.value)} />
            : <div className="text-[0.9375rem] text-foreground py-2">{template.startTime}</div>}
        </div>
        <div>
          <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.endTime')}</label>
          {editing
            ? <input className="form-input w-full" type="time" value={form.endTime} onChange={(e) => setField('endTime', e.target.value)} />
            : <div className="text-[0.9375rem] text-foreground py-2">{template.endTime}</div>}
        </div>
      </div>

      <div>
        <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.teacher')}</label>
        {editing
          ? (
            <select className="form-input w-full" value={form.teacherId} onChange={(e) => setField('teacherId', e.target.value)}>
              {teachers.map((tc) => <option key={tc.id} value={tc.id}>{tc.firstName} {tc.lastName}</option>)}
            </select>
          )
          : (
            <div className="text-[0.9375rem] text-foreground py-2">
              {teachers.find((tc) => tc.id === template.teacherId)?.firstName ?? '—'}{' '}
              {teachers.find((tc) => tc.id === template.teacherId)?.lastName ?? ''}
            </div>
          )}
      </div>

      <div>
        <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.room')}</label>
        {editing
          ? (
            <select className="form-input w-full" value={form.roomId} onChange={(e) => setField('roomId', e.target.value)}>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          )
          : <div className="text-[0.9375rem] text-foreground py-2">{rooms.find((r) => r.id === template.roomId)?.name ?? '—'}</div>}
      </div>

      {editing && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isSubscription} onChange={(e) => setField('isSubscription', e.target.checked)} />
          <span className="text-sm text-foreground">{t('form.isSubscription')}</span>
        </label>
      )}

      {canManage && (
        <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
          {confirmDelete ? (
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[0.8125rem] text-foreground m-0">
                {t('actions.deleteConfirm', { name: template.name })}
              </p>
              <p className="text-xs text-destructive m-0">{t('actions.deleteWarning')}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1">{t('actions.cancel')}</button>
                <button
                  onClick={async () => { await deleteTemplate.mutateAsync(template.id); onClose(); }}
                  disabled={deleteTemplate.isPending}
                  className="btn-destructive flex-1"
                >
                  {deleteTemplate.isPending ? '…' : t('actions.delete')}
                </button>
              </div>
            </div>
          ) : editing ? (
            <div className="flex gap-2 ml-auto">
              <button onClick={handleCancel} className="btn-secondary">{t('actions.cancel')}</button>
              <button onClick={handleSave} disabled={updateTemplate.isPending} className="btn-primary">
                {updateTemplate.isPending ? '…' : t('actions.save')}
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setConfirmDelete(true)} className="btn-destructive-outline">
                {t('actions.delete')}
              </button>
              <button onClick={() => setEditing(true)} className="btn-secondary ml-auto">
                {t('actions.edit')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Roster Tab ── */

function RosterTab({ template, canManage }: { template: ClassTemplate; canManage: boolean; }) {
  const { t } = useTranslation('classes');
  const updateTemplate = useUpdateClassTemplate();
  const { data: allStudents } = useStudents();

  async function handleRemove(studentId: string) {
    await updateTemplate.mutateAsync({
      id: template.id,
      regularStudentIds: template.regularStudentIds.filter((id) => id !== studentId),
    });
  }

  const enrolled = (allStudents ?? []).filter((s) => template.regularStudentIds.includes(s.id));

  return (
    <div>
      {enrolled.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">{t('roster.noStudents')}</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {enrolled.map((student) => (
            <div key={student.id} className="flex items-center gap-3 py-3">
              <div className="flex-1 text-sm font-medium text-foreground">
                {student.name}
              </div>
              <div className="text-xs text-muted-foreground">{student.email}</div>
              {canManage && (
                <button
                  onClick={() => handleRemove(student.id)}
                  disabled={updateTemplate.isPending}
                  className="text-xs text-destructive bg-transparent border-0 cursor-pointer px-2 py-1 rounded hover:bg-destructive-subtle"
                >
                  {t('roster.removeStudent')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Sessions Tab ── */

function SessionsTab({ template }: { template: ClassTemplate; }) {
  const { t } = useTranslation('classes');
  const today = startOfDay(new Date());
  const { data: sessions } = useClassSessionsByDateRange(today, addDays(today, 90));

  const templateSessions = (sessions ?? []).filter((s) => s.templateId === template.id);

  if (templateSessions.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">{t('noSessions')}</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {templateSessions.map((session) => (
        <div key={session.id} className="flex items-center gap-4 py-3">
          <div className={`size-2 rounded-full shrink-0 ${ session.status === SessionStatus.Active ? 'bg-success' :
            session.status === SessionStatus.Planned ? 'bg-warning' :
              session.status === SessionStatus.Completed ? 'bg-muted-foreground' :
                'bg-destructive'
            }`} />
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">
              {session.date.toLocaleDateString()} · {session.startTime}–{session.endTime}
            </div>
          </div>
          <span className={`text-[0.6875rem] font-semibold px-2 py-[2px] rounded-full ${ session.status === SessionStatus.Active ? 'bg-success-subtle text-success' :
            session.status === SessionStatus.Planned ? 'bg-warning-subtle text-[oklch(0.48_0.14_85)]' :
              session.status === SessionStatus.Completed ? 'bg-muted text-muted-foreground' :
                'bg-destructive-subtle text-destructive'
            }`}>
            {t(`status.${ session.status }`)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Template Detail Drawer ── */

interface TemplateDetailDrawerProps {
  template: ClassTemplate;
  teachers: Teacher[];
  rooms: Room[];
  canManage: boolean;
  onClose: () => void;
}

export function TemplateDetailDrawer({ template, teachers, rooms, canManage, onClose }: TemplateDetailDrawerProps) {
  const { t } = useTranslation('classes');
  const [tab, setTab] = useState<'details' | 'roster' | 'sessions'>('details');

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/25 z-40 animate-[fadeIn_0.15s_ease]"
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-[480px] bg-card border-l border-border flex flex-col z-50 animate-[slideInRight_0.2s_ease]">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base text-foreground">{template.name}</div>
            <div className="text-[0.8125rem] text-muted-foreground mt-[2px]">
              {t(`style.${ template.style }`)} · {t(`level.${ template.level }`)}
            </div>
          </div>
          <button onClick={onClose} className="bg-transparent border-0 cursor-pointer text-muted-foreground p-1">
            <IconClose />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          {(['details', 'roster', 'sessions'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`py-3 mr-6 bg-transparent border-0 cursor-pointer text-sm transition-[color] duration-150 border-b-2 ${ tab === key
                ? 'font-semibold text-primary border-b-primary'
                : 'font-normal text-muted-foreground border-b-transparent'
                }`}
            >
              {t(`drawer.${ key }`)}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {tab === 'details' && (
            <DetailsTab template={template} teachers={teachers} rooms={rooms} canManage={canManage} onClose={onClose} />
          )}
          {tab === 'roster' && (
            <RosterTab template={template} canManage={canManage} />
          )}
          {tab === 'sessions' && (
            <SessionsTab template={template} />
          )}
        </div>
      </div>
    </>
  );
}
