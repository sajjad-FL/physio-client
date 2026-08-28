import { Navigate } from 'react-router-dom'

/** Legacy path; onboarding wizard lives at `/physio/onboarding`. */
export default function PhysioVerificationPage() {
  return <Navigate to="/physio/onboarding" replace />
}
