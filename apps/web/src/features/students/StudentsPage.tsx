import { useState } from 'react';
import { differenceInDays } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useStudents, useCreateStudent } from '../../hooks/useStudents';
import { useActiveMemberships } from '../../hooks/useMemberships';
import { StudentDrawer } from './StudentDrawer';
import { type PassType, type Student, type Membership, Role } from '../../types';

/* ─── Helpers ── */

const AVATAR_HUE_CLASSES = ['avatar-h-0', 'avatar-h-1', 'avatar-h-2', 'avatar-h-3', 'avatar-h-4', 'avatar-h-5', 'avatar-h-6', 'avatar-h-7'];

function nameHash(name: string): number {
  let h = 0;
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return Math.abs(h);
}

function Avatar({ name, size = 36 }: { name: string; size?: number; }) {
  const hueClass = AVATAR_HUE_CLASSES[nameHash(name) % 8];
  const initials = name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const sizeClass = size <= 36 ? 'size-9 text-xs' : 'size-12 text-sm';
  return (
    <div aria-hidden="true" className={`${ sizeClass } rounded-full shrink-0 flex items-center justify-center font-bold select-none ${ hueClass }`}>
      {initials}
    </div>
  );
}

export function MembershipBadge({ tier, credits }: { tier: PassType | null; credits?: number | null; }) {
  if (!tier) return <span className="text-[0.6875rem] text-muted-foreground">—</span>;

  const lowCredit = typeof credits === 'number' && credits <= 2;
  const badgeClass =
    lowCredit && credits === 1 ? 'bg-warning-subtle text-[oklch(0.50_0.14_85)]' :
      lowCredit && credits === 0 ? 'bg-destructive-subtle text-destructive' :
        tier === 'gold' ? 'badge-gold' :
          tier === 'silver' ? 'badge-silver' :
            tier === 'bronze' ? 'badge-bronze' :
              tier === 'ten_class' ? 'badge-silver' :
                tier === 'five_class' ? 'badge-bronze' :
                  'bg-muted text-muted-foreground';

  const label =
    tier === 'ten_class' ? '10-Class Card' :
      tier === 'five_class' ? '5-Class Card' :
        tier.charAt(0).toUpperCase() + tier.slice(1);

  const showCredits = typeof credits === 'number' && tier !== 'gold';
  return (
    <span className={`inline-flex items-center gap-1 py-[0.15rem] px-2 rounded-full text-[0.6875rem] font-semibold whitespace-nowrap ${ badgeClass }`}>
      {label}
      {showCredits && <> · {credits}</>}
    </span>
  );
}

/* ─── Icons ── */

function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

/* ─── Add Student Form ── */

function AddStudentForm({ onClose }: { onClose: () => void; }) {
  const { t } = useTranslation('students');
  const createStudent = useCreateStudent();
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createStudent.mutateAsync({
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
      activePassId: null,
      passType: null,
      active: true,
    });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.name')}</label>
        <input className="form-input w-full" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required autoFocus />
      </div>
      <div className="mb-3">
        <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.email')}</label>
        <input className="form-input w-full" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
      </div>
      <div className="mb-3">
        <label className="block text-[0.8125rem] font-semibold text-foreground-secondary mb-1.5">{t('form.phone')}</label>
        <input className="form-input w-full" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
      </div>
      <div className="flex gap-2 justify-end mt-4">
        <button type="button" onClick={onClose} className="btn-secondary">{t('actions.cancel')}</button>
        <button type="submit" disabled={createStudent.isPending} className="btn-primary">
          {createStudent.isPending ? '…' : t('addStudent')}
        </button>
      </div>
    </form>
  );
}

/* ─── Student Row ── */

