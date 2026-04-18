export type Role = 'admin' | 'staff' | 'teacher'

export type MembershipTier = 'gold' | 'silver' | 'bronze'

export type ExternalProvider = 'usc' | 'eversports'

export type CombinationToken =
  | 'gold'
  | 'silver'
  | '2silver'
  | 'bronze'
  | '2bronze'
  | 'usc'
  | 'eversports'
  | 'cash'
  | 'trial'

export type AttendanceCombination = CombinationToken[]

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'trial'

export type SessionStatus = 'planned' | 'active' | 'completed' | 'cancelled'

export type ClassType = 'regular' | 'special' | 'workshop' | 'event' | 'party'

export type DanceStyle = 'bachata' | 'kizomba' | 'salsa' | 'zouk' | 'afro' | 'other'

export type ClassLevel = 'beginner' | 'intermediate' | 'advanced' | 'open'

export interface Permissions {
  viewFinancials: boolean
  viewTeacherPay: boolean
  exportReports: boolean
  manageStudents: boolean
  manageClasses: boolean
  manageTeachers: boolean
  manageRooms: boolean
  configureSystem: boolean
}

export interface AppUser {
  uid: string
  email: string
  displayName: string
  role: Role
  teacherId: string | null
  active: boolean
  permissions: Permissions
  createdAt: Date
}

export interface Student {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  notes: string | null
  activeMembershipId: string | null
  membershipTier: MembershipTier | null
  active: boolean
  createdAt: Date
}

export interface Membership {
  id: string
  studentId: string
  tier: 'silver' | 'bronze' | 'gold'
  creditsRemaining: number | null
  creditsTotal: number | null
  startDate: Date
  expiryDate: Date
  active: boolean
  createdAt: Date
}

export interface Teacher {
  id: string
  firstName: string
  lastName: string
  email: string
  ratePerStudent: number
  monthlyFloor: number | null
  reportVisibility: {
    showAttendanceDetail: boolean
    showEarningsPerSession: boolean
    showTotalEarnings: boolean
  }
  active: boolean
  createdAt: Date
}

export interface Room {
  id: string
  name: string
  capacity: number | null
  active: boolean
}

export interface ClassTemplate {
  id: string
  name: string
  style: DanceStyle
  level: ClassLevel
  type: ClassType
  dayOfWeek: number
  startTime: string
  endTime: string
  teacherId: string
  roomId: string
  regularStudentIds: string[]
  isSubscription: boolean
  active: boolean
  createdAt: Date
}

export interface ClassSession {
  id: string
  templateId: string | null
  name: string
  style: DanceStyle
  level: ClassLevel
  type: ClassType
  date: Date
  startTime: string
  endTime: string
  teacherId: string
  originalTeacherId: string | null
  roomId: string
  status: SessionStatus
  isSpecial: boolean
  capacity: number | null
  notes: string | null
  createdAt: Date
}

export interface AttendanceRecord {
  id: string
  sessionId: string
  studentId: string
  status: AttendanceStatus
  combination: AttendanceCombination
  membershipId: string | null
  membershipSnapshot: {
    tier: MembershipTier
    creditsAtCheckIn: number | null
  } | null
  cashAmount: number | null
  cashDefault: number | null
  estimatedValue: number
  shortfall: boolean
  shortfallAmount: number | null
  markedAt: Date
  markedBy: string
}

export interface BackupLog {
  id: string
  triggeredBy: 'scheduled' | 'manual'
  triggeredUid: string | null
  status: 'success' | 'failure'
  startedAt: Date
  completedAt: Date
  durationMs: number
  fileSizeBytes: number | null
  filePath: string | null
  collections: string[]
  error: string | null
}

export interface PricingConfig {
  dropInCashRate: number
  silverCashSurcharge: number
  bronzeCashSurcharge: number
  silverPassPrice: number
  bronzePassPrice: number
  goldMonthlyPrice: number
  uscRatePerCheckin: number
  eversportsRatePerCheckin: number
  specialClassSurcharge: number
  trialRate: number
  updatedAt: Date
  updatedBy: string
}
