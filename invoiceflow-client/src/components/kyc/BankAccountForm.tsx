import { motion } from 'framer-motion'
import { BanknotesIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { validateIFSC } from '../../utils/validators'
import type { BankDetails } from '../../types/kyc.types'

interface Props {
  data: BankDetails
  onChange: (data: Partial<BankDetails>) => void
  errors: Record<string, string>
  disabled?: boolean
}

export default function BankAccountForm({ data, onChange, errors, disabled }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-lg shadow-soft p-6 space-y-6"
    >
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="p-2 bg-green-50 rounded-lg">
          <BanknotesIcon className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bank Account Details</h3>
          <p className="text-sm text-gray-500">For receiving payments via Razorpay Route</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Holder Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Holder Name <span className="text-fiery-rose">*</span>
          </label>
          <input
            type="text"
            value={data.accountHolderName}
            onChange={(e) => onChange({ accountHolderName: e.target.value })}
            disabled={disabled}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all ${
              errors.accountHolderName ? 'border-fiery-rose' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="As per bank records"
          />
          {errors.accountHolderName && (
            <p className="mt-1 text-sm text-fiery-rose">{errors.accountHolderName}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <ShieldCheckIcon className="w-4 h-4" />
            Must match PAN card name
          </p>
        </div>

        {/* Bank Account Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank Account Number <span className="text-fiery-rose">*</span>
          </label>
          <input
            type="text"
            value={data.accountNumber}
            onChange={(e) => onChange({ accountNumber: e.target.value.replace(/\D/g, '') })}
            disabled={disabled}
            maxLength={18}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all ${
              errors.accountNumber ? 'border-fiery-rose' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="Enter account number"
          />
          {errors.accountNumber && (
            <p className="mt-1 text-sm text-fiery-rose">{errors.accountNumber}</p>
          )}
        </div>

        {/* Confirm Account Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Account Number <span className="text-fiery-rose">*</span>
          </label>
          <input
            type="text"
            value={data.confirmAccountNumber}
            onChange={(e) => onChange({ confirmAccountNumber: e.target.value.replace(/\D/g, '') })}
            disabled={disabled}
            maxLength={18}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all ${
              errors.confirmAccountNumber ? 'border-fiery-rose' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="Re-enter account number"
          />
          {errors.confirmAccountNumber && (
            <p className="mt-1 text-sm text-fiery-rose">{errors.confirmAccountNumber}</p>
          )}
          {data.accountNumber && data.confirmAccountNumber && data.accountNumber === data.confirmAccountNumber && (
            <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
              ✓ Account numbers match
            </p>
          )}
        </div>

        {/* IFSC Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            IFSC Code <span className="text-fiery-rose">*</span>
          </label>
          <input
            type="text"
            value={data.ifscCode}
            onChange={(e) => onChange({ ifscCode: e.target.value.toUpperCase() })}
            disabled={disabled}
            maxLength={11}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all uppercase ${
              errors.ifscCode ? 'border-fiery-rose' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="ABCD0123456"
          />
          {errors.ifscCode && (
            <p className="mt-1 text-sm text-fiery-rose">{errors.ifscCode}</p>
          )}
          {data.ifscCode && validateIFSC(data.ifscCode) && (
            <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
              ✓ Valid IFSC format
            </p>
          )}
        </div>

        {/* Bank Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank Name <span className="text-fiery-rose">*</span>
          </label>
          <input
            type="text"
            value={data.bankName}
            onChange={(e) => onChange({ bankName: e.target.value })}
            disabled={disabled}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all ${
              errors.bankName ? 'border-fiery-rose' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="e.g., HDFC Bank"
          />
          {errors.bankName && (
            <p className="mt-1 text-sm text-fiery-rose">{errors.bankName}</p>
          )}
        </div>

        {/* Branch */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Branch Name <span className="text-fiery-rose">*</span>
          </label>
          <input
            type="text"
            value={data.branch}
            onChange={(e) => onChange({ branch: e.target.value })}
            disabled={disabled}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all ${
              errors.branch ? 'border-fiery-rose' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="e.g., Koramangala, Bangalore"
          />
          {errors.branch && (
            <p className="mt-1 text-sm text-fiery-rose">{errors.branch}</p>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <ShieldCheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Your data is secure</p>
            <p className="text-blue-700">
              We only store the last 4 digits of your account number. Full details are encrypted and sent directly to Razorpay.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
