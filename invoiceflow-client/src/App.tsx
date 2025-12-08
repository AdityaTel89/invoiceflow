import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ToastProvider from './components/ToastProvider'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Invoices from './pages/Invoices'
import CreateInvoice from './pages/CreateInvoice'
import InvoiceDetail from './pages/InvoiceDetail'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'

// Settings Pages
import Profile from './pages/Settings/Profile'
import BusinessDetails from './pages/Settings/BusinessDetails'
import KYCStatus from './pages/Settings/KYCStatus'
import Settlements from './pages/Settings/Settlements'

// Add admin routes
import AdminDashboard from './pages/Admin/Dashboard'
import KYCReview from './pages/Admin/KYCReview'
import AuditLogs from './pages/Admin/AuditLogs'
import UsersManagement from './pages/Admin/Users'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            
            {/* Invoice Routes */}
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/create" element={<CreateInvoice />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="invoices/:id/edit" element={<CreateInvoice />} />
            <Route path="invoices/draft" element={<Invoices />} />
            <Route path="invoices/sent" element={<Invoices />} />
            <Route path="invoices/paid" element={<Invoices />} />
            <Route path="invoices/overdue" element={<Invoices />} />
            
            {/* Settings Routes */}
            <Route path="settings/profile" element={<Profile />} />
            <Route path="settings/business-details" element={<BusinessDetails />} />
            <Route path="settings/kyc-status" element={<KYCStatus />} />
            <Route path="settings/settlements" element={<Settlements />} />
            <Route path="settings" element={<Navigate to="/settings/profile" replace />} />
            
            <Route path="reports" element={<div className="text-center p-12"><h2 className="text-2xl font-bold text-gray-900 mb-4">Reports</h2><p className="text-gray-600">Coming Soon</p></div>} />

            <Route path="admin/dashboard" element={<AdminDashboard />} />
<Route path="admin/kyc-review" element={<KYCReview />} />
<Route path="admin/audit-logs" element={<AuditLogs />} />
<Route path="admin/users" element={<UsersManagement />} />
<Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
