import { describe, it, expect } from 'vitest'
import { computeDashboardStats } from '../hooks/useDashboardStats'
import type { ClassSession, Student } from '../types'

function makeSession(overrides: Partial<ClassSession> = {}): ClassSession {
  return {
    id: 'session-1',
    templateId: null,
    name: 'Test Session',
    style: 'bachata',
    level: 'beginner',
    type: 'regular',
    date: new Date(),
    startTime: '19:00',
    endTime: '20:30',
    teacherId: 'teacher-1',
    originalTeacherId: null,
    roomId: 'room-1',
    status: 'planned',
    isSpecial: false,
    capacity: 20,
    notes: null,
    createdAt: new Date(),
    ...overrides,
  }
}

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: 'student-1',
    name: 'Test Student',
    email: null,
    phone: null,
    notes: null,
    activePassId: null,
    passType: null,
    active: true,
    createdAt: new Date(),
    ...overrides,
  }
}

describe('computeDashboardStats', () => {
  it('returns all zeros for empty data', () => {
    const result = computeDashboardStats([], [], 0)
    expect(result.activeSessionCount).toBe(0)
    expect(result.plannedSessionCount).toBe(0)
    expect(result.completedSessionCount).toBe(0)
    expect(result.activeStudentCount).toBe(0)
    expect(result.activePassCount).toBe(0)
    expect(result.activePassPercent).toBe(0)
    expect(result.weeklyCheckinCount).toBe(0)
    expect(result.todaySessions).toHaveLength(0)
  })

  it('counts session statuses correctly', () => {
    const sessions = [
      makeSession({ id: '1', status: 'active' }),
      makeSession({ id: '2', status: 'planned' }),
      makeSession({ id: '3', status: 'planned' }),
      makeSession({ id: '4', status: 'completed' }),
      makeSession({ id: '5', status: 'cancelled' }),
    ]
    const result = computeDashboardStats(sessions, [], 0)
    expect(result.activeSessionCount).toBe(1)
    expect(result.plannedSessionCount).toBe(2)
    expect(result.completedSessionCount).toBe(1)
    expect(result.todaySessions).toHaveLength(5)
  })

  it('counts students with and without passes', () => {
    const students = [
      makeStudent({ id: '1', passType: 'silver' }),
      makeStudent({ id: '2', passType: 'gold' }),
      makeStudent({ id: '3', passType: null }),  // no pass
      makeStudent({ id: '4', passType: 'ten_class' }),
    ]
    const result = computeDashboardStats([], students, 0)
    expect(result.activeStudentCount).toBe(4)
    expect(result.activePassCount).toBe(3)
    expect(result.activePassPercent).toBe(75)
  })

  it('handles divide-by-zero when no students', () => {
    const result = computeDashboardStats([], [], 0)
    expect(result.activePassPercent).toBe(0)
  })

  it('rounds pass percentage correctly', () => {
    const students = [
      makeStudent({ id: '1', passType: 'silver' }),
      makeStudent({ id: '2', passType: null }),
      makeStudent({ id: '3', passType: null }),
    ]
    const result = computeDashboardStats([], students, 0)
    expect(result.activePassPercent).toBe(33)  // Math.round(1/3 * 100) = 33
  })

  it('passes weekly count through', () => {
    const result = computeDashboardStats([], [], 42)
    expect(result.weeklyCheckinCount).toBe(42)
  })
})
