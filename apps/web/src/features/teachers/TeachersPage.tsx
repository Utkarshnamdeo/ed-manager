import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTeachers, useCreateTeacher, useUpdateTeacher } from '../../hooks/useTeachers';
import type { Teacher } from '../../types';

/* ─── Avatar ───────────────────────────────────────────────────────────────── */

const AVATAR_HUES = [15, 45, 145, 200, 240, 285, 320, 355];

function nameHash(name: string): number {
  let h = 0;
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return Math.abs(h);
}

function Avatar({ name }: { name: string; }) {
  const hue = AVATAR_HUES[nameHash(name) % 8];
  const initials = name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  return (
    <div
      aria-hidden="true"
      style={{
        width: 36, height: 36, borderRadius: '9999px', flexShrink: 0,
        backgroundColor: `oklch(0.88 0.10 ${ hue })`,
        color: `oklch(0.38 0.14 ${ hue })`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 700, userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
}

/* ─── Status Badge ─────────────────────────────────────────────────────────── */

function StatusBadge({ active }: { active: boolean; }) {
  const { t } = useTranslation('teachers');
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
      backgroundColor: active ? 'var(--color-success-subtle)' : 'var(--color-muted)',
      color: active ? 'var(--color-success)' : 'var(--color-muted-foreground)',
    }}>
      {active ? t('status.active') : t('status.inactive')}
    </span>
  );
}

/* ─── Add Teacher Form ─────────────────────────────────────────────────────── */

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <FormField label={t('form.firstName')}>
          <input className="form-input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
        </FormField>
        <FormField label={t('form.lastName')}>
          <input className="form-input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
        </FormField>
      </div>
      <FormField label={t('form.email')} style={{ marginBottom: '0.75rem' }}>
        <input className="form-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <FormField label={t('form.ratePerStudent')}>
          <input className="form-input" type="text" inputMode='numeric' value={form.ratePerStudent}
            onChange={(e) => set('ratePerStudent', parseFloat(e.target.value) || 0)} required />
        </FormField>
        <FormField label={t('form.monthlyFloor')} hint={t('form.monthlyFloorHint')}>
          <input className="form-input" type="text" inputMode='numeric' value={form.monthlyFloor}
            onChange={(e) => set('monthlyFloor', e.target.value)} placeholder="—" />
        </FormField>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} className="btn-secondary">{t('actions.cancel')}</button>
        <button type="submit" disabled={createTeacher.isPending} className="btn-primary">
          {createTeacher.isPending ? '…' : t('addTeacher')}
        </button>
      </div>
    </form>
  );
}

/* ─── Teacher Drawer ───────────────────────────────────────────────────────── */

