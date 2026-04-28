// ─── Roles & Permissions ─────────────────────────────────────────────────────

export type Role = 'admin' | 'staff';

export interface Permissions {
  viewFinancials: boolean;
  viewTeacherPay: boolean;
  exportReports: boolean;
  manageStudents: boolean;
  manageClasses: boolean;
  manageTeachers: boolean;
  manageRooms: boolean;
  configureSystem: boolean;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  permissions: Permissions;
  createdAt: Date;
}

// ─── Pass / Membership Types ──────────────────────────────────────────────────

/** Monthly subscriptions purchased via Eversports */
export type MembershipTier = 'gold' | 'silver' | 'bronze';

/** Offline class cards purchased at the studio */
export type ClassCardType = 'ten_class' | 'five_class';

/** Union of all pass types — memberships and class cards */
export type PassType = MembershipTier | ClassCardType;

// ─── External Providers ───────────────────────────────────────────────────────

export type ExternalProvider = 'usc' | 'eversports';

// ─── Attendance Combinations ─────────────────────────────────────────────────
//
// A combination is an array of 1–2 tokens that describes how a student paid
// for or accessed a class.
//
// Credit-deducting tokens (handled by onAttendanceCreated Cloud Function):
//   'silver'  → 1 credit for regular, 2 credits for special/event
//   'bronze'  → 1 credit for regular, 2 credits for special/event
//   'card'    → 1 credit for regular, 2 credits for special/event (ten_class or five_class)
//   'gold'    → unlimited (0 deducted)
//
// Non-deducting tokens:
//   'usc'        → Urban Sports Club member
//   'eversports' → Eversports one-time / non-membership booking
//   'dropin'     → Walk-in cash payment (rate from config/pricing.dropInRate)
//   'trial'      → Free trial class; always available for students with no active pass
//   'cash'       → Supplement token only; combined with usc/eversports/membership for
//                  special/event classes or shortfall resolution
//
// Party classes: combination is always [] — no tokens, no deduction.

export type CombinationToken =
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'card'
  | 'usc'
  | 'eversports'
  | 'dropin'
  | 'trial'
  | 'cash';

export type AttendanceCombination = CombinationToken[];

// ─── Class / Session Enums ────────────────────────────────────────────────────

export type SessionStatus = 'planned' | 'active' | 'completed' | 'cancelled';

/**
 * regular  → standard class (1 credit for silver/bronze/card)
 * special  → special class (2 credits for silver/bronze/card)
 * event    → event (2 credits for silver/bronze/card)
 * party    → social event; attendance recorded but 0 credits deducted, no combination picker
 */
export type ClassType = 'regular' | 'special' | 'event' | 'party';

/**
 * Base dance styles — extensible at runtime via config/danceStyles in Firestore.
 * The UI reads dynamic styles from that config; this type covers the seed defaults.
 */
export type DanceStyle = 'bachata' | 'kizomba' | 'salsa' | 'zouk' | 'afro' | 'other';

/**
 * Base class levels — extensible at runtime via config/classLevels in Firestore.
 */
export type ClassLevel = 'beginner' | 'intermediate' | 'advanced' | 'open';

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  /** ID of the currently active Membership or ClassCard document */
  activePassId: string | null;
  /** Denormalized pass type for quick display without fetching the pass doc */
  passType: PassType | null;
  active: boolean;
  createdAt: Date;
}

/** Eversports monthly subscription */
export interface Membership {
  id: string;
  studentId: string;
  tier: MembershipTier;
  /** null for gold (unlimited) */
  creditsRemaining: number | null;
  /** null for gold; 8 for silver, 4 for bronze */
  creditsTotal: number | null;
  startDate: Date;
  /** Typically startDate + 1 month */
  expiryDate: Date;
  active: boolean;
  createdAt: Date;
  createdBy: string;
}

/** Offline class card purchased at the studio */
export interface ClassCard {
  id: string;
  studentId: string;
  type: ClassCardType;
  /** Starts at creditsTotal; decremented by onAttendanceCreated */
  creditsRemaining: number;
  /** 10 for ten_class, 5 for five_class */
  creditsTotal: number;
  purchaseDate: Date;
  /** purchaseDate + 4 months */
  expiryDate: Date;
  active: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  ratePerStudent: number;
  monthlyFloor: number | null;
  reportVisibility: {
    showAttendanceDetail: boolean;
    showEarningsPerSession: boolean;
    showTotalEarnings: boolean;
  };
  active: boolean;
  createdAt: Date;
}

export interface Room {
  id: string;
  name: string;
  capacity: number | null;
  active: boolean;
}

export interface ClassTemplate {
  id: string;
  name: string;
  style: DanceStyle;
  level: ClassLevel;
  type: ClassType;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  teacherId: string;
  roomId: string;
  regularStudentIds: string[];
  isSubscription: boolean;
  active: boolean;
  createdAt: Date;
}

export interface ClassSession {
  id: string;
  templateId: string | null;
  name: string;
  style: DanceStyle;
  level: ClassLevel;
  type: ClassType;
  date: Date;
  startTime: string;
  endTime: string;
  teacherId: string;
  originalTeacherId: string | null;
  roomId: string;
  status: SessionStatus;
  isSpecial: boolean;
  capacity: number | null;
  notes: string | null;
  createdAt: Date;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  /**
   * Payment / access method. [] for party classes.
   * 1–2 tokens for all other class types.
   */
  combination: AttendanceCombination;
  /** Set when a studio Membership (gold/silver/bronze) was used */
  membershipId: string | null;
  /** Set when a ClassCard (ten_class/five_class) was used */
  classCardId: string | null;
  /** Snapshot of the pass state at the moment of check-in */
  passSnapshot: {
    type: PassType;
    creditsAtCheckIn: number | null;
  } | null;
  /** Estimated monetary value of this check-in (for reporting) */
  estimatedValue: number;
  /** True when student had fewer credits than required */
  shortfall: boolean;
  shortfallAmount: number | null;
  /** Optional note recorded by admin/staff at check-in */
  notes: string | null;
  markedAt: Date;
  /** UID of the admin/staff who recorded the attendance */
  markedBy: string;
}

// ─── Config Documents ─────────────────────────────────────────────────────────

export interface PricingConfig {
  /** Walk-in cash rate in euros; default 13 */
  dropInRate: number;
  silverMonthlyPrice: number;
  bronzeMonthlyPrice: number;
  goldMonthlyPrice: number;
  tenClassCardPrice: number;
  fiveClassCardPrice: number;
  /** Used for revenue estimation in reports */
  uscRatePerCheckin: number;
  eversportsRatePerCheckin: number;
  updatedAt: Date;
  updatedBy: string;
}

/** config/danceStyles — array of active style names (extensible) */
export interface DanceStylesConfig {
  styles: string[];
  updatedAt: Date;
  updatedBy: string;
}

/** config/classLevels — array of active level names (extensible) */
export interface ClassLevelsConfig {
  levels: string[];
  updatedAt: Date;
  updatedBy: string;
}
