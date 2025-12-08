import api from './api'

export const adminService = {
  // Get admin stats
  async getStats() {
    const response = await api.get('/admin/stats')
    return response.data.data
  },

  // Get pending KYC submissions
  async getPendingKYC() {
    const response = await api.get('/admin/pending-kyc')
    return response.data.data
  },

  // Approve KYC
  async approveKYC(userId: string) {
    const response = await api.patch(`/admin/kyc/${userId}/approve`)
    return response.data
  },

  // Reject KYC
  async rejectKYC(userId: string, reason: string) {
    const response = await api.patch(`/admin/kyc/${userId}/reject`, { reason })
    return response.data
  },

  // Get audit logs
  async getAuditLogs(filters: any) {
    const response = await api.get('/admin/audit-logs', { params: filters })
    return response.data.data
  },

  // Get all users
  async getAllUsers() {
    const response = await api.get('/admin/users')
    return response.data.data
  },

  // Toggle user status
  async toggleUserStatus(userId: string, isActive: boolean) {
    const response = await api.patch(`/admin/users/${userId}/status`, { isActive })
    return response.data
  },

  // Verify document
  async verifyDocument(documentId: string, status: string, notes: string) {
    const response = await api.patch(`/admin/verify-document/${documentId}`, {
      verificationStatus: status,
      notes
    })
    return response.data
  }
}

export default adminService
