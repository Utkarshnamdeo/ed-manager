import { onCall } from 'firebase-functions/v2/https'

// Step 2: implement step-up email verification
export const sendStepUpCode = onCall((_request) => {
  throw new Error('Not implemented')
})

export const verifyStepUpCode = onCall((_request) => {
  throw new Error('Not implemented')
})
