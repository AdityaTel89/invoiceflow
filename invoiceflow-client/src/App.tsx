import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Invoices from './pages/Invoices'
import CreateInvoice from './pages/CreateInvoice'
import InvoiceDetail from './pages/InvoiceDetail'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            
            <Route path="reports" element={<div className="text-center p-12"><h2 className="text-2xl font-bold text-gray-900 mb-4">Reports</h2><p className="text-gray-600">Coming Soon</p></div>} />
            <Route path="settings" element={<div className="text-center p-12"><h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2><p className="text-gray-600">Coming Soon</p></div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
