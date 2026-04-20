// Seed the Firebase emulator with sample data.
// Run: npm run seed  (emulators must be running first)
// Uses emulator REST APIs — no extra dependencies needed.

const AUTH_BASE = 'http://localhost:9099'
const FIRESTORE_BASE = 'http://localhost:8080'
const PROJECT = 'demo-elite-manager'

async function createAuthUser(email, password) {
  const res = await fetch(
    `${AUTH_BASE}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    },
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? JSON.stringify(data))
  return data.localId
}

async function signInAuthUser(email, password) {
  const res = await fetch(
    `${AUTH_BASE}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    },
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? JSON.stringify(data))
  return data.localId
}

function toFieldValue(v) {
  if (v === null) return { nullValue: null }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  if (typeof v === 'string') return { stringValue: v }
  if (v instanceof Date) return { timestampValue: v.toISOString() }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFieldValue) } }
  if (typeof v === 'object') return { mapValue: { fields: toFields(v) } }
  return { nullValue: null }
}

function toFields(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k] = toFieldValue(v)
  }
  return out
}

async function upsertDoc(collection, docId, data) {
  const url = `${FIRESTORE_BASE}/v1/projects/${PROJECT}/databases/(default)/documents/${collection}/${docId}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      // 'owner' token bypasses Firestore security rules in the emulator
      'Authorization': 'Bearer owner',
    },
    body: JSON.stringify({ fields: toFields(data) }),
  })
  if (!res.ok) throw new Error(await res.text())
}

// ── Users ──

const users = [
  {
    email: 'admin@danceacademy.com',
    password: 'password123',
    doc: {
      email: 'admin@danceacademy.com',
      displayName: 'Admin User',
      role: 'admin',
      teacherId: null,
      active: true,
      permissions: {
        viewFinancials: true,
        viewTeacherPay: true,
        exportReports: true,
        manageStudents: true,
        manageClasses: true,
        manageTeachers: true,
        manageRooms: true,
        configureSystem: true,
      },
    },
  },
  {
    email: 'staff@danceacademy.com',
    password: 'password123',
    doc: {
      email: 'staff@danceacademy.com',
      displayName: 'Staff User',
      role: 'staff',
      teacherId: null,
      active: true,
      permissions: {
        viewFinancials: false,
        viewTeacherPay: false,
        exportReports: false,
        manageStudents: true,
        manageClasses: true,
        manageTeachers: false,
        manageRooms: false,
        configureSystem: false,
      },
    },
  },
]

// ── Teachers ──

const teachers = [
  {
    id: 'teacher-1',
    firstName: 'Maria',
    lastName: 'Lopez',
    email: 'maria.lopez@danceacademy.com',
    ratePerStudent: 3.5,
    monthlyFloor: 400,
    reportVisibility: {
      showAttendanceDetail: true,
      showEarningsPerSession: true,
      showTotalEarnings: false,
    },
    active: true,
  },
  {
    id: 'teacher-2',
    firstName: 'Carlos',
    lastName: 'Ferreira',
    email: 'carlos.ferreira@danceacademy.com',
    ratePerStudent: 4.0,
    monthlyFloor: null,
    reportVisibility: {
      showAttendanceDetail: false,
      showEarningsPerSession: false,
      showTotalEarnings: false,
    },
    active: true,
  },
  {
    id: 'teacher-3',
    firstName: 'Ana',
    lastName: 'Souza',
    email: 'ana.souza@danceacademy.com',
    ratePerStudent: 3.0,
    monthlyFloor: 300,
    reportVisibility: {
      showAttendanceDetail: true,
      showEarningsPerSession: false,
      showTotalEarnings: false,
    },
    active: true,
  },
]

// ── Rooms ──

const rooms = [
  { id: 'room-1', name: 'Studio A', capacity: 20, active: true },
  { id: 'room-2', name: 'Studio B', capacity: 15, active: true },
  { id: 'room-3', name: 'Main Hall', capacity: 40, active: true },
]

// ── Students ──

const students = [
  {
    id: 'student-1',
    firstName: 'Ana',
    lastName: 'Schmidt',
    email: 'ana.schmidt@example.com',
    phone: null,
    notes: null,
    activeMembershipId: 'membership-1',
    membershipTier: 'silver',
    active: true,
    createdAt: new Date('2025-09-01'),
  },
  {
    id: 'student-2',
    firstName: 'Marco',
    lastName: 'Bauer',
    email: 'marco.bauer@example.com',
    phone: null,
    notes: null,
    activeMembershipId: 'membership-2',
    membershipTier: 'gold',
    active: true,
    createdAt: new Date('2025-09-01'),
  },
  {
    id: 'student-3',
    firstName: 'Emma',
    lastName: 'Reyes',
    email: 'emma.reyes@example.com',
    phone: null,
    notes: null,
    activeMembershipId: 'membership-3',
    membershipTier: 'bronze',
    active: true,
    createdAt: new Date('2025-10-01'),
  },
  {
    id: 'student-4',
    firstName: 'Jonas',
    lastName: 'Weber',
    email: 'jonas.weber@example.com',
    phone: null,
    notes: null,
    activeMembershipId: 'membership-4',
    membershipTier: 'silver',
    active: true,
    createdAt: new Date('2025-10-15'),
  },
  {
    id: 'student-5',
    firstName: 'Mia',
    lastName: 'Klein',
    email: 'mia.klein@example.com',
    phone: null,
    notes: null,
    activeMembershipId: 'membership-5',
    membershipTier: 'gold',
    active: true,
    createdAt: new Date('2025-11-01'),
  },
  {
    id: 'student-6',
    firstName: 'Luca',
    lastName: 'Müller',
    email: 'luca.muller@example.com',
    phone: null,
    notes: null,
    activeMembershipId: null,
    membershipTier: null,
    active: true,
    createdAt: new Date('2026-01-15'),
  },
]

// ── Memberships ──

const memberships = [
  {
    id: 'membership-1',
    studentId: 'student-1',
    tier: 'silver',
    creditsRemaining: 8,
    creditsTotal: 10,
    startDate: new Date('2026-03-01'),
    expiryDate: new Date('2026-06-01'),
    active: true,
    createdAt: new Date('2026-03-01'),
  },
  {
    id: 'membership-2',
    studentId: 'student-2',
    tier: 'gold',
    creditsRemaining: null,
    creditsTotal: null,
    startDate: new Date('2026-04-01'),
    expiryDate: new Date('2026-04-30'),
    active: true,
    createdAt: new Date('2026-04-01'),
  },
  {
    id: 'membership-3',
    studentId: 'student-3',
    tier: 'bronze',
    creditsRemaining: 2,
    creditsTotal: 5,
    startDate: new Date('2026-03-15'),
    expiryDate: new Date('2026-05-15'),
    active: true,
    createdAt: new Date('2026-03-15'),
  },
  {
    id: 'membership-4',
    studentId: 'student-4',
    tier: 'silver',
    creditsRemaining: 3,
    creditsTotal: 10,
    startDate: new Date('2026-02-01'),
    expiryDate: new Date('2026-05-01'),
    active: true,
    createdAt: new Date('2026-02-01'),
  },
  {
    id: 'membership-5',
    studentId: 'student-5',
    tier: 'gold',
    creditsRemaining: null,
    creditsTotal: null,
    startDate: new Date('2026-04-01'),
    expiryDate: new Date('2026-04-30'),
    active: true,
    createdAt: new Date('2026-04-01'),
  },
]

// ── Class Templates ──
// dayOfWeek: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun

const classTemplates = [
  {
    id: 'template-1',
    name: 'Bachata Beginner',
    style: 'bachata',
    level: 'beginner',
    type: 'regular',
    dayOfWeek: 5,
    startTime: '19:00',
    endTime: '20:30',
    teacherId: 'teacher-1',
    roomId: 'room-1',
    regularStudentIds: ['student-1', 'student-2', 'student-3'],
    isSubscription: false,
    active: true,
    createdAt: new Date('2025-09-01'),
  },
  {
    id: 'template-2',
    name: 'Kizomba Intermediate',
    style: 'kizomba',
    level: 'intermediate',
    type: 'regular',
    dayOfWeek: 5,
    startTime: '20:30',
    endTime: '22:00',
    teacherId: 'teacher-2',
    roomId: 'room-2',
    regularStudentIds: ['student-4', 'student-5'],
    isSubscription: false,
    active: true,
    createdAt: new Date('2025-09-01'),
  },
  {
    id: 'template-3',
    name: 'Salsa Open Level',
    style: 'salsa',
    level: 'open',
    type: 'regular',
    dayOfWeek: 2,
    startTime: '19:00',
    endTime: '20:30',
    teacherId: 'teacher-1',
    roomId: 'room-1',
    regularStudentIds: ['student-1', 'student-4'],
    isSubscription: false,
    active: true,
    createdAt: new Date('2025-09-01'),
  },
  {
    id: 'template-4',
    name: 'Zouk Beginner',
    style: 'zouk',
    level: 'beginner',
    type: 'regular',
    dayOfWeek: 0,
    startTime: '20:00',
    endTime: '21:30',
    teacherId: 'teacher-3',
    roomId: 'room-2',
    regularStudentIds: ['student-2', 'student-3', 'student-5'],
    isSubscription: false,
    active: true,
    createdAt: new Date('2025-09-01'),
  },
]

// ── Class Sessions (today = 2026-04-19) ──

const TODAY = new Date('2026-04-19T12:00:00.000Z')

const classSessions = [
  {
    id: 'session-1',
    templateId: 'template-1',
    name: 'Bachata Beginner',
    style: 'bachata',
    level: 'beginner',
    type: 'regular',
    date: TODAY,
    startTime: '19:00',
    endTime: '20:30',
    teacherId: 'teacher-1',
    originalTeacherId: null,
    roomId: 'room-1',
    status: 'active',
    isSpecial: false,
    capacity: 20,
    notes: null,
    createdAt: TODAY,
  },
  {
    id: 'session-2',
    templateId: 'template-2',
    name: 'Kizomba Intermediate',
    style: 'kizomba',
    level: 'intermediate',
    type: 'regular',
    date: TODAY,
    startTime: '20:30',
    endTime: '22:00',
    teacherId: 'teacher-2',
    originalTeacherId: null,
    roomId: 'room-2',
    status: 'planned',
    isSpecial: false,
    capacity: 15,
    notes: null,
    createdAt: TODAY,
  },
  {
    id: 'session-3',
    templateId: null,
    name: 'Bachata Workshop',
    style: 'bachata',
    level: 'open',
    type: 'workshop',
    date: TODAY,
    startTime: '15:00',
    endTime: '17:00',
    teacherId: 'teacher-1',
    originalTeacherId: null,
    roomId: 'room-3',
    status: 'active',
    isSpecial: true,
    capacity: 30,
    notes: 'Special workshop with guest teacher',
    createdAt: TODAY,
  },
]

// ── Pricing Config ──

const pricingConfig = {
  dropInCashRate: 13,
  silverCashSurcharge: 2,
  bronzeCashSurcharge: 4,
  silverPassPrice: 80,
  bronzePassPrice: 50,
  goldMonthlyPrice: 60,
  uscRatePerCheckin: 8,
  eversportsRatePerCheckin: 8,
  specialClassSurcharge: 5,
  trialRate: 10,
  updatedAt: new Date('2026-01-01'),
  updatedBy: 'seed',
}

// ── Main ──

async function main() {
  console.log('Seeding Firebase Emulator…\n')

  // Users
  for (const user of users) {
    try {
      const uid = await createAuthUser(user.email, user.password)
      await upsertDoc('users', uid, user.doc)
      console.log(`✓  ${user.email}  (${user.doc.role})`)
    } catch (err) {
      if (err.message.includes('EMAIL_EXISTS')) {
        try {
          const uid = await signInAuthUser(user.email, user.password)
          await upsertDoc('users', uid, user.doc)
          console.log(`↻  ${user.email}  (auth existed — firestore doc updated)`)
        } catch (innerErr) {
          console.error(`✗  ${user.email}: ${innerErr.message}`)
          process.exit(1)
        }
      } else {
        console.error(`✗  ${user.email}: ${err.message}`)
        process.exit(1)
      }
    }
  }

  // Teachers
  console.log('')
  for (const teacher of teachers) {
    const { id, ...data } = teacher
    await upsertDoc('teachers', id, data)
    console.log(`✓  Teacher: ${teacher.firstName} ${teacher.lastName}`)
  }

  // Rooms
  console.log('')
  for (const room of rooms) {
    const { id, ...data } = room
    await upsertDoc('rooms', id, data)
    console.log(`✓  Room: ${room.name}`)
  }

  // Students
  console.log('')
  for (const student of students) {
    const { id, ...data } = student
    await upsertDoc('students', id, data)
    console.log(`✓  Student: ${student.firstName} ${student.lastName}`)
  }

  // Memberships
  console.log('')
  for (const membership of memberships) {
    const { id, ...data } = membership
    await upsertDoc('memberships', id, data)
    console.log(`✓  Membership: ${membership.id} (${membership.tier})`)
  }

  // Class Templates
  console.log('')
  for (const template of classTemplates) {
    const { id, ...data } = template
    await upsertDoc('classTemplates', id, data)
    console.log(`✓  Template: ${template.name}`)
  }

  // Class Sessions
  console.log('')
  for (const session of classSessions) {
    const { id, ...data } = session
    await upsertDoc('classSessions', id, data)
    console.log(`✓  Session: ${session.name}`)
  }

  // Pricing Config
  console.log('')
  await upsertDoc('config', 'pricing', pricingConfig)
  console.log('✓  Config: pricing')

  console.log('\nDone. Login: admin@danceacademy.com / password123')
}

main()
