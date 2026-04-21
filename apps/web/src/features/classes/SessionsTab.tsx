import { WeekCalendarView } from './WeekCalendarView'

interface SessionsTabProps {
  canManage: boolean
}

export function SessionsTab({ canManage }: SessionsTabProps) {
  return <WeekCalendarView canManage={canManage} />
}
