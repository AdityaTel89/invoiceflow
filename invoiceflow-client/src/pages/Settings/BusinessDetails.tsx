import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import SettingsLayout from '../../components/settings/SettingsLayout'
import BusinessDetailsForm from '../../components/kyc/BusinessDetailsForm'
import BankAccountForm from '../../components/kyc/BankAccountForm'
import DocumentUploadSection from '../../components/kyc/DocumentUploadSection'
import { useKYC } from '../../hooks/useKYC'
import { useRateLimit } from '../../hooks/useRateLimit'
import { validateGSTIN, validatePAN, validateIFSC, validateBankAccount, validatePhone, extractPANFromGSTIN } from '../../utils/validators'
import type { BusinessDetails, BankDetails, DocumentUpload } from '../../types/kyc.types'

export default function BusinessDetailsPage() {
  const navigate = useNavigate()
  const { kycStatus, submitKYC } = useKYC()
  const { attemptsLeft, canAttempt, recordAttempt } = useRateLimit('kyc_submission')

  const [businessData, setBusinessData] = useState<BusinessDetails>({
    businessName: '',
    gstin: '',
    pan: '',
    businessType: 'proprietorship',
    businessAddress: ''
  })

  const [bankData, setBankData] = useState<BankDetails>({
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: '',
    branch: ''
  })

  const [phone, setPhone] = useState('')
  const [documents, setDocuments] = useState<DocumentUpload[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const isVerified = kycStatus?.kycStatus === 'verified'
  const isDisabled = isVerified || submitting

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Business validation
    if (!businessData.businessName) newErrors.businessName = 'Business name is required'
    if (!validateGSTIN(businessData.gstin)) newErrors.gstin = 'Invalid GSTIN format'
    if (!validatePAN(businessData.pan)) newErrors.pan = 'Invalid PAN format'
    
    const gstinPAN = extractPANFromGSTIN(businessData.gstin)
    if (gstinPAN !== businessData.pan) newErrors.pan = 'PAN must match GSTIN'
    
    if (!businessData.businessType) newErrors.businessType = 'Business type is required'
    if (!businessData.businessAddress) newErrors.businessAddress = 'Business address is required'

    // Bank validation
    if (!bankData.accountHolderName) newErrors.accountHolderName = 'Account holder name is required'
    if (!validateBankAccount(bankData.accountNumber)) newErrors.accountNumber = 'Invalid account number (9-18 digits)'
    if (bankData.accountNumber !== bankData.confirmAccountNumber) newErrors.confirmAccountNumber = 'Account numbers do not match'
    if (!validateIFSC(bankData.ifscCode)) newErrors.ifscCode = 'Invalid IFSC code'
    if (!bankData.bankName) newErrors.bankName = 'Bank name is required'
    if (!bankData.branch) newErrors.branch = 'Branch is required'

    // Phone validation
    if (!validatePhone(phone)) newErrors.phone = 'Invalid phone number (10 digits)'

    // Document validation
    const requiredDocs = ['pan', 'gstin', 'cancelled_cheque']
    requiredDocs.forEach(type => {
      const doc = documents.find(d => d.type === type)
      if (!doc?.file) newErrors[type] = `${type.replace('_', ' ')} is required`
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    if (!canAttempt) {
      alert(`Rate limit exceeded. Please try again later. Attempts left: ${attemptsLeft}`)
      return
    }

    try {
      setSubmitting(true)

      const formData = new FormData()
      
      // Business data
      formData.append('businessName', businessData.businessName)
      formData.append('gstin', businessData.gstin)
      formData.append('pan', businessData.pan)
      formData.append('businessType', businessData.businessType)
      formData.append('businessAddress', businessData.businessAddress)

      // Bank data
      formData.append('accountNumber', bankData.accountNumber)
      formData.append('confirmAccountNumber', bankData.confirmAccountNumber)
      formData.append('ifscCode', bankData.ifscCode)
      formData.append('accountHolderName', bankData.accountHolderName)
      formData.append('bankName', bankData.bankName)
      formData.append('branch', bankData.branch)

      // Phone
      formData.append('phone', phone)

      // Documents
      documents.forEach(doc => {
        if (doc.file) {
          formData.append('documents', doc.file, `${doc.type}_${doc.file.name}`)
        }
      })

      await submitKYC(formData)
      recordAttempt()

      alert('KYC submitted successfully! We will review within 24-48 hours.')
      navigate('/settings/kyc-status')
    } catch (error: any) {
      alert(error.message || 'Failed to submit KYC')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SettingsLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rate Limit Warning */}
        {attemptsLeft < 5 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                You have <strong>{attemptsLeft}</strong> submission attempts left for today
              </p>
            </div>
          </div>
        )}

        {/* Verified Badge */}
        {isVerified && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium">
              ✅ Your KYC is verified! Details cannot be edited.
            </p>
          </div>
        )}

        {/* Phone Number */}
        <div className="bg-white rounded-lg shadow-soft p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-fiery-rose">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            disabled={isDisabled}
            maxLength={10}
            className={`w-full md:w-1/2 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all ${
              errors.phone ? 'border-fiery-rose' : 'border-gray-300'
            } ${isDisabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="10-digit mobile number"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-fiery-rose">{errors.phone}</p>
          )}
        </div>

        <BusinessDetailsForm
          data={businessData}
          onChange={(data) => setBusinessData({ ...businessData, ...data })}
          errors={errors}
          disabled={isDisabled}
        />

        <BankAccountForm
          data={bankData}
          onChange={(data) => setBankData({ ...bankData, ...data })}
          errors={errors}
          disabled={isDisabled}
        />

        <DocumentUploadSection
          documents={documents}
          onChange={setDocuments}
          errors={errors}
          disabled={isDisabled}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/settings/kyc-status')}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={isDisabled || !canAttempt}
            whileHover={{ scale: isDisabled ? 1 : 1.02 }}
            whileTap={{ scale: isDisabled ? 1 : 0.98 }}
            className={`px-6 py-3 rounded-lg font-medium text-white shadow-medium transition-all ${
              isDisabled || !canAttempt
                ? 'bg-gray-400 cursor-not-allowed'
                : 'gradient-violet hover:shadow-strong'
            }`}
          >
            {submitting ? 'Submitting...' : 'Submit for Verification'}
          </motion.button>
        </div>
      </form>
    </SettingsLayout>
  )
}
