import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useToast } from '../../hooks/useToast'
import adminService from '../../services/admin.service'

interface PendingKYC {
  id: string
  userId: string
  businessName: string
  email: string
  gstin: string
  pan: string
  phone: string
  submittedAt: string
  documents: {
    id: string
    documentType: string
    fileUrl: string
    originalFilename: string
  }[]
}

export default function KYCReview() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [pendingKYC, setPendingKYC] = useState<PendingKYC[]>([])
  const [selectedKYC, setSelectedKYC] = useState<PendingKYC | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    fetchPendingKYC()
  }, [])

  const fetchPendingKYC = async () => {
    try {
      setLoading(true)
      const data = await adminService.getPendingKYC()
      setPendingKYC(data)
    } catch (error) {
      toast.error('Failed to load pending KYC submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (kycId: string) => {
    try {
      setVerifying(true)
      await adminService.approveKYC(kycId)
      toast.success('KYC approved successfully! ✅')
      fetchPendingKYC()
      setSelectedKYC(null)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve KYC')
    } finally {
      setVerifying(false)
    }
  }

  const handleReject = async (kycId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      setVerifying(true)
      await adminService.rejectKYC(kycId, rejectionReason)
      toast.success('KYC rejected successfully')
      fetchPendingKYC()
      setSelectedKYC(null)
      setRejectionReason('')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject KYC')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">KYC Review</h1>
        <p className="text-gray-600 mt-2">Review and verify user KYC submissions</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending KYC submissions...</p>
        </div>
      ) : pendingKYC.length === 0 ? (
        <div className="bg-white rounded-lg shadow-soft p-12 text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No pending KYC submissions to review</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* KYC List */}
          <div className="space-y-4">
            {pendingKYC.map((kyc) => (
              <motion.div
                key={kyc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-lg shadow-soft p-6 cursor-pointer transition-all ${
                  selectedKYC?.id === kyc.id ? 'ring-2 ring-violet-blue' : 'hover:shadow-medium'
                }`}
                onClick={() => setSelectedKYC(kyc)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{kyc.businessName}</h3>
                    <p className="text-sm text-gray-600">{kyc.email}</p>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    Pending
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">GSTIN:</span>
                    <span className="font-medium text-gray-900">{kyc.gstin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">PAN:</span>
                    <span className="font-medium text-gray-900">{kyc.pan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900">{kyc.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Documents:</span>
                    <span className="font-medium text-gray-900">{kyc.documents.length} files</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Submitted:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(kyc.submittedAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedKYC(kyc)
                  }}
                  className="mt-4 w-full px-4 py-2 bg-violet-blue text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
                >
                  <EyeIcon className="w-5 h-5" />
                  Review Details
                </button>
              </motion.div>
            ))}
          </div>

          {/* KYC Details */}
          <div className="lg:sticky lg:top-6 h-fit">
            {selectedKYC ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow-soft p-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Review KYC Details</h3>

                <div className="space-y-6">
                  {/* Business Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Business Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Business Name:</span>
                        <span className="font-medium text-gray-900">{selectedKYC.businessName}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900">{selectedKYC.email}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium text-gray-900">{selectedKYC.phone}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">GSTIN:</span>
                        <span className="font-medium text-gray-900">{selectedKYC.gstin}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">PAN:</span>
                        <span className="font-medium text-gray-900">{selectedKYC.pan}</span>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Uploaded Documents</h4>
                    <div className="space-y-2">
                      {selectedKYC.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{doc.documentType}</p>
                              <p className="text-xs text-gray-600">{doc.originalFilename}</p>
                            </div>
                          </div>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-sm text-violet-blue hover:bg-violet-blue hover:text-white rounded-lg transition-colors"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rejection Reason (if rejecting) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason (if applicable)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue"
                      placeholder="Provide a clear reason for rejection..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedKYC.userId)}
                      disabled={verifying}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      {verifying ? 'Approving...' : 'Approve KYC'}
                    </button>
                    <button
                      onClick={() => handleReject(selectedKYC.userId)}
                      disabled={verifying}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <XCircleIcon className="w-5 h-5" />
                      {verifying ? 'Rejecting...' : 'Reject KYC'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-lg shadow-soft p-12 text-center">
                <EyeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Select a KYC submission to review</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
