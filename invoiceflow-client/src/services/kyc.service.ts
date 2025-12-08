import api from './api'
import type { KYCStatusResponse } from '../types/kyc.types'

export const kycService = {
  // Create linked account with KYC submission
  async submitKYC(formData: FormData) {
    const response = await api.post('/linked-account/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Get KYC status
  async getKYCStatus(): Promise<KYCStatusResponse> {
    const response = await api.get('/linked-account/status')
    return response.data.data
  },

  // Get user documents
  async getDocuments() {
    const response = await api.get('/linked-account/documents')
    return response.data.data
  }
}

export default kycService