function TeacherDrawer({ teacher, canManage, onClose }: {
  teacher: Teacher;
  canManage: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation('teachers');
  const updateTeacher = useUpdateTeacher();
  const [tab, setTab] = useState<'details' | 'compensation'>('details');
  const [editing, setEditing] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

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

  const fullName = `${ teacher.firstName } ${ teacher.lastName }`;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)',
          zIndex: 40, animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px',
        backgroundColor: 'var(--color-card)', borderLeft: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column', zIndex: 50,
        animation: 'slideInRight 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <Avatar name={fullName} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-foreground)' }}>
              {fullName}
            </div>
            <StatusBadge active={teacher.active} />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted-foreground)', padding: '4px' }}>
            <IconClose />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingInline: '1.5rem' }}>
          {(['details', 'compensation'] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => { setTab(tabKey); setEditing(false); }}
              style={{
                padding: '0.75rem 0', marginRight: '1.5rem', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: tab === tabKey ? 600 : 400,
                color: tab === tabKey ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                borderBottom: tab === tabKey ? '2px solid var(--color-primary)' : '2px solid transparent',
                transition: 'color 0.15s',
              }}
            >
              {t(`tabs.${ tabKey }`)}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {tab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <FormField label={t('form.firstName')}>
                  {editing
                    ? <input className="form-input" value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} />
                    : <ReadValue>{teacher.firstName}</ReadValue>}
                </FormField>
                <FormField label={t('form.lastName')}>
                  {editing
                    ? <input className="form-input" value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} />
                    : <ReadValue>{teacher.lastName}</ReadValue>}
                </FormField>
              </div>
              <FormField label={t('form.email')}>
                {editing
                  ? <input className="form-input" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
                  : <ReadValue>{teacher.email}</ReadValue>}
              </FormField>
            </div>
          )}

          {tab === 'compensation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <FormField label={t('form.ratePerStudent')}>
                  {editing
                    ? <input className="form-input" type="number" min="0" step="0.01" value={form.ratePerStudent}
                      onChange={(e) => setField('ratePerStudent', parseFloat(e.target.value) || 0)} />
                    : <ReadValue>€{teacher.ratePerStudent.toFixed(2)}</ReadValue>}
                </FormField>
                <FormField label={t('form.monthlyFloor')} hint={editing ? t('form.monthlyFloorHint') : undefined}>
                  {editing
                    ? <input className="form-input" type="number" min="0" step="0.01" value={form.monthlyFloor}
                      onChange={(e) => setField('monthlyFloor', e.target.value)} placeholder="—" />
                    : <ReadValue>{teacher.monthlyFloor != null ? `€${ teacher.monthlyFloor.toFixed(2) }` : '—'}</ReadValue>}
                </FormField>
              </div>

              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-foreground-secondary)', marginBottom: '0.5rem' }}>
                  {t('form.reportVisibility')}
                </div>
                {(['showAttendanceDetail', 'showEarningsPerSession', 'showTotalEarnings'] as const).map((key) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: editing ? 'pointer' : 'default' }}>
                    <input
                      type="checkbox"
                      checked={form.reportVisibility[key]}
                      disabled={!editing}
                      onChange={(e) => setField('reportVisibility', { ...form.reportVisibility, [key]: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-foreground)' }}>{t(`form.${ key }`)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
        }}>
          {canManage && (
            confirmDeactivate ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-foreground)', margin: 0 }}>
                  {t('actions.deactivateConfirm', { name: fullName })}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setConfirmDeactivate(false)} className="btn-secondary" style={{ flex: 1 }}>
                    {t('actions.cancel')}
                  </button>
                  <button onClick={handleToggleActive} disabled={updateTeacher.isPending} className="btn-destructive" style={{ flex: 1 }}>
                    {t('actions.deactivate')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => teacher.active ? setConfirmDeactivate(true) : handleToggleActive()}
                className={teacher.active ? 'btn-destructive-outline' : 'btn-secondary'}
                disabled={updateTeacher.isPending}
              >
                {teacher.active ? t('actions.deactivate') : t('actions.activate')}
              </button>
            )
          )}
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
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

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function FormField({ label, hint, style, children }: {
  label: string;
  hint?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-foreground-secondary)', marginBottom: '0.375rem' }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)', margin: '0.25rem 0 0' }}>{hint}</p>}
    </div>
  );
}

function ReadValue({ children }: { children: React.ReactNode; }) {
  return (
    <div style={{ fontSize: '0.9375rem', color: 'var(--color-foreground)', padding: '0.5rem 0' }}>
      {children}
    </div>
  );
}

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

/* ─── Teachers Page ────────────────────────────────────────────────────────── */

export function TeachersPage() {
  const { t } = useTranslation('teachers');
  const { appUser } = useAuth();
  const canManage = appUser?.role === 'admin' || !!appUser?.permissions?.manageTeachers;

  const { data: teachers, isLoading, isError } = useTeachers();
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="page-enter" style={{ padding: '1.75rem', maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em', color: 'var(--color-foreground)' }}>
          {t('title')}
        </h1>
        {canManage && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <IconPlus />
            {t('addTeacher')}
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div style={{
          backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)',
          borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem',
        }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--color-foreground)' }}>
            {t('addTeacher')}
          </h2>
          <AddTeacherForm onClose={() => setShowAddForm(false)} />
        </div>
      )}

      {/* List */}
      <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', overflow: 'hidden' }}>
        {isLoading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>…</div>
        )}

        {isError && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-destructive)', fontSize: '0.875rem' }}>
            {t('errors.failedToLoad', { ns: 'common' })}
          </div>
        )}

        {teachers && teachers.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
            {t('noTeachers')}
          </div>
        )}

        {teachers && teachers.map((teacher, i) => (
          <button
            key={teacher.id}
            onClick={() => setSelectedTeacher(teacher)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              width: '100%', padding: '0.875rem 1.25rem',
              background: 'none', border: 'none', cursor: 'pointer',
              borderTop: i > 0 ? '1px solid var(--color-border)' : 'none',
              textAlign: 'left', transition: 'background-color 0.1s',
              opacity: teacher.active ? 1 : 0.5,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Avatar name={`${ teacher.firstName } ${ teacher.lastName }`} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-foreground)' }}>
                {teacher.firstName} {teacher.lastName}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted-foreground)', marginTop: '1px' }}>
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
