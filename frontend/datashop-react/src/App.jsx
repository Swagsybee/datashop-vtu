import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'
import { ProtectedRoute, AdminRoute } from './layouts/ProtectedLayout'
import AdminLayout from './pages/admin/AdminLayout'

// Auth
import Login    from './pages/auth/Login'
import Register from './pages/auth/Register'

// User pages
import Dashboard       from './pages/dashboard/Dashboard'
import DataPage        from './pages/data/DataPage'
import AirtimePage     from './pages/airtime/AirtimePage'
import ElectricityPage from './pages/electricity/ElectricityPage'
import TVPage          from './pages/tv/TVPage'
import ExamPage        from './pages/exam/ExamPage'
import TransactionsPage from './pages/transactions/TransactionsPage'
import ProfilePage     from './pages/profile/ProfilePage'
import SettingsPage    from './pages/settings/SettingsPage'
import ReferralsPage   from './pages/referrals/ReferralsPage'

// Admin pages
import AdminDashboard    from './pages/admin/AdminDashboard'
import AdminUsers        from './pages/admin/AdminUsers'
import AdminTransactions from './pages/admin/AdminTransactions'
import AdminWallets      from './pages/admin/AdminWallets'
import AdminServices     from './pages/admin/AdminServices'
import AdminRates        from './pages/admin/AdminRates'
import AdminSettings     from './pages/admin/AdminSettings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected user routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard"   element={<Dashboard />} />
            <Route path="/data"        element={<DataPage />} />
            <Route path="/airtime"     element={<AirtimePage />} />
            <Route path="/electricity" element={<ElectricityPage />} />
            <Route path="/tv"          element={<TVPage />} />
            <Route path="/exam"        element={<ExamPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/profile"     element={<ProfilePage />} />
            <Route path="/settings"    element={<SettingsPage />} />
            <Route path="/referrals"   element={<ReferralsPage />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index         element={<AdminDashboard />} />
            <Route path="users"        element={<AdminUsers />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="wallets"      element={<AdminWallets />} />
            <Route path="services"     element={<AdminServices />} />
            <Route path="rates"        element={<AdminRates />} />
            <Route path="settings"     element={<AdminSettings />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