function StudentRow({ student, membership, onOpen }: {
  student: Student;
  membership: Membership | undefined;
  onOpen: () => void;
}) {
  const { t } = useTranslation('students');

  const today = new Date();
  const daysLeft = membership ? differenceInDays(membership.expiryDate, today) : null;
  const creditsLeft = membership?.creditsRemaining ?? null;

  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isLowCredits = creditsLeft !== null && creditsLeft <= 2 && !isExpired;

  return (
    <div className="grid grid-cols-[1fr_10rem_4rem] gap-4 items-center px-5 py-3.5 border-t border-border hover:bg-muted transition-[background-color] duration-100">
      {/* Name */}
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={student.name} />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{student.name}</div>
          {student.email && (
            <div className="text-xs text-muted-foreground truncate">{student.email}</div>
          )}
        </div>
      </div>

      {/* Pass + alert */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <MembershipBadge tier={student.passType} credits={creditsLeft} />
        {(isExpiringSoon || isExpired) && (
          <span className="text-[0.6rem] font-bold uppercase tracking-wide px-1.5 py-[1px] rounded-full bg-warning-subtle text-[oklch(0.50_0.14_85)]">
            {isExpired ? t('membership.expired') : t('membership.expiringAlert')}
          </span>
        )}
        {isLowCredits && !isExpiringSoon && (
          <span className="text-[0.6rem] font-bold uppercase tracking-wide px-1.5 py-[1px] rounded-full bg-warning-subtle text-[oklch(0.50_0.14_85)]">
            {t('membership.lowCreditsAlert')}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={onOpen}
          title="Edit"
          className="size-8 rounded-[6px] border-0 bg-transparent cursor-pointer text-muted-foreground flex items-center justify-center transition-[background-color] duration-100 hover:bg-muted"
        >
          <IconEdit />
        </button>
      </div>
    </div>
  );
}

/* ─── Students Page ── */

type FilterTier = 'all' | 'gold' | 'silver' | 'bronze' | 'ten_class' | 'five_class' | 'noPass';

export function StudentsPage() {
  const { t } = useTranslation('students');
  const { t: tCommon } = useTranslation('common');
  const { appUser } = useAuth();
  const canManage = appUser?.role === Role.Admin || !!appUser?.permissions?.manageStudents;

  const { data: students, isLoading, isError } = useStudents();
  const { data: activeMemberships = [] } = useActiveMemberships();
  const membershipByStudent = Object.fromEntries(
    activeMemberships.map((m) => [m.studentId, m as Membership])
  );
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<FilterTier>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const filterOptions: FilterTier[] = ['all', 'gold', 'silver', 'bronze', 'ten_class', 'five_class', 'noPass'];

  const filtered = (students ?? []).filter((s) => {
    const matchesTier =
      tierFilter === 'all' ? true :
        tierFilter === 'noPass' ? s.passType === null :
          s.passType === tierFilter;

    if (!matchesTier) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.email?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div className="page-enter p-7 max-w-[800px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold m-0 tracking-[-0.025em] text-foreground">
          {t('title')}
        </h1>
        {canManage && !showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center gap-1.5">
            <IconPlus />
            {t('addStudent')}
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-card border border-border rounded-[0.75rem] p-5 mb-6">
          <h2 className="text-[0.9375rem] font-bold m-0 mb-4 text-foreground">{t('addStudent')}</h2>
          <AddStudentForm onClose={() => setShowAddForm(false)} />
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        {/* Tier chips */}
        <div className="flex gap-1.5">
          {filterOptions.map((key) => (
            <button
              key={key}
              onClick={() => setTierFilter(key)}
              className={`text-[0.75rem] font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-[background-color,color,border-color] duration-100 ${ tierFilter === key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border'
                }`}
            >
              {t(`filter.${ key }`)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-[240px] ml-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground flex pointer-events-none">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tCommon('search.placeholder')}
            className="h-9 w-full pl-8 pr-3 rounded-full border border-border bg-background text-[0.8125rem] text-foreground outline-none transition-[border-color] duration-150 focus:border-primary"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-[0.75rem] overflow-hidden">

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_10rem_4rem] gap-4 items-center px-5 py-2 bg-muted border-b border-border">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('columns.name')}</div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('columns.membership')}</div>
          <div />
        </div>

        {isLoading && (
          <div className="p-12 text-center text-muted-foreground text-sm">…</div>
        )}

        {isError && (
          <div className="p-12 text-center text-destructive text-sm">
            {t('errors.failedToLoad')}
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {t('noStudents')}
          </div>
        )}

        {filtered.map((student) => (
          <StudentRow
            key={student.id}
            student={student}
            membership={membershipByStudent[student.id]}
            onOpen={() => setSelectedStudent(student)}
          />
        ))}
      </div>

      {/* Drawer */}
      {selectedStudent && (
        <StudentDrawer
          student={selectedStudent}
          canManage={canManage}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
