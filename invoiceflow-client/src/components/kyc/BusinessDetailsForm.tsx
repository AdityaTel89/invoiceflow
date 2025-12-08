import { motion } from 'framer-motion'
import { BuildingOfficeIcon  } from '@heroicons/react/24/outline'
import { BUSINESS_TYPES } from '../../utils/constants'
import { validateGSTIN, validatePAN, extractPANFromGSTIN } from '../../utils/validators'
import type { BusinessDetails } from '../../types/kyc.types'

interface Props {
  data: BusinessDetails
  onChange: (data: Partial<BusinessDetails>) => void
  errors: Record<string, string>
  disabled?: boolean
}

export default function BusinessDetailsForm({ data, onChange, errors, disabled }: Props) {
  const handleGSTINChange = (gstin: string) => {
    onChange({ gstin: gstin.toUpperCase() })
    
    // Auto-fill PAN from GSTIN
    if (validateGSTIN(gstin)) {
      const pan = extractPANFromGSTIN(gstin)
      onChange({ gstin: gstin.toUpperCase(), pan })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-soft p-6 space-y-6"
    >
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="p-2 bg-violet-blue-50 rounded-lg">
          <BuildingOfficeIcon className="w-6 h-6 text-violet-blue" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
          <p className="text-sm text-gray-500">Enter your business details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Legal Business Name <span className="text-fiery-rose">*</span>
          </label>
          <input
            type="text"
            value={data.businessName}
            onChange={(e) => onChange({ businessName: e.target.value })}
            disabled={disabled}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all ${
              errors.businessName ? 'border-fiery-rose' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="Enter legal business name"
          />
          {errors.businessName && (
            <p className="mt-1 text-sm text-fiery-rose">{errors.businessName}</p>
          )}
        </div>

        {/* GSTIN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GSTIN <span className="text-fiery-rose">*</span>
          </label>
          <input
            type="text"
            value={data.gstin}
            onChange={(e) => handleGSTINChange(e.target.value)}
            disabled={disabled}
            maxLength={15}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all uppercase ${
              errors.gstin ? 'border-fiery-rose' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="29ABCDE1234F1Z5"
          />
          {errors.gstin && (
            <p className="mt-1 text-sm text-fiery-rose">{errors.gstin}</p>
          )}
          {data.gstin && validateGSTIN(data.gstin) && (
            <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
              ✓ Valid GSTIN format
            </p>
          )}
        </div>

        {/* PAN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PAN <span className="text-fiery-rose">*</span>
          </label>
          <input
            type="text"
            value={data.pan}
            onChange={(e) => onChange({ pan: e.target.value.toUpperCase() })}
            disabled={disabled}
            maxLength={10}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all uppercase ${
              errors.pan ? 'border-fiery-rose' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="ABCDE1234F"
          />
          {errors.pan && (
            <p className="mt-1 text-sm text-fiery-rose">{errors.pan}</p>
          )}
          {data.pan && validatePAN(data.pan) && (
            <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
              ✓ Valid PAN format
            </p>
          )}
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Type <span className="text-fiery-rose">*</span>
          </label>
          <select
            value={data.businessType}
            onChange={(e) => onChange({ businessType: e.target.value as any })}
            disabled={disabled}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all ${
              errors.businessType ? 'border-fiery-rose' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          >
            <option value="">Select business type</option>
            {BUSINESS_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {errors.businessType && (
            <p className="mt-1 text-sm text-fiery-rose">{errors.businessType}</p>
          )}
        </div>

        {/* Business Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Address <span className="text-fiery-rose">*</span>
          </label>
          <textarea
            value={data.businessAddress}
            onChange={(e) => onChange({ businessAddress: e.target.value })}
            disabled={disabled}
            rows={3}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all ${
              errors.businessAddress ? 'border-fiery-rose' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="Enter complete business address"
          />
          {errors.businessAddress && (
            <p className="mt-1 text-sm text-fiery-rose">{errors.businessAddress}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
