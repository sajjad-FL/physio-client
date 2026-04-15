import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { getDefaultDashboardPath } from '../auth/session'
import SeoNoIndex from '../components/seo/SeoNoIndex'

export default function UnauthorizedPage() {
  const home = getDefaultDashboardPath()

  return (
    <>
      <SeoNoIndex />
      <Helmet>
        <title>Access denied | NearbyPhysio</title>
      </Helmet>
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-2xl font-semibold text-gray-900">Access denied</h1>
      <p className="mt-2 max-w-md text-center text-sm text-gray-500">
        You don&apos;t have permission to view this page.
      </p>
      <Link
        to={home}
        className="mt-8 inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
      >
        Go to your dashboard
      </Link>
      <Link to="/login" className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">
        Sign in as a different user
      </Link>
    </div>
    </>
  )
}
