import { useState, useEffect } from 'react'
import kycService from '../services/kyc.service'
import type { KYCStatusResponse } from '../types/kyc.types'

export const useKYC = () => {
  const [kycStatus, setKYCStatus] = useState<KYCStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKYCStatus = async () => {
    try {
      setLoading(true)
      const status = await kycService.getKYCStatus()
      setKYCStatus(status)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch KYC status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKYCStatus()
  }, [])

  const submitKYC = async (formData: FormData) => {
    try {
      setLoading(true)
      const response = await kycService.submitKYC(formData)
      await fetchKYCStatus() // Refresh status
      return response
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to submit KYC')
    } finally {
      setLoading(false)
    }
  }

  return {
    kycStatus,
    loading,
    error,
    submitKYC,
    refreshStatus: fetchKYCStatus
  }
}
