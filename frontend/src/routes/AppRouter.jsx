import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import DashboardLayout from '../layouts/DashboardLayout'
import SignInPage from '../pages/SignInPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'
import DashboardPage from '../pages/DashboardPage'
import UsersPage from '../pages/UsersPage'
import LessonsPage from '../pages/LessonsPage'
import LibraryPage from '../pages/LibraryPage'
import CreditsPage from '../pages/CreditsPage'
import VisitsPage from '../pages/VisitsPage'
import NotFoundPage from '../pages/NotFoundPage'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['Admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/lessons" element={<LessonsPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/credits" element={<CreditsPage />} />
        <Route
          path="/visits"
          element={
            <ProtectedRoute roles={['Admin']}>
              <VisitsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
