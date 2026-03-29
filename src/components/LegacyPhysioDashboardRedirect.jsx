import { Navigate, useLocation } from 'react-router-dom'

/** Maps old `/physio-dashboard/...` URLs to `/physio/...`. */
export default function LegacyPhysioDashboardRedirect() {
  const { pathname, search } = useLocation()
  const next = pathname.replace(/^\/physio-dashboard/, '/physio') || '/physio'
  return <Navigate to={`${next}${search}`} replace />
}
