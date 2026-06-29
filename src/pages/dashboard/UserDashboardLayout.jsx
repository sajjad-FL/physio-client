import { useMemo } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import SeoNoIndex from '../../components/seo/SeoNoIndex'
import { useShopCart } from '../../hooks/useShopCart'

const iconHome = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
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
const iconWallet = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m0 0a2.25 2.25 0 012.25-2.25H15a3 3 0 016 0h.75a2.25 2.25 0 012.25 2.25V9M15 12a3 3 0 11-6 0 3 3 0 016 0z"
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
const iconGift = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
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

const iconShop = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
    />
  </svg>
)

const navItems = [
  { to: '/dashboard', label: 'Home', end: true, icon: iconHome },
  { to: '/dashboard/bookings', label: 'Bookings', icon: iconCalendar },
  { to: '/dashboard/wallet', label: 'Wallet', icon: iconWallet },
  { to: '/dashboard/products', label: 'Shop', icon: iconShop },
  { to: '/dashboard/referrals', label: 'Refer & Earn', icon: iconGift },
  { to: '/dashboard/profile', label: 'Profile', icon: iconUser },
  { to: '/dashboard/disputes', label: 'Disputes', icon: iconDispute },
]

const bottomNavItems = [
  { to: '/dashboard', label: 'Home', end: true, icon: iconHome },
  { to: '/dashboard/bookings', label: 'Bookings', icon: iconCalendar },
  { to: '/dashboard/wallet', label: 'Wallet', icon: iconWallet },
  { to: '/dashboard/products', label: 'Shop', icon: iconShop },
  { to: '/dashboard/profile', label: 'Profile', icon: iconUser },
]

function titleForPath(pathname) {
  if (pathname === '/dashboard' || pathname === '/dashboard/') return 'Home'
  if (pathname.startsWith('/dashboard/bookings/') && pathname !== '/dashboard/bookings') return 'Session'
  if (pathname === '/dashboard/bookings') return 'Bookings'
  if (pathname === '/dashboard/wallet') return 'Wallet'
  if (pathname === '/dashboard/referrals') return 'Refer & Earn'
  if (pathname === '/dashboard/products' || pathname.startsWith('/dashboard/products/')) return 'Shop'
  if (pathname === '/dashboard/cart') return 'Cart'
  if (pathname === '/dashboard/checkout') return 'Checkout'
  if (pathname === '/dashboard/orders' || pathname.startsWith('/dashboard/orders/')) return 'Orders'
  if (pathname === '/dashboard/disputes') return 'Disputes'
  if (pathname === '/dashboard/profile') return 'Profile'
  return 'Dashboard'
}

export default function UserDashboardLayout() {
  const { pathname } = useLocation()
  const topBarTitle = useMemo(() => titleForPath(pathname), [pathname])
  const { itemCount } = useShopCart()

  return (
    <>
      <SeoNoIndex />
      <AppShell
      brand="PhysiOkhom"
      badge="Patient"
      topBarTitle={topBarTitle}
      topBarSubtitle=""
      navItems={navItems}
      bottomNavItems={bottomNavItems}
      headerActions={
        <>
          <Link
            to="/dashboard/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-border-subtle hover:bg-slate-50"
            aria-label="Cart"
          >
            {iconShop}
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            ) : null}
          </Link>
          <Link
            to="/book"
            className="hidden cursor-pointer items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-600/25 transition-all duration-200 hover:bg-teal-700 motion-safe:active:scale-[0.98] sm:inline-flex"
          >
            Book appointment
          </Link>
          <Link
            to="/book"
            className="tap-feedback inline-flex cursor-pointer items-center justify-center rounded-xl bg-teal-600 px-3 py-2 type-button text-white shadow-md shadow-teal-600/25 transition hover:bg-teal-700 md:hidden"
          >
            Book
          </Link>
        </>
      }
      sidebarFooter={<p className="text-center type-caption text-slate-400">Disputes and more in this menu — bottom tabs for quick access.</p>}
      contentClassName="patient-app-mobile"
    >
      <Outlet />
    </AppShell>
    </>
  )
}
