import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher } from '../../hooks/useTeachers';
import type { Teacher } from '../../types';

/* ─── Avatar ── */

const AVATAR_HUES = [15, 45, 145, 200, 240, 285, 320, 355];
const AVATAR_HUE_CLASSES = ['avatar-h-0', 'avatar-h-1', 'avatar-h-2', 'avatar-h-3', 'avatar-h-4', 'avatar-h-5', 'avatar-h-6', 'avatar-h-7'];

// Keep AVATAR_HUES referenced to avoid unused-var lint errors
void AVATAR_HUES;

function nameHash(name: string): number {
  let h = 0;
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return Math.abs(h);
}

function Avatar({ name }: { name: string; }) {
  const hueClass = AVATAR_HUE_CLASSES[nameHash(name) % 8];
  const initials = name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  return (
    <div
      aria-hidden="true"
      className={`size-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold select-none ${ hueClass }`}
    >
      {initials}
    </div>
  );
}

/* ─── Status Badge ── */

function StatusBadge({ active }: { active: boolean; }) {
  const { t } = useTranslation('teachers');
  return (
    <span className={`inline-flex items-center px-2 py-[2px] rounded-full text-xs font-semibold ${ active ? 'bg-success-subtle text-success' : 'bg-muted text-muted-foreground' }`}>
      {active ? t('status.active') : t('status.inactive')}
    </span>
  );
}

/* ─── Form helpers ── */

function FormField({ label, hint, className, children }: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1 m-0">{hint}</p>}
    </div>
  );
}

function ReadValue({ children }: { children: React.ReactNode; }) {
  return (
    <div className="text-[0.9375rem] text-foreground py-2">
      {children}
    </div>
  );
}

/* ─── Icons ── */

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/* ─── Add Teacher Form ── */

function AddTeacherForm({ onClose }: { onClose: () => void; }) {
  const { t } = useTranslation('teachers');
  const createTeacher = useCreateTeacher();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    ratePerStudent: 0, monthlyFloor: '' as string | number,
    reportVisibility: {
      showAttendanceDetail: false,
      showEarningsPerSession: false,
      showTotalEarnings: false,
    },
    active: true,
  });

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createTeacher.mutateAsync({
      ...form,
      monthlyFloor: form.monthlyFloor === '' ? null : Number(form.monthlyFloor),
    });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <FormField label={t('form.firstName')}>
          <input className="form-input w-full" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
        </FormField>
        <FormField label={t('form.lastName')}>
          <input className="form-input w-full" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
        </FormField>
      </div>
      <FormField label={t('form.email')} className="mb-3">
        <input className="form-input w-full" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
      </FormField>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <FormField label={t('form.ratePerStudent')}>
          <input className="form-input w-full" type="text" inputMode="numeric" value={form.ratePerStudent}
            onChange={(e) => set('ratePerStudent', parseFloat(e.target.value) || 0)} required />
        </FormField>
        <FormField label={t('form.monthlyFloor')} hint={t('form.monthlyFloorHint')}>
          <input className="form-input w-full" type="text" inputMode="numeric" value={form.monthlyFloor}
            onChange={(e) => set('monthlyFloor', e.target.value)} placeholder="—" />
        </FormField>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn-secondary">{t('actions.cancel')}</button>
        <button type="submit" disabled={createTeacher.isPending} className="btn-primary">
          {createTeacher.isPending ? '…' : t('addTeacher')}
        </button>
      </div>
    </form>
  );
}

/* ─── Teacher Drawer ── */

