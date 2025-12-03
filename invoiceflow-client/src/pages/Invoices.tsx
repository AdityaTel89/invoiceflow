import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { invoiceService } from '../services/invoiceService'
import type { Invoice } from '../types/invoice.types'

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-700',
    icon: ClockIcon
  },
  sent: {
    label: 'Sent',
    color: 'bg-blue-100 text-blue-700',
    icon: PaperAirplaneIcon
  },
  paid: {
    label: 'Paid',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircleIcon
  },
  overdue: {
    label: 'Overdue',
    color: 'bg-red-100 text-red-700',
    icon: XCircleIcon
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-200 text-gray-600',
    icon: XMarkIcon
  }
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [])

  useEffect(() => {
    filterInvoices()
  }, [invoices, searchTerm, statusFilter])

  const fetchInvoices = async () => {
    try {
      const data = await invoiceService.getAll()
      setInvoices(data)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterInvoices = () => {
    let filtered = [...invoices]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    setFilteredInvoices(filtered)
  }

  const deleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return

    try {
      await invoiceService.delete(id)
      fetchInvoices()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Failed to delete invoice')
    }
  }

  const downloadPDF = async (id: string, invoiceNumber: string) => {
    try {
      const blob = await invoiceService.generatePDF(id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${invoiceNumber}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount)
  }

  const stats = {
    total: invoices.length,
    draft: invoices.filter(inv => inv.status === 'draft').length,
    sent: invoices.filter(inv => inv.status === 'sent').length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoices</h1>
          <p className="text-gray-600">Manage your GST 2.0 compliant invoices</p>
        </div>
        <Link to="/invoices/create">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-4 sm:mt-0 gradient-violet text-white px-6 py-3 rounded-lg font-medium shadow-medium hover:shadow-strong transition-all duration-200 flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            New Invoice
          </motion.button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-soft border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-soft border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Draft</p>
          <p className="text-2xl font-bold text-gray-500">{stats.draft}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-soft border border-blue-100">
          <p className="text-sm text-gray-600 mb-1">Sent</p>
          <p className="text-2xl font-bold text-dodger-blue">{stats.sent}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-soft border border-green-100">
          <p className="text-sm text-gray-600 mb-1">Paid</p>
          <p className="text-2xl font-bold text-vibrant-green">{stats.paid}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-soft border border-red-100">
          <p className="text-sm text-gray-600 mb-1">Overdue</p>
          <p className="text-2xl font-bold text-fiery-rose">{stats.overdue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="Search by invoice number or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FunnelIcon className="w-5 h-5" />
              Filters
            </button>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden"
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-violet-blue border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentArrowDownIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No invoices found' : 'No invoices yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Create your first GST-compliant invoice'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link to="/invoices/create">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="gradient-violet text-white px-6 py-3 rounded-lg font-medium shadow-medium hover:shadow-strong transition-all duration-200"
                >
                  + Create Invoice
                </motion.button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => {
                  const statusConfig = STATUS_CONFIG[invoice.status]
                  const StatusIcon = statusConfig?.icon || ClockIcon

                  return (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          to={`/invoices/${invoice.id}`}
                          className="font-medium text-violet-blue hover:text-electric-purple"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{invoice.client?.name}</div>
                          <div className="text-sm text-gray-500">{invoice.client?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {formatDate(invoice.invoice_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(invoice.total_amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig?.color || 'bg-gray-100 text-gray-700'}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusConfig?.label || invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/invoices/${invoice.id}`}>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </motion.button>
                          </Link>
                          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                            <Link to={`/invoices/${invoice.id}/edit`}>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 text-dodger-blue hover:bg-dodger-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </motion.button>
                            </Link>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => downloadPDF(invoice.id, invoice.invoice_number)}
                            className="p-2 text-vibrant-green hover:bg-vibrant-green-50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <DocumentArrowDownIcon className="w-5 h-5" />
                          </motion.button>
                          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deleteInvoice(invoice.id)}
                              className="p-2 text-fiery-rose hover:bg-fiery-rose-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Summary */}
      {filteredInvoices.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </span>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-violet-blue">
                {formatCurrency(
                  filteredInvoices.reduce((sum, inv) => sum + parseFloat(String(inv.total_amount)), 0)
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
