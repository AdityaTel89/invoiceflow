import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  TruckIcon,
  QrCodeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckBadgeIcon,
  EyeIcon,
  ShareIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import { invoiceService } from '../services/invoiceService'
import type { Invoice } from '../types/invoice.types'
import axios from 'axios'
import QRCode from 'react-qr-code'

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-700',
    icon: ClockIcon,
    actions: [
      { status: 'sent', label: 'Mark as Sent', icon: PaperAirplaneIcon, color: 'bg-blue-600' }
    ]
  },
  sent: {
    label: 'Sent',
    color: 'bg-blue-100 text-blue-700',
    icon: PaperAirplaneIcon,
    actions: [
      { status: 'paid', label: 'Mark as Paid', icon: CheckCircleIcon, color: 'bg-green-600' }
    ]
  },
  paid: {
    label: 'Paid',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircleIcon,
    actions: []
  },
  overdue: {
    label: 'Overdue',
    color: 'bg-red-100 text-red-700',
    icon: ExclamationTriangleIcon,
    actions: [
      { status: 'paid', label: 'Mark as Paid', icon: CheckCircleIcon, color: 'bg-green-600' }
    ]
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-200 text-gray-600',
    icon: ExclamationTriangleIcon,
    actions: []
  }
}

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchInvoice()
      fetchUser()
    }
  }, [id])

  const fetchInvoice = async () => {
    try {
      const data = await invoiceService.getById(id!)
      console.log('Fetched invoice:', data)
      setInvoice(data)
    } catch (error: any) {
      console.error('Error fetching invoice:', error)
      alert(error.message || 'Invoice not found')
      navigate('/invoices')
    } finally {
      setLoading(false)
    }
  }

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('Fetched user:', response.data.user)
      setUser(response.data.user)
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const updateStatus = async (newStatus: string) => {
    try {
      setActionLoading('status')
      await invoiceService.updateStatus(id!, newStatus)
      await fetchInvoice()
      alert('Invoice status updated successfully!')
    } catch (error: any) {
      console.error('Error updating status:', error)
      alert(error.message || 'Failed to update invoice status')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteInvoice = async () => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return

    try {
      setActionLoading('delete')
      await invoiceService.delete(id!)
      alert('Invoice deleted successfully!')
      navigate('/invoices')
    } catch (error: any) {
      console.error('Error deleting invoice:', error)
      alert(error.message || 'Failed to delete invoice')
      setActionLoading(null)
    }
  }

  const downloadPDF = async () => {
    try {
      setActionLoading('download')
      await invoiceService.downloadPDF(id!, invoice?.invoice_number || 'invoice')
      // Success notification handled by browser download
    } catch (error: any) {
      console.error('Error downloading PDF:', error)
      alert(error.message || 'Failed to download PDF')
    } finally {
      setActionLoading(null)
    }
  }

  const viewPDF = async () => {
    try {
      setActionLoading('view')
      await invoiceService.viewPDF(id!)
      // PDF opens in new tab - no additional notification needed
    } catch (error: any) {
      console.error('Error viewing PDF:', error)
      alert(error.message || 'Failed to open PDF')
    } finally {
      setActionLoading(null)
    }
  }

  const sharePDF = async () => {
    try {
      setActionLoading('share')
      const url = await invoiceService.sharePDF(id!)
      
      // Better UX with success notification
      const message = `✅ PDF link copied to clipboard!\n\nYou can now paste and share this link:\n${url}`
      alert(message)
    } catch (error: any) {
      console.error('Error sharing PDF:', error)
      alert(error.message || 'Failed to get shareable link')
    } finally {
      setActionLoading(null)
    }
  }

  const duplicateInvoice = async () => {
    if (!confirm('Create a duplicate of this invoice?')) return
    
    try {
      setActionLoading('duplicate')
      const newInvoice = await invoiceService.duplicate(id!)
      alert('✅ Invoice duplicated successfully!')
      navigate(`/invoices/${newInvoice.id}`)
    } catch (error: any) {
      console.error('Error duplicating invoice:', error)
      alert(error.message || 'Failed to duplicate invoice')
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount)
  }

  // Check if inter-state based on stored GST amounts
  const isInterState = () => {
    if (!invoice) return false
    const igstAmount = parseFloat(String(invoice.igst_amount || 0))
    return igstAmount > 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center p-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoice not found</h2>
        <Link to="/invoices" className="text-violet-600 hover:text-purple-700">
          Back to Invoices
        </Link>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG]
  const StatusIcon = statusConfig?.icon || ClockIcon

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Invoices
        </button>
        
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-900">
                {invoice.invoice_number}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig?.color}`}>
                <StatusIcon className="w-4 h-4" />
                {statusConfig?.label}
              </span>
            </div>
            <p className="text-gray-600">
              Created on {formatDateTime(invoice.created_at)}
            </p>
            {invoice.updated_at !== invoice.created_at && (
              <p className="text-sm text-gray-500">
                Updated on {formatDateTime(invoice.updated_at)}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Status Update Buttons */}
            {statusConfig?.actions.map((action) => {
              const ActionIcon = action.icon
              return (
                <motion.button
                  key={action.status}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateStatus(action.status)}
                  disabled={actionLoading === 'status'}
                  className={`${action.color} text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {actionLoading === 'status' ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <ActionIcon className="w-5 h-5" />
                  )}
                  {action.label}
                </motion.button>
              )
            })}
            
            {/* View PDF Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={viewPDF}
              disabled={!!actionLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              title="View PDF in new tab"
            >
              {actionLoading === 'view' ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
              View PDF
            </motion.button>

            {/* Download PDF Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={downloadPDF}
              disabled={!!actionLoading}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              title="Download PDF"
            >
              {actionLoading === 'download' ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <DocumentArrowDownIcon className="w-5 h-5" />
              )}
              Download
            </motion.button>

            {/* Share PDF Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sharePDF}
              disabled={!!actionLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              title="Copy shareable link"
            >
              {actionLoading === 'share' ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <ShareIcon className="w-5 h-5" />
              )}
              Share Link
            </motion.button>

            {/* Duplicate Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={duplicateInvoice}
              disabled={!!actionLoading}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              title="Duplicate Invoice"
            >
              {actionLoading === 'duplicate' ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <DocumentDuplicateIcon className="w-5 h-5" />
              )}
              Duplicate
            </motion.button>
            
            {/* Edit & Delete Buttons */}
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <>
                <Link to={`/invoices/${invoice.id}/edit`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Invoice"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={deleteInvoice}
                  disabled={actionLoading === 'delete'}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete Invoice"
                >
                  {actionLoading === 'delete' ? (
                    <div className="animate-spin w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full"></div>
                  ) : (
                    <TrashIcon className="w-5 h-5" />
                  )}
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Document */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-8"
          >
            {/* Invoice Header */}
            <div className="border-b-2 border-gray-200 pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-4">
                    TAX INVOICE
                  </h2>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-900 text-lg">{user?.business_name || 'Your Business'}</p>
                    {user?.address && <p>{user.address}</p>}
                    {user?.email && <p>Email: {user.email}</p>}
                    {user?.phone && <p>Phone: {user.phone}</p>}
                    {user?.gstin && <p className="font-medium">GSTIN: {user.gstin}</p>}
                    {user?.pan && <p>PAN: {user.pan}</p>}
                    {user?.state_name && <p>State: {user.state_name} ({user.state_code})</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="text-2xl font-bold text-gray-900 mb-3">{invoice.invoice_number}</p>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-600">Invoice Date: </span>
                      <span className="font-medium text-gray-900">{formatDate(invoice.invoice_date)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Due Date: </span>
                      <span className="font-medium text-gray-900">{formatDate(invoice.due_date)}</span>
                    </div>
                    {invoice.supply_date && (
                      <div>
                        <span className="text-gray-600">Supply Date: </span>
                        <span className="font-medium text-gray-900">{formatDate(invoice.supply_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To:</h3>
                  <div className="text-gray-900 space-y-1">
                    <p className="font-semibold text-lg">{invoice.client?.name}</p>
                    <p className="text-sm">{invoice.client?.email}</p>
                    {invoice.client?.phone && <p className="text-sm">{invoice.client.phone}</p>}
                    {invoice.client?.billing_address && (
                      <p className="text-sm text-gray-600">{invoice.client.billing_address}</p>
                    )}
                    {invoice.client?.gstin && (
                      <p className="text-sm font-medium">GSTIN: {invoice.client.gstin}</p>
                    )}
                    {invoice.client?.pan && <p className="text-sm">PAN: {invoice.client.pan}</p>}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Supply Details:</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-600">Place of Supply: </span>
                      <span className="font-medium text-gray-900">{invoice.place_of_supply}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Supply Type: </span>
                      <span className="font-medium text-gray-900">
                        {isInterState() ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                      </span>
                    </div>
                    {invoice.is_reverse_charge && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                        <p className="text-sm font-medium text-amber-800">
                          ⚠️ Reverse Charge Applicable
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y-2 border-gray-300">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700">#</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700">Description</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700">HSN/SAC</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700">Qty</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700">Rate</th>
                    {invoice.items?.some(item => parseFloat(String(item.discount || 0)) > 0) && (
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700">Discount</th>
                    )}
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700">Tax %</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.items?.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-3 py-3 text-sm text-gray-900">
                        <div className="font-medium">{item.description}</div>
                        {item.unit && item.unit !== 'NOS' && (
                          <div className="text-xs text-gray-500">Unit: {item.unit}</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600">{item.hsn_sac}</td>
                      <td className="px-3 py-3 text-sm text-right text-gray-600">
                        {parseFloat(String(item.quantity)).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-sm text-right text-gray-600">
                        {formatCurrency(item.rate)}
                      </td>
                      {invoice.items?.some(item => parseFloat(String(item.discount || 0)) > 0) && (
                        <td className="px-3 py-3 text-sm text-right text-red-600">
                          {item.discount && parseFloat(String(item.discount)) > 0 
                            ? `-${formatCurrency(item.discount)}`
                            : '-'
                          }
                        </td>
                      )}
                      <td className="px-3 py-3 text-sm text-right text-gray-600">
                        {parseFloat(String(item.tax_rate)).toFixed(2)}%
                      </td>
                      <td className="px-3 py-3 text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-6">
              <div className="w-full md:w-96 space-y-2 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                </div>
                
                {/* Tax Breakdown */}
                {parseFloat(String(invoice.igst_amount || 0)) > 0 ? (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>IGST:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(invoice.igst_amount)}
                    </span>
                  </div>
                ) : (
                  <>
                    {parseFloat(String(invoice.cgst_amount || 0)) > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>CGST:</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(invoice.cgst_amount)}
                        </span>
                      </div>
                    )}
                    {parseFloat(String(invoice.sgst_amount || 0)) > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>SGST:</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(invoice.sgst_amount)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                {invoice.cess_amount && parseFloat(String(invoice.cess_amount)) > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>CESS:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(invoice.cess_amount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm text-gray-600 border-t border-gray-300 pt-2">
                  <span>Total Tax:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(invoice.tax_amount)}</span>
                </div>
                
                {invoice.round_off && parseFloat(String(invoice.round_off)) !== 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Round Off:</span>
                    <span className="font-medium text-gray-900">
                      {parseFloat(String(invoice.round_off)) >= 0 ? '+' : ''}
                      {formatCurrency(Math.abs(parseFloat(String(invoice.round_off))))}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-gray-400">
                  <span>Total Amount:</span>
                  <span className="text-violet-600">{formatCurrency(invoice.total_amount)}</span>
                </div>
                
                {invoice.amount_in_words && (
                  <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                    <span className="font-medium">Amount in Words: </span>
                    <span className="italic">{invoice.amount_in_words}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms_conditions) && (
              <div className="space-y-4 pt-6 border-t-2 border-gray-200">
                {invoice.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Notes:</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms_conditions && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Terms & Conditions:</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.terms_conditions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">Thank you for your business!</p>
              <p className="text-xs text-gray-400 mt-1">This is a computer-generated invoice</p>
            </div>
          </motion.div>
        </div>

        {/* Sidebar - Additional Info */}
        <div className="space-y-6">
          {/* Payment Status Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium mt-1 ${statusConfig?.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  {statusConfig?.label}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</p>
              </div>
              {invoice.paid_date && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                    <CheckBadgeIcon className="w-5 h-5" />
                    Paid on {formatDate(invoice.paid_date)}
                  </p>
                </div>
              )}
              {invoice.status === 'overdue' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    Payment Overdue
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* E-Invoice Details */}
          {(invoice.irn || invoice.irn_ack_no) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                E-Invoice Details
              </h3>
              <div className="space-y-3 text-sm">
                {invoice.irn && (
                  <div>
                    <p className="text-gray-600 font-medium">IRN (Invoice Reference Number)</p>
                    <p className="text-gray-900 font-mono text-xs break-all bg-white p-2 rounded mt-1 border border-blue-200">
                      {invoice.irn}
                    </p>
                  </div>
                )}
                {invoice.irn_ack_no && (
                  <div>
                    <p className="text-gray-600 font-medium">Acknowledgement Number</p>
                    <p className="text-gray-900 font-mono bg-white px-2 py-1 rounded border border-blue-200">
                      {invoice.irn_ack_no}
                    </p>
                  </div>
                )}
                {invoice.irn_ack_date && (
                  <div>
                    <p className="text-gray-600 font-medium">Acknowledgement Date</p>
                    <p className="text-gray-900">{formatDateTime(invoice.irn_ack_date)}</p>
                  </div>
                )}
                {invoice.irn_qr_code && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-gray-600 font-medium mb-3 flex items-center gap-2">
                      <QrCodeIcon className="w-5 h-5" />
                      Signed QR Code
                    </p>
                    <div className="bg-white p-4 rounded-lg border-2 border-blue-300 flex items-center justify-center">
                      <QRCode
                        value={invoice.irn_qr_code}
                        size={180}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Scan to verify invoice authenticity
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* E-Way Bill Details */}
          {(invoice.eway_bill_no) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg border border-purple-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TruckIcon className="w-6 h-6 text-purple-600" />
                E-Way Bill Details
              </h3>
              <div className="space-y-3 text-sm">
                {invoice.eway_bill_no && (
                  <div>
                    <p className="text-gray-600 font-medium">E-Way Bill Number</p>
                    <p className="text-gray-900 font-mono text-lg">{invoice.eway_bill_no}</p>
                  </div>
                )}
                {invoice.eway_valid_from && (
                  <div>
                    <p className="text-gray-600 font-medium">Valid From</p>
                    <p className="text-gray-900">{formatDateTime(invoice.eway_valid_from)}</p>
                  </div>
                )}
                {invoice.eway_valid_to && (
                  <div>
                    <p className="text-gray-600 font-medium">Valid To</p>
                    <p className="text-gray-900">{formatDateTime(invoice.eway_valid_to)}</p>
                  </div>
                )}
                {invoice.vehicle_no && (
                  <div>
                    <p className="text-gray-600 font-medium">Vehicle Number</p>
                    <p className="text-gray-900 uppercase font-semibold">{invoice.vehicle_no}</p>
                  </div>
                )}
                {invoice.transporter_id && (
                  <div>
                    <p className="text-gray-600 font-medium">Transporter ID</p>
                    <p className="text-gray-900">{invoice.transporter_id}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Timeline Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-xs text-gray-600">{formatDateTime(invoice.created_at)}</p>
                </div>
              </div>
              {invoice.updated_at !== invoice.created_at && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <PencilIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Updated</p>
                    <p className="text-xs text-gray-600">{formatDateTime(invoice.updated_at)}</p>
                  </div>
                </div>
              )}
              {invoice.paid_date && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Paid</p>
                    <p className="text-xs text-gray-600">{formatDate(invoice.paid_date)}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