function TeacherDrawer({ teacher, canManage, onClose }: {
  teacher: Teacher;
  canManage: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation('teachers');
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();
  const [tab, setTab] = useState<'details' | 'compensation'>('details');
  const [editing, setEditing] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState({
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    email: teacher.email,
    ratePerStudent: teacher.ratePerStudent,
    monthlyFloor: teacher.monthlyFloor ?? ('' as string | number),
    reportVisibility: { ...teacher.reportVisibility },
  });

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    await updateTeacher.mutateAsync({
      id: teacher.id,
      ...form,
      monthlyFloor: form.monthlyFloor === '' ? null : Number(form.monthlyFloor),
    });
    setEditing(false);
  }

  function handleCancel() {
    setForm({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      ratePerStudent: teacher.ratePerStudent,
      monthlyFloor: teacher.monthlyFloor ?? '',
      reportVisibility: { ...teacher.reportVisibility },
    });
    setEditing(false);
  }

  async function handleToggleActive() {
    await updateTeacher.mutateAsync({ id: teacher.id, active: !teacher.active });
    setConfirmDeactivate(false);
  }

  async function handleDelete() {
    await deleteTeacher.mutateAsync(teacher.id);
    onClose();
  }

  const fullName = `${ teacher.firstName } ${ teacher.lastName }`;

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
          <Avatar name={fullName} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base text-foreground">{fullName}</div>
            <StatusBadge active={teacher.active} />
          </div>
          <button onClick={onClose} className="bg-transparent border-0 cursor-pointer text-muted-foreground p-1">
            <IconClose />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          {(['details', 'compensation'] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => { setTab(tabKey); setEditing(false); }}
              className={`py-3 mr-6 bg-transparent border-0 cursor-pointer text-sm transition-[color] duration-150 border-b-2 ${ tab === tabKey
                  ? 'font-semibold text-primary border-b-primary'
                  : 'font-normal text-muted-foreground border-b-transparent'
                }`}
            >
              {t(`tabs.${ tabKey }`)}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {tab === 'details' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label={t('form.firstName')}>
                  {editing
                    ? <input className="form-input w-full" value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} />
                    : <ReadValue>{teacher.firstName}</ReadValue>}
                </FormField>
                <FormField label={t('form.lastName')}>
                  {editing
                    ? <input className="form-input w-full" value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} />
                    : <ReadValue>{teacher.lastName}</ReadValue>}
                </FormField>
              </div>
              <FormField label={t('form.email')}>
                {editing
                  ? <input className="form-input w-full" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
                  : <ReadValue>{teacher.email}</ReadValue>}
              </FormField>
            </div>
          )}

          {tab === 'compensation' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label={t('form.ratePerStudent')}>
                  {editing
                    ? <input className="form-input w-full" type="text" inputMode='numeric' value={form.ratePerStudent}
                      onChange={(e) => setField('ratePerStudent', parseFloat(e.target.value) || 0)} />
                    : <ReadValue>€{teacher.ratePerStudent.toFixed(2)}</ReadValue>}
                </FormField>
                <FormField label={t('form.monthlyFloor')} hint={editing ? t('form.monthlyFloorHint') : undefined}>
                  {editing
                    ? <input className="form-input w-full" type='text' inputMode='numeric' value={form.monthlyFloor}
                      onChange={(e) => setField('monthlyFloor', e.target.value)} placeholder="—" />
                    : <ReadValue>{teacher.monthlyFloor != null ? `€${ teacher.monthlyFloor.toFixed(2) }` : '—'}</ReadValue>}
                </FormField>
              </div>

              <div>
                <div className="text-[0.8125rem] font-semibold text-foreground-secondary mb-2">
                  {t('form.reportVisibility')}
                </div>
                {(['showAttendanceDetail', 'showEarningsPerSession', 'showTotalEarnings'] as const).map((key) => (
                  <label key={key} className={`flex items-center gap-2 mb-2 ${ editing ? 'cursor-pointer' : 'cursor-default' }`}>
                    <input
                      type="checkbox"
                      checked={form.reportVisibility[key]}
                      disabled={!editing}
                      onChange={(e) => setField('reportVisibility', { ...form.reportVisibility, [key]: e.target.checked })}
                    />
                    <span className="text-sm text-foreground">{t(`form.${ key }`)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-2">
          {canManage && (
            confirmDelete ? (
              <div className="flex flex-col gap-2 flex-1">
                <p className="text-[0.8125rem] text-foreground m-0">
                  {t('actions.deleteConfirm', { name: fullName })}
                </p>
                <p className="text-xs text-destructive m-0">{t('actions.deleteWarning')}</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1">
                    {t('actions.cancel')}
                  </button>
                  <button onClick={handleDelete} disabled={deleteTeacher.isPending} className="btn-destructive flex-1">
                    {deleteTeacher.isPending ? '…' : t('actions.delete')}
                  </button>
                </div>
              </div>
            ) : confirmDeactivate ? (
              <div className="flex flex-col gap-2 flex-1">
                <p className="text-[0.8125rem] text-foreground m-0">
                  {t('actions.deactivateConfirm', { name: fullName })}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDeactivate(false)} className="btn-secondary flex-1">
                    {t('actions.cancel')}
                  </button>
                  <button onClick={handleToggleActive} disabled={updateTeacher.isPending} className="btn-destructive flex-1">
                    {t('actions.deactivate')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="btn-destructive-outline"
                >
                  {t('actions.delete')}
                </button>
                <button
                  onClick={() => teacher.active ? setConfirmDeactivate(true) : handleToggleActive()}
                  className="btn-secondary"
                  disabled={updateTeacher.isPending}
                >
                  {teacher.active ? t('actions.deactivate') : t('actions.activate')}
                </button>
              </div>
            )
          )}
          <div className="flex gap-2 ml-auto">
            {canManage && (
              editing ? (
                <>
                  <button onClick={handleCancel} className="btn-secondary">{t('actions.cancel')}</button>
                  <button onClick={handleSave} disabled={updateTeacher.isPending} className="btn-primary">
                    {updateTeacher.isPending ? '…' : t('actions.save')}
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="btn-secondary">{t('actions.edit')}</button>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Teachers Page ── */

export function TeachersPage() {
  const { t } = useTranslation('teachers');
  const { appUser } = useAuth();
  const canManage = appUser?.role === 'admin' || !!appUser?.permissions?.manageTeachers;

  const { data: teachers, isLoading, isError } = useTeachers();
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="page-enter p-7 max-w-[900px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold m-0 tracking-[-0.025em] text-foreground">
          {t('title')}
        </h1>
        {canManage && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center gap-1.5"
          >
            <IconPlus />
            {t('addTeacher')}
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-card border border-border rounded-[0.75rem] p-5 mb-6">
          <h2 className="text-[0.9375rem] font-bold m-0 mb-4 text-foreground">
            {t('addTeacher')}
          </h2>
          <AddTeacherForm onClose={() => setShowAddForm(false)} />
        </div>
      )}

      {/* List */}
      <div className="bg-card border border-border rounded-[0.75rem] overflow-hidden divide-y divide-border">
        {isLoading && (
          <div className="p-12 text-center text-muted-foreground text-sm">…</div>
        )}

        {isError && (
          <div className="p-12 text-center text-destructive text-sm">
            {t('errors.failedToLoad', { ns: 'common' })}
          </div>
        )}

        {teachers && teachers.length === 0 && (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {t('noTeachers')}
          </div>
        )}

        {teachers && teachers.map((teacher) => (
          <button
            key={teacher.id}
            onClick={() => setSelectedTeacher(teacher)}
            className={`flex items-center gap-3.5 w-full px-5 py-3.5 bg-transparent border-0 cursor-pointer text-left transition-[background-color] duration-100 hover:bg-muted ${ teacher.active ? 'opacity-100' : 'opacity-50' }`}
          >
            <Avatar name={`${ teacher.firstName } ${ teacher.lastName }`} />
            <div className="flex-1 min-w-0">
              <div className="text-[0.9375rem] font-semibold text-foreground">
                {teacher.firstName} {teacher.lastName}
              </div>
              <div className="text-[0.8125rem] text-muted-foreground mt-[1px]">
                {teacher.email}
              </div>
            </div>
            <StatusBadge active={teacher.active} />
          </button>
        ))}
      </div>

      {/* Drawer */}
      {selectedTeacher && (
        <TeacherDrawer
          teacher={selectedTeacher}
          canManage={canManage}
          onClose={() => setSelectedTeacher(null)}
        />
      )}
    </div>
  );
}
