import { initializeApp } from 'firebase-admin/app'

initializeApp()

export { onAttendanceCreated } from './attendance/onAttendanceCreated'
export { sendStepUpCode, verifyStepUpCode } from './auth/stepUp'
export { manualBackup, scheduledBackup, cleanupOldBackups } from './backup/backup'
