// frontend/src/pages/Dashboard.tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  DocumentTextIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { dashboardService } from '../services/dashboardService'
import InvoiceStatusBadge from '../components/InvoiceStatusBadge'

interface DashboardStats {
  totalInvoices: number
  draft: number
  sent: number
  paid: number
  overdue: number
  cancelled: number
  totalRevenue: number
  paidRevenue: number
  pendingPayments: number
  overdueAmount: number
  thisMonthInvoices: number
  thisMonthRevenue: number
  paidThisMonth: number
}

interface RecentInvoice {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  total_amount: string
  status: string
  paid_date?: string
  client: {
    id: string
    name: string
    email: string
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [statsResponse, invoicesResponse] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentInvoices(5)
      ])

      if (statsResponse.success) {
        setStats(statsResponse.stats)
      }

      if (invoicesResponse.success) {
        setRecentInvoices(invoicesResponse.invoices)
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      setError(error.response?.data?.error || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-12">
        <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="bg-violet-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-violet-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total Invoices',
      value: stats?.totalInvoices || 0,
      icon: DocumentTextIcon,
      color: 'from-violet-600 to-purple-600',
      bgColor: 'bg-violet-50',
      subtext: `${stats?.thisMonthInvoices || 0} this month`
    },
    {
      name: 'Pending Payments',
      value: formatCurrency(stats?.pendingPayments || 0),
      icon: ClockIcon,
      color: 'from-blue-600 to-violet-600',
      bgColor: 'bg-blue-50',
      subtext: `${stats?.sent || 0} sent, ${stats?.overdue || 0} overdue`
    },
    {
      name: 'Paid This Month',
      value: formatCurrency(stats?.paidThisMonth || 0),
      icon: CheckCircleIcon,
      color: 'from-green-600 to-green-500',
      bgColor: 'bg-green-50',
      subtext: `Total paid: ${formatCurrency(stats?.paidRevenue || 0)}`
    },
    {
      name: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: CurrencyRupeeIcon,
      color: 'from-orange-600 to-red-600',
      bgColor: 'bg-orange-50',
      subtext: `This month: ${formatCurrency(stats?.thisMonthRevenue || 0)}`
    }
  ]

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's an overview of your invoices.</p>
        </div>
        <Link to="/invoices/create">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Create Invoice
          </motion.button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.name}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className="w-6 h-6 text-violet-600" />
                  </div>
                </div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">{stat.name}</h3>
                <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500">{stat.subtext}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Status Breakdown */}
      {stats && stats.totalInvoices > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Status Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Draft', count: stats.draft, color: 'bg-gray-100 text-gray-700' },
              { label: 'Sent', count: stats.sent, color: 'bg-blue-100 text-blue-700' },
              { label: 'Paid', count: stats.paid, color: 'bg-green-100 text-green-700' },
              { label: 'Overdue', count: stats.overdue, color: 'bg-red-100 text-red-700' },
              { label: 'Cancelled', count: stats.cancelled, color: 'bg-gray-200 text-gray-600' }
            ].map((item) => (
              <div key={item.label} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className={`text-3xl font-bold ${item.color.includes('bg-gray-100') ? 'text-gray-700' : 
                  item.color.includes('bg-blue') ? 'text-blue-600' : 
                  item.color.includes('bg-green') ? 'text-green-600' : 
                  item.color.includes('bg-red') ? 'text-red-600' : 'text-gray-600'}`}>
                  {item.count}
                </p>
                <p className="text-sm text-gray-600 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Invoices Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-md border border-gray-100"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Recent Invoices</h2>
          <Link 
            to="/invoices"
            className="text-violet-600 hover:text-violet-700 font-medium text-sm flex items-center gap-1"
          >
            View All
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            </motion.div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
            <p className="text-gray-500 mb-6">Create your first invoice to get started</p>
            <Link to="/invoices/create">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Create Invoice
              </motion.button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentInvoices.map((invoice, index) => (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{invoice.invoice_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{invoice.client.name}</div>
                      <div className="text-xs text-gray-500">{invoice.client.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(invoice.invoice_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(invoice.due_date)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(parseFloat(invoice.total_amount))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <InvoiceStatusBadge 
                        status={invoice.status} 
                        dueDate={invoice.due_date} 
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="text-violet-600 hover:text-violet-700 font-medium text-sm"
                      >
                        View →
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Overdue Alert */}
      {stats && stats.overdue > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg"
        >
          <div className="flex items-start gap-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-1">
                {stats.overdue} Overdue Invoice{stats.overdue > 1 ? 's' : ''}
              </h3>
              <p className="text-red-700 mb-3">
                You have {stats.overdue} overdue invoice{stats.overdue > 1 ? 's' : ''} worth {formatCurrency(stats.overdueAmount)}. 
                Send payment reminders to your clients.
              </p>
              <Link to="/invoices?status=overdue">
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm">
                  View Overdue Invoices
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
