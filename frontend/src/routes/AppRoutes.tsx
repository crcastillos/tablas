import { Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from '../context/AuthContext'
import MainLayout from '../layouts/MainLayout'
import { LoadingState } from '../components/ui/States'

const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'))
const PeriodsPage = lazy(() => import('../pages/periods/PeriodsPage'))
const IncomesPage = lazy(() => import('../pages/incomes/IncomesPage'))
const BudgetPage = lazy(() => import('../pages/budgets/BudgetPage'))
const ExpensesPage = lazy(() => import('../pages/expenses/ExpensesPage'))
const RecurringPage = lazy(() => import('../pages/recurring/RecurringPage'))
const CategoriesPage = lazy(() => import('../pages/categories/CategoriesPage'))
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'))
const MembersPage = lazy(() => import('../pages/settings/MembersPage'))
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'))
const ForbiddenPage = lazy(() => import('../pages/errors/ForbiddenPage'))
const NotFoundPage = lazy(() => import('../pages/errors/NotFoundPage'))

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingState />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="periods" element={<PeriodsPage />} />
          <Route path="incomes" element={<IncomesPage />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="recurring" element={<RecurringPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
