import { Link, Outlet, useLocation } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import SeoNoIndex from '../../components/seo/SeoNoIndex'

const nav = [
  { to: '/manager/bookings', label: 'Cases' },
  { to: '/manager/ledger', label: 'Collections' },
]

export default function ManagerLayout() {
  const location = useLocation()

  return (
    <>
      <SeoNoIndex />
      <AppShell title="Care Manager">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Care Manager</h1>
              <p className="text-sm text-slate-600">Manage visits, plans, assignments, and collections</p>
            </div>
            <nav className="flex gap-2">
              {nav.map((item) => {
                const active = location.pathname.startsWith(item.to)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                      active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <Outlet />
        </div>
      </AppShell>
    </>
  )
}
