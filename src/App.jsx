import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import HomePage from './pages/HomePage'
import CityLandingPage from './pages/CityLandingPage'
import NearMeHubPage from './pages/NearMeHubPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import RegisterPhysioPage from './pages/RegisterPhysioPage'
import BookingPage from './pages/BookingPage'
import PhysioListPage from './pages/PhysioListPage'
import PublicPhysicianPage from './pages/PublicPhysicianPage'
import MapView from './pages/MapView'
import UnauthorizedPage from './pages/UnauthorizedPage'
import PhysioLayout from './pages/physio/PhysioLayout'
import PhysioBookingsPage from './pages/physio/PhysioBookingsPage'
import PhysioBookingDetailPage from './pages/physio/PhysioBookingDetailPage'
import PhysioAvailabilityPage from './pages/physio/PhysioAvailabilityPage'
import PhysioNotesPage from './pages/physio/PhysioNotesPage'
import PhysioDisputesPage from './pages/physio/PhysioDisputesPage'
import PhysioVerificationPage from './pages/physio/PhysioVerificationPage'
import PhysioOnboardingPage from './pages/physio/PhysioOnboardingPage'
import PhysioWalletPage from './pages/physio/PhysioWalletPage'
import UserDashboardLayout from './pages/dashboard/UserDashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
import DashboardBookings from './pages/dashboard/DashboardBookings'
import DashboardWallet from './pages/dashboard/DashboardWallet'
import UserBookingDetailPage from './pages/dashboard/UserBookingDetailPage'
import DashboardDisputes from './pages/dashboard/DashboardDisputes'
import DashboardReferrals from './pages/dashboard/DashboardReferrals'
import ProfilePage from './pages/dashboard/ProfilePage'
import AdminLayout from './pages/admin/AdminLayout'
import BookingsAdmin from './pages/admin/BookingsAdmin'
import AdminBookingDetailPage from './pages/admin/AdminBookingDetailPage'
import AdminDirectoryPage from './pages/admin/AdminDirectoryPage'
import PhysiosAdmin from './pages/admin/PhysiosAdmin'
import AdminPhysioDetailPage from './pages/admin/AdminPhysioDetailPage'
import DisputesAdmin from './pages/admin/DisputesAdmin'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage'
import AdminFinancePage from './pages/admin/AdminFinancePage'
import AdminPlatformSettingsPage from './pages/admin/AdminPlatformSettingsPage'
import RoleProtectedRoute from './components/RoleProtectedRoute'
import LegacyPhysioDashboardRedirect from './components/LegacyPhysioDashboardRedirect'
import ProfileCompletionGate from './components/ProfileCompletionGate'

function PublicPhysicianRoute() {
  const { id } = useParams()
  return <PublicPhysicianPage key={id} />
}

export default function App() {
  return (
    <BrowserRouter>
      <ProfileCompletionGate>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          className: '!rounded-xl !border !border-slate-100 !bg-white !text-slate-900 !shadow-lg',
          success: { iconTheme: { primary: '#0d9488', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/physio-in/:city" element={<CityLandingPage />} />
        <Route path="/near-me-physio" element={<NearMeHubPage />} />
        <Route path="/near-me-physio/:city" element={<NearMeHubPage />} />
        <Route path="/near-me-physio/:city/:locality" element={<NearMeHubPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/register-physio" element={<RegisterPhysioPage />} />
        <Route
          path="/profile"
          element={
            <RoleProtectedRoute allowedRoles={['user', 'physio', 'admin']}>
              <ProfilePage />
            </RoleProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/physician/:id" element={<PublicPhysicianRoute />} />
        <Route path="/physio-dashboard/*" element={<LegacyPhysioDashboardRedirect />} />
        <Route
          path="/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['user']}>
              <UserDashboardLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="bookings" element={<DashboardBookings />} />
          <Route path="wallet" element={<DashboardWallet />} />
          <Route path="referrals" element={<DashboardReferrals />} />
          <Route path="bookings/:id" element={<UserBookingDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="disputes" element={<DashboardDisputes />} />
        </Route>
        <Route
          path="/book"
          element={
            <RoleProtectedRoute allowedRoles={['user']}>
              <PhysioListPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/book/map"
          element={
            <RoleProtectedRoute allowedRoles={['user']}>
              <MapView />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/book/legacy"
          element={
            <RoleProtectedRoute allowedRoles={['user']}>
              <BookingPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/physio"
          element={
            <RoleProtectedRoute allowedRoles={['physio']}>
              <PhysioLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/physio/bookings" replace />} />
          <Route path="bookings" element={<PhysioBookingsPage />} />
          <Route path="bookings/:id" element={<PhysioBookingDetailPage />} />
          <Route path="availability" element={<PhysioAvailabilityPage />} />
          <Route path="notes" element={<PhysioNotesPage />} />
          <Route path="disputes" element={<PhysioDisputesPage />} />
          <Route path="onboarding" element={<PhysioOnboardingPage />} />
          <Route path="verification" element={<PhysioVerificationPage />} />
          <Route path="wallet" element={<PhysioWalletPage />} />
          <Route path="*" element={<Navigate to="/physio/bookings" replace />} />
        </Route>
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<BookingsAdmin />} />
          <Route path="bookings/:id" element={<AdminBookingDetailPage />} />
          <Route path="users" element={<AdminDirectoryPage />} />
          <Route path="physios" element={<PhysiosAdmin />} />
          <Route path="physios/:id" element={<AdminPhysioDetailPage />} />
          <Route path="verifications" element={<Navigate to="/admin/physios?tab=queue" replace />} />
          <Route path="disputes" element={<DisputesAdmin />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="finance" element={<AdminFinancePage />} />
          <Route path="withdrawals" element={<Navigate to="/admin/finance" replace />} />
          <Route path="settlements" element={<Navigate to="/admin/finance" replace />} />
          <Route path="platform" element={<AdminPlatformSettingsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ProfileCompletionGate>
    </BrowserRouter>
  )
}
