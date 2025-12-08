import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowPathIcon, PencilIcon } from '@heroicons/react/24/outline'
import SettingsLayout from '../../components/settings/SettingsLayout'
import KYCStatusTracker from '../../components/kyc/KYCStatusTracker'
import { useKYC } from '../../hooks/useKYC'
import { KYC_STATUS_LABELS, KYC_STATUS_COLORS } from '../../utils/constants'

export default function KYCStatusPage() {
  const { kycStatus, loading, refreshStatus } = useKYC()

  if (loading) {
    return (
      <SettingsLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-blue"></div>
        </div>
      </SettingsLayout>
    )
  }

  const status = kycStatus?.kycStatus || 'not_started'
  const isNotStarted = status === 'not_started' || status === 'pending'
  const isRejected = status === 'rejected'
  const isVerified = status === 'verified'

  return (
    <SettingsLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-soft p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">KYC Verification Status</h2>
                <p className="text-gray-600 mt-1">Track your account verification progress</p>
              </div>
              <button
                onClick={refreshStatus}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh status"
              >
                <ArrowPathIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Current Status Badge */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-gray-700">Current Status:</span>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${KYC_STATUS_COLORS[status]}`}>
                {KYC_STATUS_LABELS[status]}
              </span>
            </div>

            {/* Not Started State */}
            {isNotStarted && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Complete Your KYC</h3>
                <p className="text-blue-800 mb-4">
                  Start accepting payments through Razorpay Route by completing your KYC verification.
                </p>
                <Link to="/settings/business-details">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="gradient-violet text-white px-6 py-3 rounded-lg font-medium shadow-medium hover:shadow-strong transition-all"
                  >
                    Start KYC Verification
                  </motion.button>
                </Link>
              </div>
            )}

            {/* Rejected State */}
            {isRejected && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-fiery-rose mb-2">KYC Rejected</h3>
                <p className="text-red-700 mb-4">
                  {kycStatus?.rejectionReason || 'Your KYC submission was rejected. Please update your details and resubmit.'}
                </p>
                <Link to="/settings/business-details">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 bg-fiery-rose text-white px-6 py-3 rounded-lg font-medium shadow-medium hover:shadow-strong transition-all"
                  >
                    <PencilIcon className="w-5 h-5" />
                    Resubmit KYC
                  </motion.button>
                </Link>
              </div>
            )}

            {/* Verified State */}
            {isVerified && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-2">✅ KYC Verified</h3>
                <p className="text-green-800">
                  Your account is verified and ready to receive payments through Razorpay Route!
                </p>
                {kycStatus?.verifiedAt && (
                  <p className="text-sm text-green-700 mt-2">
                    Verified on {new Date(kycStatus.verifiedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Progress Tracker */}
          {!isNotStarted && (
            <KYCStatusTracker
              currentStatus={status}
              submittedAt={kycStatus?.submittedAt}
              verifiedAt={kycStatus?.verifiedAt}
              rejectionReason={kycStatus?.rejectionReason}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
          {kycStatus?.linkedAccountId && (
            <div className="bg-white rounded-lg shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Linked Account ID:</span>
                  <p className="font-mono text-gray-900 mt-1 break-all">{kycStatus.linkedAccountId}</p>
                </div>
                <div>
                  <span className="text-gray-600">Account Status:</span>
                  <p className={`font-medium mt-1 ${kycStatus.accountActive ? 'text-green-600' : 'text-yellow-600'}`}>
                    {kycStatus.accountActive ? 'Active' : 'Pending Activation'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-white rounded-lg shadow-soft p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong className="text-gray-900">Verification Time:</strong><br />
                24-48 hours after submission
              </p>
              <p>
                <strong className="text-gray-900">Support:</strong><br />
                Contact us at support@invoiceflow.com
              </p>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-900 mb-2">📌 Important</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Ensure all documents are clear</li>
              <li>• Details must match PAN/GST records</li>
              <li>• Bank account must be active</li>
              <li>• Maximum 5 submissions per day</li>
            </ul>
          </div>
        </div>
      </div>
    </SettingsLayout>
  )
}
