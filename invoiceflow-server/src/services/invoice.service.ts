// src/services/invoice.service.ts (Supabase Version - Option B)
import { supabase } from '../lib/supabase'
import { Invoice, InvoiceItem, CreateInvoiceDTO, UpdateInvoiceDTO, InvoiceStats } from '../types/invoice.types'
import {
  calculateLineTax,
  isInterStateSupply,
  numberToWords,
  isEInvoiceRequired,
  isEWayBillRequired
} from '../utils/gstValidator'


const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}


/**
 * Generate invoice number using atomic database function
 * Format: INV-{year}-{6-digit-sequence}
 * Example: INV-2025-000001
 */
const generateInvoiceNumber = async (userId: string): Promise<string> => {
  const year = new Date().getFullYear()
  
  try {
    // Call database function for atomic counter increment
    const { data, error } = await supabase.rpc('get_next_invoice_number', {
      p_user_id: userId,
      p_year: year
    })
    
    if (error) {
      console.error('Error generating invoice number:', error)
      throw new Error(`Failed to generate invoice number: ${error.message}`)
    }
    
    // Format: INV-2025-000001 (6-digit sequence)
    const sequence = String(data).padStart(6, '0')
    return `INV-${year}-${sequence}`
    
  } catch (error) {
    console.error('Invoice number generation failed:', error)
    throw new Error('Failed to generate invoice number. Please try again.')
  }
}


