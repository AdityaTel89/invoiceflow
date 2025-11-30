import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Bars3Icon, 
  BellIcon, 
  MagnifyingGlassIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import Sidebar from './Sidebar'
import { useAuth } from '../hooks/useAuth'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen bg-gradient-to-br from-clean-white to-violet-blue-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="bg-white border-b border-gray-200 shadow-soft">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Left Section - Mobile Menu & Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bars3Icon className="w-6 h-6 text-gray-600" />
              </button>
              
              {/* Mobile Logo */}
              <h1 className="lg:hidden text-xl font-bold text-gradient-violet">
                InvoiceFlow
              </h1>
            </div>

            {/* Center Section - Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search invoices, clients..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Quick Action - New Invoice */}
              <Link to="/invoices/create">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden sm:flex items-center gap-2 gradient-violet text-white px-4 py-2 rounded-lg font-medium shadow-medium hover:shadow-strong transition-all duration-200"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>New Invoice</span>
                </motion.button>
              </Link>

              {/* Mobile Quick Action */}
              <Link to="/invoices/create" className="sm:hidden">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 gradient-violet text-white rounded-lg shadow-medium"
                >
                  <PlusIcon className="w-5 h-5" />
                </motion.button>
              </Link>

              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <BellIcon className="w-6 h-6 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-fiery-rose rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.businessName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="w-10 h-10 rounded-full gradient-violet flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-lg transition-all">
                  {user?.businessName?.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Logout (Desktop) */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="hidden md:block px-4 py-2 bg-gradient-to-r from-fiery-rose to-red-500 text-white rounded-lg hover:shadow-medium transition-all duration-200 font-medium"
              >
                Logout
              </motion.button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden px-4 pb-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue focus:border-transparent"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
