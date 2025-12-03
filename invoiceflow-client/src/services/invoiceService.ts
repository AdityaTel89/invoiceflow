// src/services/invoiceService.ts
import axios from 'axios'
import type { InvoiceFormData, Invoice, InvoiceStats } from '../types/invoice.types'

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'
const INVOICE_API = `${API_URL}/invoices`

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
})

/**
 * Convert Cloudinary raw URL to viewable URL using PDF.js or Google Docs Viewer
 */
const getViewablePDFUrl = (cloudinaryUrl: string): string => {
  if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
    return cloudinaryUrl
  }
  
  // Option 1: Use Google Docs Viewer (most reliable)
  return `https://docs.google.com/viewer?url=${encodeURIComponent(cloudinaryUrl)}&embedded=true`
  
  // Option 2: Use Mozilla PDF.js viewer (alternative)
  // return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(cloudinaryUrl)}`
}

export const invoiceService = {
  /**
   * Get all invoices with optional filters
   */
  async getAll(filters?: {
    status?: string
    clientId?: string
    startDate?: string
    endDate?: string
  }): Promise<Invoice[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.status && filters.status !== 'all') {
        params.append('status', filters.status)
      }
      if (filters?.clientId) params.append('clientId', filters.clientId)
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)
      
      const response = await axios.get(
        `${INVOICE_API}?${params}`,
        getAuthHeaders()
      )
      return response.data.invoices || []
    } catch (error: any) {
      console.error('Error fetching invoices:', error)
      throw new Error(error.response?.data?.error || 'Failed to fetch invoices')
    }
  },

  /**
   * Get single invoice by ID
   */
  async getById(id: string): Promise<Invoice> {
    try {
      const response = await axios.get(
        `${INVOICE_API}/${id}`,
        getAuthHeaders()
      )
      return response.data.invoice
    } catch (error: any) {
      console.error('Error fetching invoice:', error)
      throw new Error(error.response?.data?.error || 'Failed to fetch invoice')
    }
  },

  /**
   * Create new invoice
   */
  async create(data: InvoiceFormData): Promise<{ invoice: Invoice; success: boolean }> {
    try {
      const response = await axios.post(INVOICE_API, data, getAuthHeaders())
      return response.data
    } catch (error: any) {
      console.error('Error creating invoice:', error)
      throw new Error(error.response?.data?.error || 'Failed to create invoice')
    }
  },

  /**
   * Update existing invoice
   */
  async update(
    id: string,
    data: Partial<InvoiceFormData>
  ): Promise<{ invoice: Invoice; success: boolean }> {
    try {
      const response = await axios.put(
        `${INVOICE_API}/${id}`,
        data,
        getAuthHeaders()
      )
      return response.data
    } catch (error: any) {
      console.error('Error updating invoice:', error)
      throw new Error(error.response?.data?.error || 'Failed to update invoice')
    }
  },

  /**
   * Update invoice status
   */
  async updateStatus(
    id: string,
    status: string,
    paidDate?: string
  ): Promise<{ invoice: Invoice; success: boolean }> {
    try {
      const response = await axios.patch(
        `${INVOICE_API}/${id}/status`,
        { status, paid_date: paidDate },
        getAuthHeaders()
      )
      return response.data
    } catch (error: any) {
      console.error('Error updating status:', error)
      throw new Error(error.response?.data?.error || 'Failed to update status')
    }
  },

  /**
   * Delete invoice
   */
  async delete(id: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(
        `${INVOICE_API}/${id}`,
        getAuthHeaders()
      )
      return response.data
    } catch (error: any) {
      console.error('Error deleting invoice:', error)
      throw new Error(error.response?.data?.error || 'Failed to delete invoice')
    }
  },

  /**
   * Generate PDF and return as Blob (for download)
   */
  async generatePDF(id: string): Promise<Blob> {
    try {
      const response = await axios.get(`${INVOICE_API}/${id}/pdf`, {
        ...getAuthHeaders(),
        responseType: 'blob'
      })
      return response.data
    } catch (error: any) {
      console.error('Error generating PDF:', error)
      throw new Error(error.response?.data?.error || 'Failed to generate PDF')
    }
  },

  /**
   * Get PDF URL from Cloudinary
   */
  async getPDFUrl(id: string): Promise<{ 
    pdf_url: string
    invoice_number: string
    public_id: string
  }> {
    try {
      const response = await axios.get(
        `${INVOICE_API}/${id}/pdf-url`,
        getAuthHeaders()
      )
      
      const data = response.data
      console.log('✅ PDF URL retrieved:', data.pdf_url)
      
      return data
    } catch (error: any) {
      console.error('❌ Error getting PDF URL:', error)
      throw new Error(error.response?.data?.error || 'PDF not generated yet')
    }
  },

  /**
   * Download PDF file directly
   */
  async downloadPDF(id: string, invoiceNumber: string): Promise<void> {
    try {
      const blob = await this.generatePDF(id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error downloading PDF:', error)
      throw error
    }
  },

  /**
   * View PDF in new browser tab using Google Docs Viewer
   * Works with Cloudinary raw URLs
   */
  async viewPDF(id: string): Promise<void> {
  try {
    const { pdf_url } = await this.getPDFUrl(id)
    
    // After enabling Cloudinary PDF delivery, just open directly
    window.open(pdf_url, '_blank', 'noopener,noreferrer')
    
  } catch (error: any) {
    console.error('❌ Error viewing PDF:', error)
    throw error
  }
},

  /**
   * Share PDF URL (copy direct Cloudinary URL to clipboard)
   */
  async sharePDF(id: string): Promise<string> {
    try {
      const { pdf_url } = await this.getPDFUrl(id)
      
      if (!pdf_url) {
        throw new Error('PDF URL not available. Please generate the PDF first.')
      }
      
      // Copy direct Cloudinary URL (for downloading)
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(pdf_url)
        console.log('✅ PDF URL copied to clipboard')
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = pdf_url
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      
      return pdf_url
    } catch (error: any) {
      console.error('❌ Error sharing PDF:', error)
      
      if (error.response?.status === 404 || error.message?.includes('not generated')) {
        throw new Error('PDF not generated yet. Please download the invoice first.')
      }
      
      throw new Error(error.response?.data?.error || 'Failed to get shareable link')
    }
  },

  /**
   * Get invoice statistics
   */
  async getStats(): Promise<InvoiceStats> {
    try {
      const response = await axios.get(`${INVOICE_API}/stats`, getAuthHeaders())
      return response.data.stats
    } catch (error: any) {
      console.error('Error fetching stats:', error)
      throw new Error(error.response?.data?.error || 'Failed to fetch statistics')
    }
  },

  /**
   * Bulk update invoice statuses
   */
  async bulkUpdateStatus(
    ids: string[],
    status: string
  ): Promise<{ success: boolean; updated: number }> {
    try {
      const promises = ids.map(id => this.updateStatus(id, status))
      await Promise.all(promises)
      return { success: true, updated: ids.length }
    } catch (error: any) {
      console.error('Error in bulk update:', error)
      throw new Error('Failed to update multiple invoices')
    }
  },

  /**
   * Bulk delete invoices
   */
  async bulkDelete(ids: string[]): Promise<{ success: boolean; deleted: number }> {
    try {
      const promises = ids.map(id => this.delete(id))
      await Promise.all(promises)
      return { success: true, deleted: ids.length }
    } catch (error: any) {
      console.error('Error in bulk delete:', error)
      throw new Error('Failed to delete multiple invoices')
    }
  },

  /**
   * Send invoice via email (future feature)
   */
  async sendEmail(id: string, email: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.post(
        `${INVOICE_API}/${id}/send`,
        { email },
        getAuthHeaders()
      )
      return response.data
    } catch (error: any) {
      console.error('Error sending invoice:', error)
      throw new Error(error.response?.data?.error || 'Failed to send invoice')
    }
  },

  /**
   * Duplicate invoice
   */
  async duplicate(id: string): Promise<Invoice> {
    try {
      const invoice = await this.getById(id)
      
      const duplicateData: any = {
        client_id: invoice.client_id,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        place_of_supply: invoice.place_of_supply,
        items: invoice.items?.map((item: any) => ({
          description: item.description,
          hsn_sac: item.hsn_sac,
          quantity: Number(item.quantity),
          unit: item.unit || 'NOS',
          rate: Number(item.rate),
          discount: Number(item.discount || 0),
          tax_rate: Number(item.tax_rate),
          amount: Number(item.amount)
        })) || [],
        notes: invoice.notes || '',
        terms_conditions: invoice.terms_conditions || '',
        is_reverse_charge: invoice.is_reverse_charge || false
      }

      const response = await this.create(duplicateData)
      return response.invoice
    } catch (error: any) {
      console.error('Error duplicating invoice:', error)
      throw new Error('Failed to duplicate invoice')
    }
  }
}

export default invoiceService
