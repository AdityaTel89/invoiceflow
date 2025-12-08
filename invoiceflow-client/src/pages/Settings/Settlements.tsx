import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BanknotesIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import SettingsLayout from '../../components/settings/SettingsLayout'
import settlementService from '../../services/settlement.service'
import type { Settlement } from '../../types/settlement.types'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  initiated: 'bg-blue-100 text-blue-800',
  processed: 'bg-purple-100 text-purple-800',
  settled: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  reversed: 'bg-gray-100 text-gray-800'
}

const statusIcons = {
  pending: ClockIcon,
  initiated: ArrowPathIcon,
  processed: ArrowPathIcon,
  settled: CheckCircleIcon,
  failed: XCircleIcon,
  reversed: XCircleIcon
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchSettlements()
  }, [])

  const fetchSettlements = async () => {
    try {
      setLoading(true)
      const data = await settlementService.getUserSettlements()
      setSettlements(data)
    } catch (error) {
      console.error('Failed to fetch settlements:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSettlements = filter === 'all' 
    ? settlements 
    : settlements.filter(s => s.settlement_status === filter)

  const totalSettled = settlements
    .filter(s => s.settlement_status === 'settled')
    .reduce((sum, s) => sum + s.net_amount, 0)

  const pendingAmount = settlements
    .filter(s => ['pending', 'initiated', 'processed'].includes(s.settlement_status))
    .reduce((sum, s) => sum + s.net_amount, 0)

  if (loading) {
    return (
      <SettingsLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-blue"></div>
        </div>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-soft p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <BanknotesIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Settled</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalSettled.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-soft p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">₹{pendingAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-soft p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-blue-50 rounded-lg">
                <ArrowPathIcon className="w-6 h-6 text-violet-blue" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{settlements.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Settlements Table */}
        <div className="bg-white rounded-lg shadow-soft overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Settlement History</h2>
              <div className="flex gap-2">
                {['all', 'settled', 'pending', 'failed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === status
                        ? 'gradient-violet text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fees</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSettlements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No settlements found
                    </td>
                  </tr>
                ) : (
                  filteredSettlements.map(settlement => {
                    const StatusIcon = statusIcons[settlement.settlement_status]
                    return (
                      <tr key={settlement.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900">
                            {settlement.invoice?.invoice_number || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(settlement.created_at).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{settlement.invoice_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          -₹{(settlement.platform_commission + settlement.razorpay_fees + settlement.gst_on_fees).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          ₹{settlement.net_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusColors[settlement.settlement_status]}`}>
                            <StatusIcon className="w-4 h-4" />
                            {settlement.settlement_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                          {settlement.settlement_utr || '-'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SettingsLayout>
  )
}
