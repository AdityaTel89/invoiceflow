import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { useToast } from '../../hooks/useToast'
import adminService from '../../services/admin.service'

interface AdminStats {
  totalUsers: number
  totalInvoices: number
  pendingKYC: number
  verifiedKYC: number
  rejectedKYC: number
  totalRevenue: number
  totalSettlements: number
  activeUsers: number
}

export default function AdminDashboard() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalInvoices: 0,
    pendingKYC: 0,
    verifiedKYC: 0,
    rejectedKYC: 0,
    totalRevenue: 0,
    totalSettlements: 0,
    activeUsers: 0
  })

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      setLoading(true)
      const data = await adminService.getStats()
      setStats(data)
    } catch (error: any) {
      toast.error('Failed to load admin statistics')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: UsersIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      change: '+12%'
    },
    {
      title: 'Total Invoices',
      value: stats.totalInvoices,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      change: '+8%'
    },
    {
      title: 'Pending KYC',
      value: stats.pendingKYC,
      icon: ClockIcon,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      change: '5 new'
    },
    {
      title: 'Verified KYC',
      value: stats.verifiedKYC,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      change: '+15%'
    },
    {
      title: 'Total Revenue',
      value: `₹${(stats.totalRevenue / 100000).toFixed(2)}L`,
      icon: ChartBarIcon,
      color: 'bg-violet-500',
      bgColor: 'bg-violet-50',
      change: '+23%'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: UsersIcon,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      change: '85%'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users, KYC, and system operations</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg">
          <ShieldCheckIcon className="w-5 h-5" />
          <span className="font-medium">Admin Access</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-soft p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-green-600 mt-2">{stat.change}</p>
              </div>
              <div className={`p-4 ${stat.bgColor} rounded-lg`}>
                <stat.icon className={`w-8 h-8 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending KYC */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-soft p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending KYC Reviews</h3>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
              {stats.pendingKYC} Pending
            </span>
          </div>
          <p className="text-gray-600 mb-4">Review and verify user KYC submissions</p>
          <a
            href="/admin/kyc-review"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <EyeIcon className="w-5 h-5" />
            Review KYC Submissions
          </a>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg shadow-soft p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Activity</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Live
            </span>
          </div>
          <p className="text-gray-600 mb-4">Monitor system logs and user actions</p>
          <a
            href="/admin/audit-logs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <DocumentTextIcon className="w-5 h-5" />
            View Audit Logs
          </a>
        </motion.div>
      </div>

      {/* Recent Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-lg shadow-soft p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
          <a href="/admin/users" className="text-violet-blue hover:underline text-sm font-medium">
            View All
          </a>
        </div>
        <div className="text-center py-8 text-gray-500">
          Loading recent users...
        </div>
      </motion.div>
    </div>
  )
}
