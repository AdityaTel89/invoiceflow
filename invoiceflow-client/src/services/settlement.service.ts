import api from './api'
import type { Settlement, SettlementCalculation } from '../types/settlement.types'

export const settlementService = {
  // Calculate settlement breakdown
  async calculateSettlement(invoiceAmount: number, commissionRate: number = 0): Promise<SettlementCalculation> {
    const response = await api.post('/settlements/calculate', {
      invoiceAmount,
      commissionRate
    })
    return response.data.data
  },

  // Get user settlements
  async getUserSettlements(limit: number = 50): Promise<Settlement[]> {
    const response = await api.get(`/settlements?limit=${limit}`)
    return response.data.data
  },

  // Get settlement by invoice ID
  async getSettlementByInvoice(invoiceId: string): Promise<Settlement> {
    const response = await api.get(`/settlements/invoice/${invoiceId}`)
    return response.data.data
  }
}

export default settlementService
