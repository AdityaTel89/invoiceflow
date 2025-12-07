// src/services/dashboardService.ts
import axios from 'axios'

// 🔧 Fix: Properly handle import.meta.env with type assertion
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
})

export const dashboardService = {
  async getStats() {
    const response = await axios.get(`${API_URL}/dashboard/stats`, getAuthHeaders())
    return response.data
  },

  async getRecentInvoices(limit = 5) {
    const response = await axios.get(
      `${API_URL}/dashboard/recent-invoices?limit=${limit}`,
      getAuthHeaders()
    )
    return response.data
  },

  async getChartsData() {
    const response = await axios.get(`${API_URL}/dashboard/charts-data`, getAuthHeaders())
    return response.data
  }
}
