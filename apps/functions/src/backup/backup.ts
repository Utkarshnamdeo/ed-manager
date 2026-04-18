import { onCall } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'

// Step 12: implement backup functions
export const manualBackup = onCall((_request) => {
  throw new Error('Not implemented')
})

export const scheduledBackup = onSchedule(
  { schedule: '0 2 * * *', timeZone: 'Europe/Berlin' },
  async (_event) => {
    // daily at 02:00 Europe/Berlin
  },
)

export const cleanupOldBackups = onSchedule(
  { schedule: '0 3 * * 0', timeZone: 'Europe/Berlin' },
  async (_event) => {
    // weekly: delete backupLogs older than 90 days
  },
)