export class InvoiceService {
  async getInvoices(userId: string, filters?: {
    status?: string
    clientId?: string
    startDate?: string
    endDate?: string
  }) {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        items:invoice_items(*)
      `)
      .eq('user_id', userId)
      .order('invoice_date', { ascending: false })
    
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.clientId) query = query.eq('client_id', filters.clientId)
    if (filters?.startDate) query = query.gte('invoice_date', filters.startDate)
    if (filters?.endDate) query = query.lte('invoice_date', filters.endDate)
    
    const { data, error } = await query
    if (error) throw new Error(error.message)
    
    return data
  }
  
  async getInvoiceById(id: string, userId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        items:invoice_items(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    
    if (error) throw new Error(error.message)
    return data
  }
  
  async createInvoice(userId: string, data: CreateInvoiceDTO) {
    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('state_code, address')
      .eq('id', userId)
      .single()
    
    if (userError || !user) throw new Error('User not found')
    
    // Get client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('state_code')
      .eq('id', data.client_id)
      .eq('user_id', userId)
      .single()
    
    if (clientError || !client) throw new Error('Client not found')
    
    // Determine inter-state supply
    const supplierStateCode = user.state_code || ''
    const [clientStateCode] = data.place_of_supply.split('-')
    const isInterState = isInterStateSupply(supplierStateCode, clientStateCode)
    
    // Calculate line items
    let subtotal = 0
    let totalCgst = 0
    let totalSgst = 0
    let totalIgst = 0
    let totalCess = 0
    
    const itemsWithTax = data.items.map((item, index) => {
      const calculated = calculateLineTax(item, isInterState)
      
      subtotal += calculated.taxable_value
      totalCgst += calculated.cgst_amount
      totalSgst += calculated.sgst_amount
      totalIgst += calculated.igst_amount
      totalCess += calculated.cess_amount
      
      return {
        line_number: index + 1,
        description: item.description,
        hsn_sac: item.hsn_sac,
        quantity: item.quantity,
        unit: item.unit || 'NOS',
        rate: item.rate,
        discount: item.discount || 0,
        taxable_value: calculated.taxable_value,
        tax_rate: item.tax_rate,
        cgst_amount: calculated.cgst_amount,
        sgst_amount: calculated.sgst_amount,
        igst_amount: calculated.igst_amount,
        cess_amount: calculated.cess_amount,
        amount: calculated.amount
      }
    })
    
    const taxAmount = totalCgst + totalSgst + totalIgst + totalCess
    const grandTotal = subtotal + taxAmount
    const roundedTotal = Math.round(grandTotal)
    const roundOff = roundedTotal - grandTotal
    
    const amountInWords = numberToWords(roundedTotal)
    
    // Generate invoice number using atomic function (prevents race conditions)
    const invoiceNumber = await generateInvoiceNumber(userId)
    
    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        supply_date: data.supply_date || data.invoice_date,
        user_id: userId,
        client_id: data.client_id,
        place_of_supply: data.place_of_supply,
        is_reverse_charge: data.is_reverse_charge || false,
        subtotal: subtotal.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total_amount: roundedTotal.toFixed(2),
        cgst_amount: totalCgst.toFixed(2),
        sgst_amount: totalSgst.toFixed(2),
        igst_amount: totalIgst.toFixed(2),
        cess_amount: totalCess.toFixed(2),
        round_off: roundOff.toFixed(2),
        amount_in_words: amountInWords,
        status: 'draft',
        notes: data.notes,
        terms_conditions: data.terms_conditions
      })
      .select()
      .single()
    
    if (invoiceError) {
      console.error('Invoice creation error:', invoiceError)
      throw new Error(invoiceError.message)
    }
    
    // Create invoice items
    const invoiceItems = itemsWithTax.map(item => ({
      invoice_id: invoice.id,
      ...item
    }))
    
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)
    
    if (itemsError) {
      // Rollback invoice creation
      await supabase.from('invoices').delete().eq('id', invoice.id)
      console.error('Invoice items creation error:', itemsError)
      throw new Error(itemsError.message)
    }
    
    // Fetch complete invoice with relations
    return this.getInvoiceById(invoice.id, userId)
  }
  
  async updateInvoice(id: string, userId: string, data: UpdateInvoiceDTO) {
    const existing = await this.getInvoiceById(id, userId)
    if (!existing) throw new Error('Invoice not found')
    
    if (data.items) {
      // Recalculate
      const { data: user } = await supabase
        .from('users')
        .select('state_code')
        .eq('id', userId)
        .single()
      
      const supplierStateCode = user?.state_code || ''
      const [clientStateCode] = (data.place_of_supply || existing.place_of_supply).split('-')
      const isInterState = isInterStateSupply(supplierStateCode, clientStateCode)
      
      let subtotal = 0
      let totalCgst = 0
      let totalSgst = 0
      let totalIgst = 0
      let totalCess = 0
      
      const itemsWithTax = data.items.map((item, index) => {
        const calculated = calculateLineTax(item, isInterState)
        
        subtotal += calculated.taxable_value
        totalCgst += calculated.cgst_amount
        totalSgst += calculated.sgst_amount
        totalIgst += calculated.igst_amount
        totalCess += calculated.cess_amount
        
        return {
          line_number: index + 1,
          description: item.description,
          hsn_sac: item.hsn_sac,
          quantity: item.quantity,
          unit: item.unit || 'NOS',
          rate: item.rate,
          discount: item.discount || 0,
          taxable_value: calculated.taxable_value,
          tax_rate: item.tax_rate,
          cgst_amount: calculated.cgst_amount,
          sgst_amount: calculated.sgst_amount,
          igst_amount: calculated.igst_amount,
          cess_amount: calculated.cess_amount,
          amount: calculated.amount
        }
      })
      
      const taxAmount = totalCgst + totalSgst + totalIgst + totalCess
      const grandTotal = subtotal + taxAmount
      const roundedTotal = Math.round(grandTotal)
      const roundOff = roundedTotal - grandTotal
      
      // Delete old items
      await supabase.from('invoice_items').delete().eq('invoice_id', id)
      
      // Update invoice
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          invoice_date: data.invoice_date,
          due_date: data.due_date,
          supply_date: data.supply_date,
          place_of_supply: data.place_of_supply,
          is_reverse_charge: data.is_reverse_charge,
          subtotal: subtotal.toFixed(2),
          tax_amount: taxAmount.toFixed(2),
          total_amount: roundedTotal.toFixed(2),
          cgst_amount: totalCgst.toFixed(2),
          sgst_amount: totalSgst.toFixed(2),
          igst_amount: totalIgst.toFixed(2),
          cess_amount: totalCess.toFixed(2),
          round_off: roundOff.toFixed(2),
          amount_in_words: numberToWords(roundedTotal),
          status: data.status,
          paid_date: data.paid_date,
          notes: data.notes,
          terms_conditions: data.terms_conditions
        })
        .eq('id', id)
      
      if (updateError) throw new Error(updateError.message)
      
      // Insert new items
      const invoiceItems = itemsWithTax.map(item => ({
        invoice_id: id,
        ...item
      }))
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems)
      
      if (itemsError) throw new Error(itemsError.message)
      
      return this.getInvoiceById(id, userId)
    }
    
    // Simple update (status/notes only)
    const { error } = await supabase
      .from('invoices')
      .update({
        status: data.status,
        paid_date: data.paid_date,
        notes: data.notes,
        terms_conditions: data.terms_conditions
      })
      .eq('id', id)
    
    if (error) throw new Error(error.message)
    
    return this.getInvoiceById(id, userId)
  }
  
  async deleteInvoice(id: string, userId: string) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw new Error(error.message)
    return true
  }
  
  async updateInvoiceStatus(id: string, userId: string, status: string, paidDate?: string) {
    const { error } = await supabase
      .from('invoices')
      .update({
        status,
        paid_date: paidDate || null
      })
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw new Error(error.message)
    
    return this.getInvoiceById(id, userId)
  }
  
  async getInvoiceStats(userId: string): Promise<InvoiceStats> {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('status, total_amount')
      .eq('user_id', userId)
    
    if (error) throw new Error(error.message)
    
    const stats = {
      total: invoices.length,
      draft: invoices.filter(inv => inv.status === 'draft').length,
      sent: invoices.filter(inv => inv.status === 'sent').length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      overdue: invoices.filter(inv => inv.status === 'overdue').length,
      
      totalRevenue: invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0),
      paidRevenue: invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0),
      unpaidRevenue: 0
    }
    
    stats.unpaidRevenue = stats.totalRevenue - stats.paidRevenue
    
    return stats
  }
}


export const invoiceService = new InvoiceService()
