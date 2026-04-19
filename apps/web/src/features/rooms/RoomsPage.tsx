import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useRooms, useCreateRoom, useUpdateRoom } from '../../hooks/useRooms'
import type { Room } from '../../types'

/* ─── Icons ────────────────────────────────────────────────────────────────── */

function IconEdit() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

/* ─── Room Row ─────────────────────────────────────────────────────────────── */

function RoomRow({ room, isAdmin }: { room: Room; isAdmin: boolean }) {
  const { t } = useTranslation('rooms')
  const updateRoom = useUpdateRoom()
  const [editing, setEditing] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [name, setName] = useState(room.name)
  const [capacity, setCapacity] = useState<string>(room.capacity != null ? String(room.capacity) : '')

  async function handleSave() {
    await updateRoom.mutateAsync({
      id: room.id,
      name: name.trim(),
      capacity: capacity === '' ? null : parseInt(capacity, 10),
    })
    setEditing(false)
  }

  function handleCancel() {
    setName(room.name)
    setCapacity(room.capacity != null ? String(room.capacity) : '')
    setEditing(false)
    setConfirmDeactivate(false)
  }

  async function handleToggleActive() {
    await updateRoom.mutateAsync({ id: room.id, active: !room.active })
    setConfirmDeactivate(false)
  }

  if (confirmDeactivate) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1.25rem', borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-destructive-subtle)',
      }}>
        <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--color-foreground)' }}>
          {t('actions.deactivateConfirm', { name: room.name })}
        </span>
        <button onClick={handleCancel} className="btn-secondary">{t('actions.cancel')}</button>
        <button onClick={handleToggleActive} disabled={updateRoom.isPending} className="btn-destructive">
          {t('actions.deactivate')}
        </button>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.75rem 1.25rem', borderTop: '1px solid var(--color-border)',
      opacity: room.active ? 1 : 0.5,
      transition: 'opacity 0.15s',
    }}>
      {editing ? (
        <>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('form.name')}
            style={{ flex: 2 }}
            autoFocus
          />
          <input
            className="form-input"
            type="number"
            min="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder={t('form.capacity')}
            style={{ width: '110px' }}
          />
          <button onClick={handleSave} disabled={updateRoom.isPending || !name.trim()} className="btn-primary">
            {updateRoom.isPending ? '…' : t('actions.save')}
          </button>
          <button onClick={handleCancel} className="btn-secondary">{t('actions.cancel')}</button>
        </>
      ) : (
        <>
          <div style={{ flex: 2, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-foreground)' }}>
            {room.name}
          </div>
          <div style={{ width: '110px', fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
            {room.capacity != null ? room.capacity : '—'}
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={() => setEditing(true)}
                title={t('actions.edit')}
                style={{
                  width: 32, height: 32, borderRadius: '6px', border: 'none',
                  backgroundColor: 'transparent', cursor: 'pointer',
                  color: 'var(--color-muted-foreground)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <IconEdit />
              </button>
              <button
                onClick={() => room.active ? setConfirmDeactivate(true) : handleToggleActive()}
                title={room.active ? t('actions.deactivate') : t('actions.activate')}
                style={{
                  padding: '0 0.625rem', height: 32, borderRadius: '6px', border: 'none',
                  backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.75rem',
                  fontWeight: 500, color: room.active ? 'var(--color-destructive)' : 'var(--color-success)',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = room.active ? 'var(--color-destructive-subtle)' : 'var(--color-success-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {room.active ? t('actions.deactivate') : t('actions.activate')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ─── Add Room Row ─────────────────────────────────────────────────────────── */

function AddRoomRow({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('rooms')
  const createRoom = useCreateRoom()
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')

  async function handleSave() {
    if (!name.trim()) return
    await createRoom.mutateAsync({
      name: name.trim(),
      capacity: capacity === '' ? null : parseInt(capacity, 10),
      active: true,
    })
    onClose()
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.75rem 1.25rem', borderTop: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-background)',
    }}>
      <input
        className="form-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('form.name')}
        style={{ flex: 2 }}
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
      />
      <input
        className="form-input"
        type="number"
        min="1"
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        placeholder={t('form.capacity')}
        style={{ width: '110px' }}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
      />
      <button onClick={handleSave} disabled={createRoom.isPending || !name.trim()} className="btn-primary">
        {createRoom.isPending ? '…' : t('actions.save')}
      </button>
      <button onClick={onClose} className="btn-secondary">{t('actions.cancel')}</button>
    </div>
  )
}

/* ─── Rooms Page ───────────────────────────────────────────────────────────── */

export function RoomsPage() {
  const { t } = useTranslation('rooms')
  const { appUser } = useAuth()
  const isAdmin = appUser?.role === 'admin'

  const { data: rooms, isLoading, isError } = useRooms()
  const [showAddRow, setShowAddRow] = useState(false)

  return (
    <div className="page-enter" style={{ padding: '1.75rem', maxWidth: '700px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em', color: 'var(--color-foreground)' }}>
          {t('title')}
        </h1>
        {isAdmin && !showAddRow && (
          <button
            onClick={() => setShowAddRow(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <IconPlus />
            {t('addRoom')}
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', overflow: 'hidden' }}>

        {/* Column headers */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.5rem 1.25rem',
          backgroundColor: 'var(--color-muted)', borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{ flex: 2, fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {t('form.name')}
          </div>
          <div style={{ width: '110px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {t('form.capacity')}
          </div>
          {isAdmin && <div style={{ width: '120px' }} />}
        </div>

        {isLoading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>…</div>
        )}

        {isError && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-destructive)', fontSize: '0.875rem' }}>
            Failed to load rooms.
          </div>
        )}

        {rooms && rooms.length === 0 && !showAddRow && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
            {t('noRooms')}
          </div>
        )}

        {rooms && rooms.map((room) => (
          <RoomRow key={room.id} room={room} isAdmin={isAdmin} />
        ))}

        {showAddRow && <AddRoomRow onClose={() => setShowAddRow(false)} />}
      </div>
    </div>
  )
}
