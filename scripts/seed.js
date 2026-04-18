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

function toFields(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === null) out[k] = { nullValue: null }
    else if (typeof v === 'boolean') out[k] = { booleanValue: v }
    else if (typeof v === 'number') out[k] = { integerValue: String(v) }
    else if (typeof v === 'string') out[k] = { stringValue: v }
    else if (typeof v === 'object') out[k] = { mapValue: { fields: toFields(v) } }
  }
  return out
}

async function upsertDoc(collection, docId, data) {
  const url = `${FIRESTORE_BASE}/v1/projects/${PROJECT}/databases/(default)/documents/${collection}/${docId}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFields(data) }),
  })
  if (!res.ok) throw new Error(await res.text())
}

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

async function main() {
  console.log('Seeding Firebase Emulator…\n')
  for (const user of users) {
    try {
      const uid = await createAuthUser(user.email, user.password)
      await upsertDoc('users', uid, user.doc)
      console.log(`✓  ${user.email}  (${user.doc.role})`)
    } catch (err) {
      if (err.message.includes('EMAIL_EXISTS')) {
        console.log(`–  ${user.email}  (already exists, skipped)`)
      } else {
        console.error(`✗  ${user.email}: ${err.message}`)
        process.exit(1)
      }
    }
  }
  console.log('\nDone. Login: admin@danceacademy.com / password123')
}

main()
