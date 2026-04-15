import { Helmet } from 'react-helmet-async'
import { Navigate, useLocation } from 'react-router-dom'
import SeoNoIndex from './seo/SeoNoIndex'

/** Maps old `/physio-dashboard/...` URLs to `/physio/...`. */
export default function LegacyPhysioDashboardRedirect() {
  const { pathname, search } = useLocation()
  const next = pathname.replace(/^\/physio-dashboard/, '/physio') || '/physio'
  return (
    <>
      <SeoNoIndex />
      <Helmet>
        <title>Redirecting…</title>
      </Helmet>
      <Navigate to={`${next}${search}`} replace />
    </>
  )
}
