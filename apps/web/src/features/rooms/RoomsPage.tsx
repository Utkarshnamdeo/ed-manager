import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '../../hooks/useRooms';
import { Role, type Room } from '../../types';

/* ─── Icons ── */

function IconEdit() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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

/* ─── Room Row ── */

function RoomRow({ room, canManage }: { room: Room; canManage: boolean; }) {
  const { t } = useTranslation('rooms');
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();
  const [editing, setEditing] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(room.name);
  const [capacity, setCapacity] = useState<string>(room.capacity != null ? String(room.capacity) : '');

  async function handleSave() {
    await updateRoom.mutateAsync({
      id: room.id,
      name: name.trim(),
      capacity: capacity === '' ? null : parseInt(capacity, 10),
    });
    setEditing(false);
  }

  function handleCancel() {
    setName(room.name);
    setCapacity(room.capacity != null ? String(room.capacity) : '');
    setEditing(false);
    setConfirmDeactivate(false);
  }

  async function handleToggleActive() {
    await updateRoom.mutateAsync({ id: room.id, active: !room.active });
    setConfirmDeactivate(false);
  }

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-3 px-5 py-3 border-t border-border bg-destructive-subtle">
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="text-sm text-foreground">{t('actions.deleteConfirm', { name: room.name })}</span>
          <span className="text-xs text-destructive">{t('actions.deleteWarning')}</span>
        </div>
        <button onClick={() => setConfirmDelete(false)} className="btn-secondary">{t('actions.cancel')}</button>
        <button onClick={() => deleteRoom.mutate(room.id)} disabled={deleteRoom.isPending} className="btn-destructive">
          {deleteRoom.isPending ? '…' : t('actions.delete')}
        </button>
      </div>
    );
  }

  if (confirmDeactivate) {
    return (
      <div className="flex items-center gap-3 px-5 py-3 border-t border-border bg-destructive-subtle">
        <span className="flex-1 text-sm text-foreground">
          {t('actions.deactivateConfirm', { name: room.name })}
        </span>
        <button onClick={handleCancel} className="btn-secondary">{t('actions.cancel')}</button>
        <button onClick={handleToggleActive} disabled={updateRoom.isPending} className="btn-destructive">
          {t('actions.deactivate')}
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-5 py-3 border-t border-border transition-opacity duration-150 ${ room.active ? 'opacity-100' : 'opacity-50' }`}>
      {editing ? (
        <>
          <input
            className="form-input flex-[2]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('form.name')}
            autoFocus
          />
          <input
            className="form-input w-[110px]"
            type="text"
            inputMode='numeric'
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder={t('form.capacity')}
          />
          <button onClick={handleSave} disabled={updateRoom.isPending || !name.trim()} className="btn-primary">
            {updateRoom.isPending ? '…' : t('actions.save')}
          </button>
          <button onClick={handleCancel} className="btn-secondary">{t('actions.cancel')}</button>
        </>
      ) : (
        <>
          <div className="flex-[2] text-[0.9375rem] font-semibold text-foreground">
            {room.name}
          </div>
          <div className="w-[110px] text-sm text-muted-foreground">
            {room.capacity != null ? room.capacity : '—'}
          </div>
          {canManage && (
            <div className="flex gap-1">
              <button
                onClick={() => setEditing(true)}
                title={t('actions.edit')}
                className="size-8 rounded-[6px] border-0 bg-transparent cursor-pointer text-muted-foreground flex items-center justify-center transition-[background-color] duration-100 hover:bg-muted"
              >
                <IconEdit />
              </button>
              <button
                onClick={() => room.active ? setConfirmDeactivate(true) : handleToggleActive()}
                title={room.active ? t('actions.deactivate') : t('actions.activate')}
                className={`px-2.5 h-8 rounded-[6px] border-0 bg-transparent cursor-pointer text-xs font-medium transition-[background-color] duration-100 ${ room.active
                  ? 'text-muted-foreground hover:bg-muted'
                  : 'text-success hover:bg-success-subtle'
                  }`}
              >
                {room.active ? t('actions.deactivate') : t('actions.activate')}
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                title={t('actions.delete')}
                className="px-2.5 h-8 rounded-[6px] border-0 bg-transparent cursor-pointer text-xs font-medium text-destructive hover:bg-destructive-subtle transition-[background-color] duration-100"
              >
                {t('actions.delete')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Add Room Row ── */

function AddRoomRow({ onClose }: { onClose: () => void; }) {
  const { t } = useTranslation('rooms');
  const createRoom = useCreateRoom();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');

  async function handleSave() {
    if (!name.trim()) return;
    await createRoom.mutateAsync({
      name: name.trim(),
      capacity: capacity === '' ? null : parseInt(capacity, 10),
      active: true,
    });
    onClose();
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-t border-border bg-background">
      <input
        className="form-input flex-[2]"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('form.name')}
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
      />
      <input
        className="form-input w-[110px]"
        type="number"
        min="1"
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        placeholder={t('form.capacity')}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
      />
      <button onClick={handleSave} disabled={createRoom.isPending || !name.trim()} className="btn-primary">
        {createRoom.isPending ? '…' : t('actions.save')}
      </button>
      <button onClick={onClose} className="btn-secondary">{t('actions.cancel')}</button>
    </div>
  );
}

/* ─── Rooms Page ── */

export function RoomsPage() {
  const { t } = useTranslation('rooms');
  const { appUser } = useAuth();
  const canManage = appUser?.role === Role.Admin || !!appUser?.permissions?.manageRooms;

  const { data: rooms, isLoading, isError } = useRooms();
  const [showAddRow, setShowAddRow] = useState(false);

  return (
    <div className="page-enter p-7 max-w-[700px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold m-0 tracking-[-0.025em] text-foreground">
          {t('title')}
        </h1>
        {canManage && !showAddRow && (
          <button
            onClick={() => setShowAddRow(true)}
            className="btn-primary flex items-center gap-1.5"
          >
            <IconPlus />
            {t('addRoom')}
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-[0.75rem] overflow-hidden">

        {/* Column headers */}
        <div className="flex items-center gap-3 px-5 py-2 bg-muted border-b border-border">
          <div className="flex-[2] text-xs font-semibold text-muted-foreground uppercase tracking-[0.04em]">
            {t('form.name')}
          </div>
          <div className="w-[110px] text-xs font-semibold text-muted-foreground uppercase tracking-[0.04em]">
            {t('form.capacity')}
          </div>
          {canManage && <div className="w-[120px]" />}
        </div>

        {isLoading && (
          <div className="p-12 text-center text-muted-foreground text-sm">…</div>
        )}

        {isError && (
          <div className="p-12 text-center text-destructive text-sm">
            {t('errors.failedToLoad', { ns: 'common' })}
          </div>
        )}

        {rooms && rooms.length === 0 && !showAddRow && (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {t('noRooms')}
          </div>
        )}

        {rooms && rooms.map((room) => (
          <RoomRow key={room.id} room={room} canManage={canManage} />
        ))}

        {showAddRow && <AddRoomRow onClose={() => setShowAddRow(false)} />}
      </div>
    </div>
  );
}
