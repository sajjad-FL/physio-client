import { Link, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '../../auth/session'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'

const iconOverview = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
    />
  </svg>
)
const iconCalendar = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
    />
  </svg>
)
const iconUser = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
)
const iconDispute = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
)

const navItems = [
  { to: '/dashboard', label: 'Overview', end: true, icon: iconOverview },
  { to: '/dashboard/bookings', label: 'Bookings', icon: iconCalendar },
  { to: '/profile', label: 'Profile', icon: iconUser },
  { to: '/dashboard/disputes', label: 'Disputes', icon: iconDispute },
]

export default function UserDashboardLayout() {
  const navigate = useNavigate()

  return (
    <AppShell
      brand="PhysioCare"
      badge="Patient"
      topBarTitle="My dashboard"
      topBarSubtitle=""
      navItems={navItems}
      headerActions={
        <>
          <Link
            to="/book"
            className="hidden cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] sm:inline-flex"
          >
            Book session
          </Link>
          <Button variant="outline" className="hidden rounded-xl sm:inline-flex" onClick={() => logout(navigate)}>
            Log out
          </Button>
          <Link
            to="/book"
            className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] sm:hidden"
          >
            Book
          </Link>
        </>
      }
      sidebarFooter={
        <div className="space-y-2">
          <Button variant="outline" className="w-full sm:hidden" onClick={() => logout(navigate)}>
            Log out
          </Button>
          <p className="text-center text-xs text-gray-400">Help: home page</p>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  )
}
