import { useClassSessionsByDate } from './useClassSessions';
import { useStudents } from './useStudents';
import { useWeeklyCheckinCount } from './useWeeklyCheckinCount';
import { SessionStatus, type ClassSession, type Student } from '../types';

export interface DashboardStats {
  todaySessions: ClassSession[];
  activeSessionCount: number;
  plannedSessionCount: number;
  completedSessionCount: number;
  activeStudentCount: number;
  activePassCount: number;
  activePassPercent: number;
  weeklyCheckinCount: number;
  isLoading: boolean;
  isError: boolean;
}

// Pure function — exported for unit testing
export function computeDashboardStats(
  sessions: ClassSession[],
  students: Student[],
  weeklyCount: number,
): Omit<DashboardStats, 'isLoading' | 'isError'> {
  const activeStudentCount = students.length;
  const activePassCount = students.filter((s) => s.passType !== null).length;
  const activePassPercent =
    activeStudentCount > 0 ? Math.round((activePassCount / activeStudentCount) * 100) : 0;

  return {
    todaySessions: sessions,
    activeSessionCount: sessions.filter((s) => s.status === SessionStatus.Active).length,
    plannedSessionCount: sessions.filter((s) => s.status === SessionStatus.Planned).length,
    completedSessionCount: sessions.filter((s) => s.status === SessionStatus.Completed).length,
    activeStudentCount,
    activePassCount,
    activePassPercent,
    weeklyCheckinCount: weeklyCount,
  };
}

export function useDashboardStats(): DashboardStats {
  const sessions = useClassSessionsByDate(new Date());
  const students = useStudents();
  const weekly = useWeeklyCheckinCount();

  const isLoading = sessions.isLoading || students.isLoading || weekly.isLoading;
  const isError = sessions.isError || students.isError || weekly.isError;

  const computed = computeDashboardStats(
    sessions.data ?? [],
    students.data ?? [],
    weekly.data ?? 0,
  );

  return { ...computed, isLoading, isError };
}
