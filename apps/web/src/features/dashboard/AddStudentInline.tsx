import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateStudent } from '../../hooks/useStudents'

interface AddStudentInlineProps {
  initialName: string
  onCreated: (studentId: string) => void
  onCancel: () => void
}

export function AddStudentInline({ initialName, onCreated, onCancel }: AddStudentInlineProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const createStudent = useCreateStudent()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    try {
      const id = await createStudent.mutateAsync({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        notes: null,
        activePassId: null,
        passType: null,
        active: true,
      })
      onCreated(id)
    } catch {
      setError('Failed to create student. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t('dashboard.checkin.addStudentForm.name')}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t('dashboard.checkin.addStudentForm.email')}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t('dashboard.checkin.addStudentForm.phone')}
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={createStudent.isPending}
          className="h-8 px-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {t('dashboard.checkin.addStudentForm.cancel')}
        </button>
        <button
          type="submit"
          disabled={!name.trim() || createStudent.isPending}
          className="h-8 px-4 rounded-md text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {createStudent.isPending ? '…' : t('dashboard.checkin.addStudentForm.submit')}
        </button>
      </div>
    </form>
  )
}
