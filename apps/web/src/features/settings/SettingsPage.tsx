import { Outlet } from 'react-router'
import { SettingsNav } from './SettingsNav'

export function SettingsPage() {
  return (
    <div className="flex h-full">
      <aside className="w-[200px] shrink-0 border-r border-border overflow-y-auto">
        <SettingsNav />
      </aside>
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
