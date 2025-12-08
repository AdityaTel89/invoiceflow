import { motion } from 'framer-motion'
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/solid'
import type { KYCStatus } from '../../types/kyc.types'

interface Props {
  currentStatus: KYCStatus
  submittedAt?: string
  verifiedAt?: string
  rejectionReason?: string
}

const steps = [
  { id: 'submitted', label: 'Details Submitted' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'verified', label: 'Documents Verified' },
  { id: 'active', label: 'Account Active' }
]

const statusOrder: Record<KYCStatus, number> = {
  not_started: 0,
  pending: 0,
  submitted: 1,
  under_review: 2,
  verified: 3,
  rejected: -1
}

export default function KYCStatusTracker({ currentStatus, submittedAt, verifiedAt, rejectionReason }: Props) {
  const currentStep = statusOrder[currentStatus] || 0
  const isRejected = currentStatus === 'rejected'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-soft p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Verification Progress</h3>

      {isRejected ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex gap-3">
            <XCircleIcon className="w-6 h-6 text-fiery-rose flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-fiery-rose mb-1">KYC Rejected</h4>
              <p className="text-sm text-red-700">{rejectionReason || 'Please resubmit with correct documents'}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {steps.map((step, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber <= currentStep
            const isCurrent = stepNumber === currentStep
            const isLast = index === steps.length - 1

            return (
              <div key={step.id} className="relative">
                <div className="flex items-center gap-4">
                  {/* Step Indicator */}
                  <div className="relative">
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center"
                      >
                        <CheckCircleIcon className="w-6 h-6 text-white" />
                      </motion.div>
                    ) : isCurrent ? (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-10 h-10 rounded-full bg-violet-blue flex items-center justify-center"
                      >
                        <ClockIcon className="w-6 h-6 text-white" />
                      </motion.div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 font-medium">{stepNumber}</span>
                      </div>
                    )}

                    {/* Connector Line */}
                    {!isLast && (
                      <div className={`absolute left-5 top-10 w-0.5 h-12 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      isCompleted ? 'text-green-600' : isCurrent ? 'text-violet-blue' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </h4>
                    {step.id === 'submitted' && submittedAt && (
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(submittedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    )}
                    {step.id === 'active' && verifiedAt && (
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(verifiedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Estimated Time */}
      {!isRejected && currentStep < 3 && (
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-600">
            ⏱️ Estimated verification time: <span className="font-medium text-gray-900">24-48 hours</span>
          </p>
        </div>
      )}
    </motion.div>
  )
}
