// src/controllers/invoice.controller.ts
import type { Response } from 'express'
import { supabase } from '../lib/supabase.js'
import type { AuthRequest } from '../middleware/authMiddleware.js'
import { generateInvoicePDF } from '../services/pdf.service.js'
import { uploadInvoicePDF, deleteInvoicePDF } from '../services/cloudinary.service.js'
import razorpayService from '../services/razorpay.service.js'
import emailService from '../services/email.service.js'

// ==================== UTILITY FUNCTIONS ====================

// Generate invoice number: INV-2025-12-001
const generateInvoiceNumber = async (userId: string): Promise<string> => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `INV-${year}-${month}`

  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('user_id', userId)
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting last invoice:', error)
  }

  let sequence = 1
  if (data?.invoice_number) {
    const lastNumber = parseInt(data.invoice_number.split('-')[3])
    sequence = lastNumber + 1
  }

  return `${prefix}-${String(sequence).padStart(3, '0')}`
}

// Validate GSTIN format (15 chars: State Code + PAN + Entity + Z + Checksum)
const validateGSTIN = (gstin: string): boolean => {
  if (!gstin || gstin.length !== 15) return false
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return gstinRegex.test(gstin.toUpperCase())
}

// Extract state code from GSTIN or place of supply
const getStateCode = (input: string): string => {
  if (!input) return ''
  // If it's a GSTIN (15 chars), extract first 2 digits
  if (input.length === 15 && validateGSTIN(input)) {
    return input.substring(0, 2)
  }
  // If it's place of supply format "29-Karnataka"
  if (input.includes('-')) {
    return input.split('-')[0].trim()
  }
  return ''
}

// Check if supply is inter-state (CGST+SGST vs IGST)
const isInterStateSupply = (supplierState: string, recipientState: string): boolean => {
  const supplierCode = getStateCode(supplierState)
  const recipientCode = getStateCode(recipientState)
  return supplierCode !== recipientCode && supplierCode !== '' && recipientCode !== ''
}

// Calculate line item taxes
const calculateLineItemTax = (
  quantity: number,
  rate: number,
  taxRate: number,
  discount: number = 0,
  isInterState: boolean
) => {
  const gross = quantity * rate
  const taxableValue = gross - discount
  const totalTax = (taxableValue * taxRate) / 100

  let cgst = 0
  let sgst = 0
  let igst = 0

  if (isInterState) {
    igst = totalTax
  } else {
    cgst = totalTax / 2
    sgst = totalTax / 2
  }

  return {
    taxableValue: Number(taxableValue.toFixed(2)),
    cgst: Number(cgst.toFixed(2)),
    sgst: Number(sgst.toFixed(2)),
    igst: Number(igst.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    amount: Number((taxableValue + totalTax).toFixed(2))
  }
}

// Convert number to words (Indian system)
const numberToWords = (amount: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  if (amount === 0) return 'Zero Rupees Only'

  const crore = Math.floor(amount / 10000000)
  const lakh = Math.floor((amount % 10000000) / 100000)
  const thousand = Math.floor((amount % 100000) / 1000)
  const hundred = Math.floor((amount % 1000) / 100)
  const remainder = Math.floor(amount % 100)

  let words = ''

  const convertTwoDigit = (num: number): string => {
    if (num < 10) return ones[num]
    if (num >= 10 && num < 20) return teens[num - 10]
    return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '')
  }

  if (crore > 0) words += convertTwoDigit(crore) + ' Crore '
  if (lakh > 0) words += convertTwoDigit(lakh) + ' Lakh '
  if (thousand > 0) words += convertTwoDigit(thousand) + ' Thousand '
  if (hundred > 0) words += ones[hundred] + ' Hundred '
  if (remainder > 0) words += convertTwoDigit(remainder)

  return words.trim() + ' Rupees Only'
}

// Generate IRN (placeholder - integrate with IRP in production)
const generateIRN = async (invoiceData: any): Promise<string> => {
  const dataString = JSON.stringify({
    invoice_number: invoiceData.invoice_number,
    invoice_date: invoiceData.invoice_date,
    gstin: invoiceData.supplier_gstin,
    total: invoiceData.total_amount,
    timestamp: Date.now()
  })
  
  const hash = Buffer.from(dataString).toString('base64')
  return hash.substring(0, 64).replace(/[^a-zA-Z0-9]/g, '0')
}

// Generate QR Code data for e-invoice (GST compliant format)
const generateQRCode = async (invoiceData: any): Promise<string> => {
  const qrData = {
    SupplierGSTIN: invoiceData.supplier_gstin || 'UNREGISTERED',
    SupplierName: invoiceData.supplier_name,
    InvoiceNumber: invoiceData.invoice_number,
    InvoiceDate: invoiceData.invoice_date,
    InvoiceType: invoiceData.is_reverse_charge ? 'RCM' : 'REGULAR',
    IRN: invoiceData.irn || '',
    AckNo: invoiceData.irn_ack_no || '',
    AckDate: invoiceData.irn_ack_date || '',
    TotalAmount: parseFloat(invoiceData.total_amount).toFixed(2),
    TaxableAmount: parseFloat(invoiceData.subtotal || 0).toFixed(2),
    CGST: parseFloat(invoiceData.cgst_amount || 0).toFixed(2),
    SGST: parseFloat(invoiceData.sgst_amount || 0).toFixed(2),
    IGST: parseFloat(invoiceData.igst_amount || 0).toFixed(2),
    RecipientGSTIN: invoiceData.recipient_gstin || 'UNREGISTERED',
    RecipientName: invoiceData.recipient_name,
    PlaceOfSupply: invoiceData.place_of_supply,
    Timestamp: new Date().toISOString(),
    Version: 'GST2.0'
  }
  
  return JSON.stringify(qrData)
}

// Check if E-invoice is required (turnover threshold)
const isEInvoiceRequired = (annualTurnover: number): boolean => {
  return annualTurnover > 10000000 // ₹1 Crore
}

// Check if E-way bill is required
const isEWayBillRequired = (totalAmount: number, supplyType: string = 'GOODS'): boolean => {
  return supplyType === 'GOODS' && totalAmount > 50000
}

// Generate E-way bill number (placeholder)
const generateEWayBillNumber = async (): Promise<string> => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 100000)
  return `EWB${timestamp}${random}`.substring(0, 12)
}

// Calculate E-way bill validity (100km per day rule)
const calculateEWayValidity = (distance: number = 100): { validFrom: string; validTo: string } => {
  const now = new Date()
  const daysValid = Math.ceil(distance / 100)
  const validTo = new Date(now)
  validTo.setDate(validTo.getDate() + daysValid)
  
  return {
    validFrom: now.toISOString(),
    validTo: validTo.toISOString()
  }
}

// ==================== CONTROLLER FUNCTIONS ====================

export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, startDate, endDate, clientId } = req.query

    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, gstin, billing_address, state_code)
      `)
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (startDate) {
      query = query.gte('invoice_date', startDate)
    }
    if (endDate) {
      query = query.lte('invoice_date', endDate)
    }
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data: invoices, error } = await query

    if (error) {
      console.error('Get invoices error:', error)
      res.status(500).json({ error: 'Failed to fetch invoices' })
      return
    }

    res.json({ invoices })
  } catch (error) {
    console.error('Get invoices error:', error)
    res.status(500).json({ error: 'Failed to fetch invoices' })
  }
}

export const getInvoiceById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, phone, gstin, pan, billing_address, shipping_address, state_code, state_name),
        items:invoice_items(*)
      `)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single()

    if (error || !invoice) {
      res.status(404).json({ error: 'Invoice not found' })
      return
    }

    res.json({ invoice })
  } catch (error) {
    console.error('Get invoice error:', error)
    res.status(500).json({ error: 'Failed to fetch invoice' })
  }
}

export const createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('=== BACKEND: CREATE INVOICE ===')
    console.log('Received body:', JSON.stringify(req.body, null, 2))

    const { 
      client_id,
      invoice_date,
      due_date,
      supply_date,
      place_of_supply,
      items,
      notes,
      terms_conditions,
      is_reverse_charge = false,
      vehicle_no,
      transporter_id,
      distance = 100
    } = req.body

    // Validate required fields
    if (!client_id) {
      console.error('Validation failed: client_id is missing')
      res.status(400).json({ error: 'Client ID is required' })
      return
    }

    if (!invoice_date) {
      console.error('Validation failed: invoice_date is missing')
      res.status(400).json({ error: 'Invoice date is required' })
      return
    }

    if (!due_date) {
      console.error('Validation failed: due_date is missing')
      res.status(400).json({ error: 'Due date is required' })
      return
    }

    if (!place_of_supply) {
      console.error('Validation failed: place_of_supply is missing')
      res.status(400).json({ error: 'Place of supply is required' })
      return
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Validation failed: items missing or empty')
      res.status(400).json({ error: 'At least one item is required' })
      return
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.description) {
        res.status(400).json({ error: `Item ${i + 1}: Description is required` })
        return
      }
      if (!item.hsn_sac) {
        res.status(400).json({ error: `Item ${i + 1}: HSN/SAC code is required` })
        return
      }
      if (!item.quantity || item.quantity <= 0) {
        res.status(400).json({ error: `Item ${i + 1}: Valid quantity is required` })
        return
      }
      if (item.rate === undefined || item.rate < 0) {
        res.status(400).json({ error: `Item ${i + 1}: Valid rate is required` })
        return
      }
      if (item.tax_rate === undefined || item.tax_rate < 0) {
        res.status(400).json({ error: `Item ${i + 1}: Valid tax rate is required` })
        return
      }
    }

    // Get user (supplier) details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('business_name, email, phone, gstin, pan, address, state_code, state_name')
      .eq('id', req.user!.id)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Get client (recipient) details
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, name, email, phone, gstin, pan, billing_address, shipping_address, state_code, state_name')
      .eq('id', client_id)
      .eq('user_id', req.user!.id)
      .single()

    if (clientError || !clientData) {
      console.error('Client not found:', clientError)
      res.status(404).json({ error: 'Client not found' })
      return
    }

    // Validate GSTIN formats
    if (userData.gstin && !validateGSTIN(userData.gstin)) {
      res.status(400).json({ error: 'Invalid supplier GSTIN format' })
      return
    }

    if (clientData.gstin && !validateGSTIN(clientData.gstin)) {
      res.status(400).json({ error: 'Invalid client GSTIN format' })
      return
    }

    // Determine if inter-state supply
    const supplierStateCode = userData.state_code || getStateCode(userData.address || '')
    const clientStateCode = clientData.state_code || getStateCode(place_of_supply)
    const isInterState = isInterStateSupply(supplierStateCode, clientStateCode)

    console.log('GST Calculation:', {
      supplierStateCode,
      clientStateCode,
      isInterState
    })

    // Calculate totals with GST breakdown
    let subtotal = 0
    let totalCgst = 0
    let totalSgst = 0
    let totalIgst = 0
    let totalCess = 0

    const processedItems = items.map((item: any, index: number) => {
      const calculated = calculateLineItemTax(
        Number(item.quantity),
        Number(item.rate),
        Number(item.tax_rate),
        Number(item.discount || 0),
        isInterState
      )

      subtotal += calculated.taxableValue
      totalCgst += calculated.cgst
      totalSgst += calculated.sgst
      totalIgst += calculated.igst

      return {
        line_number: index + 1,
        description: item.description,
        hsn_sac: item.hsn_sac,
        quantity: Number(item.quantity),
        unit: item.unit || 'NOS',
        rate: Number(item.rate),
        discount: Number(item.discount || 0),
        taxable_value: calculated.taxableValue,
        tax_rate: Number(item.tax_rate),
        cgst_amount: calculated.cgst,
        sgst_amount: calculated.sgst,
        igst_amount: calculated.igst,
        cess_amount: 0,
        amount: calculated.amount
      }
    })

    const taxAmount = totalCgst + totalSgst + totalIgst + totalCess
    const grandTotal = subtotal + taxAmount
    const roundedTotal = Math.round(grandTotal)
    const roundOff = Number((roundedTotal - grandTotal).toFixed(2))
    const amountInWords = numberToWords(roundedTotal)

    console.log('Calculated totals:', {
      subtotal,
      totalCgst,
      totalSgst,
      totalIgst,
      taxAmount,
      grandTotal,
      roundedTotal,
      roundOff
    })

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(req.user!.id)

    // Prepare invoice data
    const invoiceData: any = {
      invoice_number: invoiceNumber,
      invoice_date: invoice_date,
      due_date: due_date,
      supply_date: supply_date || invoice_date,
      client_id: client_id,
      user_id: req.user!.id,
      place_of_supply: place_of_supply,
      is_reverse_charge: is_reverse_charge,
      subtotal: subtotal.toFixed(2),
      tax_amount: taxAmount.toFixed(2),
      cgst_amount: totalCgst.toFixed(2),
      sgst_amount: totalSgst.toFixed(2),
      igst_amount: totalIgst.toFixed(2),
      cess_amount: totalCess.toFixed(2),
      round_off: roundOff.toFixed(2),
      total_amount: roundedTotal.toFixed(2),
      amount_in_words: amountInWords,
      status: 'draft',
      notes: notes || null,
      terms_conditions: terms_conditions || null
    }

    // Check if E-invoice is required (mock - use actual turnover from DB)
    const mockAnnualTurnover = 15000000 // ₹1.5 Cr (get from user profile in production)
    if (isEInvoiceRequired(mockAnnualTurnover)) {
      const irn = await generateIRN({
        ...invoiceData,
        supplier_gstin: userData.gstin
      })
      
      const qrCode = await generateQRCode({
        ...invoiceData,
        supplier_gstin: userData.gstin,
        supplier_name: userData.business_name,
        recipient_gstin: clientData.gstin,
        recipient_name: clientData.name,
        irn,
        irn_ack_no: `ACK${Date.now()}`,
        irn_ack_date: new Date().toISOString()
      })
      
      invoiceData.irn = irn
      invoiceData.irn_ack_no = `ACK${Date.now()}`
      invoiceData.irn_ack_date = new Date().toISOString()
      invoiceData.irn_qr_code = qrCode
      
      console.log('E-invoice generated:', {
        irn: irn.substring(0, 20) + '...',
        ackNo: invoiceData.irn_ack_no
      })
    }

    // Check if E-way bill is required
    if (isEWayBillRequired(roundedTotal)) {
      const eWayBillNo = await generateEWayBillNumber()
      const validity = calculateEWayValidity(distance)
      
      invoiceData.eway_bill_no = eWayBillNo
      invoiceData.eway_valid_from = validity.validFrom
      invoiceData.eway_valid_to = validity.validTo
      invoiceData.vehicle_no = vehicle_no || null
      invoiceData.transporter_id = transporter_id || null
      
      console.log('E-way bill generated:', eWayBillNo)
    }

    console.log('Creating invoice with data:', {
      ...invoiceData,
      irn_qr_code: invoiceData.irn_qr_code ? 'QR_CODE_DATA_PRESENT' : undefined
    })

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single()

    if (invoiceError) {
      console.error('Create invoice error:', invoiceError)
      res.status(500).json({ 
        error: 'Failed to create invoice', 
        details: invoiceError.message 
      })
      return
    }

    console.log('Invoice created:', invoice.id)

    // Create invoice items
    const invoiceItems = processedItems.map((item: any) => ({
      invoice_id: invoice.id,
      ...item
    }))

    console.log('Creating invoice items:', invoiceItems.length, 'items')

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)

    if (itemsError) {
      console.error('Create invoice items error:', itemsError)
      // Rollback invoice creation
      await supabase.from('invoices').delete().eq('id', invoice.id)
      res.status(500).json({ 
        error: 'Failed to create invoice items', 
        details: itemsError.message 
      })
      return
    }

    console.log('Invoice items created successfully')

    // Fetch complete invoice with items and client
    const { data: completeInvoice } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, phone, gstin, pan, billing_address, shipping_address, state_code, state_name),
        items:invoice_items(*)
      `)
      .eq('id', invoice.id)
      .single()

    console.log('=== INVOICE CREATED SUCCESSFULLY ===')

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice: completeInvoice,
      metadata: {
        is_inter_state: isInterState,
        e_invoice_generated: !!invoiceData.irn,
        e_way_bill_generated: !!invoiceData.eway_bill_no
      }
    })
  } catch (error: any) {
    console.error('=== CREATE INVOICE ERROR ===')
    console.error('Error:', error)
    res.status(500).json({ 
      error: 'Failed to create invoice', 
      details: error.message 
    })
  }
}

export const updateInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { 
      invoice_date,
      due_date,
      supply_date,
      place_of_supply,
      items,
      notes,
      terms_conditions,
      status,
      is_reverse_charge
    } = req.body

    // Check if invoice exists and belongs to user
    const { data: existingInvoice, error: checkError } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single()

    if (checkError || !existingInvoice) {
      res.status(404).json({ error: 'Invoice not found' })
      return
    }

    // Don't allow editing paid invoices
    if (existingInvoice.status === 'paid') {
      res.status(400).json({ error: 'Cannot edit paid invoices' })
      return
    }

    let updateData: any = {
      invoice_date,
      due_date,
      supply_date,
      place_of_supply,
      is_reverse_charge,
      notes,
      terms_conditions,
      status
    }

    // Recalculate if items provided
    if (items && items.length > 0) {
      // Get user and client for state codes
      const { data: userData } = await supabase
        .from('users')
        .select('state_code, address')
        .eq('id', req.user!.id)
        .single()

      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('client_id')
        .eq('id', id)
        .single()

      const { data: clientData } = await supabase
        .from('clients')
        .select('state_code')
        .eq('id', invoiceData?.client_id)
        .single()

      const supplierStateCode = userData?.state_code || ''
      const clientStateCode = clientData?.state_code || getStateCode(place_of_supply || '')
      const isInterState = isInterStateSupply(supplierStateCode, clientStateCode)

      let subtotal = 0
      let totalCgst = 0
      let totalSgst = 0
      let totalIgst = 0

      const processedItems = items.map((item: any, index: number) => {
        const calculated = calculateLineItemTax(
          Number(item.quantity),
          Number(item.rate),
          Number(item.tax_rate),
          Number(item.discount || 0),
          isInterState
        )

        subtotal += calculated.taxableValue
        totalCgst += calculated.cgst
        totalSgst += calculated.sgst
        totalIgst += calculated.igst

        return {
          line_number: index + 1,
          description: item.description,
          hsn_sac: item.hsn_sac,
          quantity: Number(item.quantity),
          unit: item.unit || 'NOS',
          rate: Number(item.rate),
          discount: Number(item.discount || 0),
          taxable_value: calculated.taxableValue,
          tax_rate: Number(item.tax_rate),
          cgst_amount: calculated.cgst,
          sgst_amount: calculated.sgst,
          igst_amount: calculated.igst,
          cess_amount: 0,
          amount: calculated.amount
        }
      })

      const taxAmount = totalCgst + totalSgst + totalIgst
      const grandTotal = subtotal + taxAmount
      const roundedTotal = Math.round(grandTotal)
      const roundOff = Number((roundedTotal - grandTotal).toFixed(2))

      updateData = {
        ...updateData,
        subtotal: subtotal.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        cgst_amount: totalCgst.toFixed(2),
        sgst_amount: totalSgst.toFixed(2),
        igst_amount: totalIgst.toFixed(2),
        round_off: roundOff.toFixed(2),
        total_amount: roundedTotal.toFixed(2),
        amount_in_words: numberToWords(roundedTotal)
      }

      // Delete old items
      await supabase.from('invoice_items').delete().eq('invoice_id', id)

      // Create new items
      const invoiceItems = processedItems.map((item: any) => ({
        invoice_id: id,
        ...item
      }))

      await supabase.from('invoice_items').insert(invoiceItems)
    }

    // Update invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select(`
        *,
        client:clients(id, name, email, phone, gstin, billing_address, state_code),
        items:invoice_items(*)
      `)
      .single()

    if (error || !invoice) {
      res.status(404).json({ error: 'Failed to update invoice' })
      return
    }

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      invoice
    })
  } catch (error: any) {
    console.error('Update invoice error:', error)
    res.status(500).json({ error: 'Failed to update invoice', details: error.message })
  }
}

export const updateInvoiceStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled']
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' })
      return
    }

    const updateData: any = { status }

    if (status === 'paid') {
      updateData.paid_date = new Date().toISOString().split('T')[0]
    } else if (status === 'cancelled') {
      updateData.paid_date = null
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single()

    if (error || !invoice) {
      res.status(404).json({ error: 'Invoice not found' })
      return
    }

    res.json({
      success: true,
      message: 'Invoice status updated successfully',
      invoice
    })
  } catch (error) {
    console.error('Update invoice status error:', error)
    res.status(500).json({ error: 'Failed to update invoice status' })
  }
}

export const getInvoiceStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('status, total_amount, invoice_date, paid_date')
      .eq('user_id', req.user!.id)

    if (error) {
      console.error('Get invoice stats error:', error)
      res.status(500).json({ error: 'Failed to fetch invoice stats' })
      return
    }

    const stats = {
      total: invoices.length,
      draft: invoices.filter(inv => inv.status === 'draft').length,
      sent: invoices.filter(inv => inv.status === 'sent').length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      overdue: invoices.filter(inv => inv.status === 'overdue').length,
      cancelled: invoices.filter(inv => inv.status === 'cancelled').length,
      
      totalRevenue: invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0),
      paidRevenue: invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0),
      unpaidRevenue: invoices
        .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0),
      
      thisMonthRevenue: invoices
        .filter(inv => {
          const invDate = new Date(inv.invoice_date)
          const now = new Date()
          return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear()
        })
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0),
      
      thisMonthPaid: invoices
        .filter(inv => {
          if (!inv.paid_date) return false
          const paidDate = new Date(inv.paid_date)
          const now = new Date()
          return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear()
        })
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0)
    }

    res.json({ success: true, stats })
  } catch (error) {
    console.error('Get invoice stats error:', error)
    res.status(500).json({ error: 'Failed to fetch invoice stats' })
  }
}

/**
 * Generate PDF and upload to Cloudinary
 */
export const generatePDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    console.log('=== PDF GENERATION START ===')
    console.log('Invoice ID:', id)

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, phone, gstin, pan, billing_address, shipping_address, state_code, state_name),
        items:invoice_items(*)
      `)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single()

    if (error || !invoice) {
      console.error('Invoice not found:', error)
      res.status(404).json({ error: 'Invoice not found' })
      return
    }

    const { data: userData } = await supabase
      .from('users')
      .select('business_name, email, phone, gstin, pan, address, state_code, state_name')
      .eq('id', req.user!.id)
      .single()

    if (!userData) {
      console.error('User not found')
      res.status(404).json({ error: 'User not found' })
      return
    }

    const user = {
      businessName: userData.business_name,
      email: userData.email,
      phone: userData.phone || '',
      gstin: userData.gstin || '',
      pan: userData.pan || '',
      address: userData.address || '',
      stateCode: userData.state_code || '',
      stateName: userData.state_name || ''
    }

    console.log('Generating PDF for invoice:', invoice.invoice_number)

    // Generate PDF buffer
    const pdfBuffer = await generateInvoicePDF(invoice as any, user)
    console.log('=== PDF GENERATION SUCCESS ===')

    // Upload to Cloudinary
    console.log('Uploading PDF to Cloudinary...')
    const uploadResult = await uploadInvoicePDF(pdfBuffer, invoice.invoice_number)
    console.log('PDF uploaded successfully:', uploadResult.secure_url)

    // Save PDF URL to database
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        pdf_url: uploadResult.secure_url,
        pdf_public_id: uploadResult.public_id
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error saving PDF URL:', updateError)
      // Continue anyway - PDF is uploaded to Cloudinary
    } else {
      console.log('PDF URL saved to database')
    }

    // Send PDF as download response
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`)
    res.setHeader('Content-Length', pdfBuffer.length)

    res.send(pdfBuffer)
    
    console.log('PDF generated and uploaded successfully')
  } catch (error: any) {
    console.error('=== PDF GENERATION ERROR ===')
    console.error('Error:', error)
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message 
    })
  }
}

/**
 * Get PDF URL without regenerating (returns Cloudinary URL)
 */
export const getInvoicePDFUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('invoice_number, pdf_url, pdf_public_id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single()

    if (error || !invoice) {
      res.status(404).json({ error: 'Invoice not found' })
      return
    }

    if (!invoice.pdf_url) {
      res.status(404).json({ 
        error: 'PDF not generated yet',
        message: 'Please generate the PDF first by downloading it'
      })
      return
    }

    res.json({
      success: true,
      invoice_number: invoice.invoice_number,
      pdf_url: invoice.pdf_url,
      public_id: invoice.pdf_public_id
    })
  } catch (error) {
    console.error('Get PDF URL error:', error)
    res.status(500).json({ error: 'Failed to get PDF URL' })
  }
}

/**
 * Delete invoice with PDF cleanup
 */
export const deleteInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { data: invoice } = await supabase
      .from('invoices')
      .select('status, pdf_public_id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single()

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' })
      return
    }

    if (invoice.status === 'paid') {
      res.status(400).json({ error: 'Cannot delete paid invoices' })
      return
    }

    // Delete PDF from Cloudinary if exists
    if (invoice.pdf_public_id) {
      try {
        await deleteInvoicePDF(invoice.pdf_public_id)
        console.log('PDF deleted from Cloudinary')
      } catch (error) {
        console.error('Error deleting PDF from Cloudinary:', error)
        // Continue with invoice deletion even if PDF deletion fails
      }
    }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id)

    if (error) {
      res.status(500).json({ error: 'Failed to delete invoice' })
      return
    }

    res.json({ success: true, message: 'Invoice and PDF deleted successfully' })
  } catch (error) {
    console.error('Delete invoice error:', error)
    res.status(500).json({ error: 'Failed to delete invoice' })
  }
}

// ==================== RAZORPAY INTEGRATION ====================

/**
 * 🆕 Generate Razorpay Payment Link
 */
export const generatePaymentLink = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    console.log('=== GENERATE PAYMENT LINK ===')
    console.log('Invoice ID:', id)

    // Get invoice with client details
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, phone, gstin, billing_address)
      `)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single()

    if (error || !invoice) {
      console.error('Invoice not found:', error)
      res.status(404).json({ 
        success: false,
        error: 'Invoice not found' 
      })
      return
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      res.status(400).json({ 
        success: false,
        error: 'Invoice is already paid' 
      })
      return
    }

    // Check if payment link already exists
    if (invoice.payment_link_url && invoice.razorpay_order_id) {
      console.log('Payment link already exists:', invoice.payment_link_url)
      res.json({
        success: true,
        message: 'Payment link already exists',
        paymentLink: invoice.payment_link_url,
        orderId: invoice.razorpay_order_id,
      })
      return
    }

    // Create new payment link
    const paymentLinkData = await razorpayService.createPaymentLink({
      amount: parseFloat(invoice.total_amount),
      invoiceNumber: invoice.invoice_number,
      customerName: invoice.client.name,
      customerEmail: invoice.client.email,
      customerPhone: invoice.client.phone || '',
      description: `Payment for Invoice #${invoice.invoice_number}${invoice.client.company ? ` - ${invoice.client.company}` : ''}`,
      invoiceId: id,
    })

    console.log('Payment link created:', paymentLinkData.paymentLinkUrl)

    // Update invoice with payment link details
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        razorpay_payment_link_id: paymentLinkData.paymentLinkId,
        razorpay_order_id: paymentLinkData.orderId,
        payment_link_url: paymentLinkData.paymentLinkUrl,
        payment_link_created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating invoice:', updateError)
      res.status(500).json({ 
        success: false,
        error: 'Failed to save payment link' 
      })
      return
    }

    console.log('✅ Payment link generated successfully')

    res.json({
      success: true,
      message: 'Payment link generated successfully',
      paymentLink: paymentLinkData.paymentLinkUrl,
      orderId: paymentLinkData.orderId,
      paymentLinkId: paymentLinkData.paymentLinkId,
    })
  } catch (error: any) {
    console.error('❌ Payment link generation error:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to generate payment link' 
    })
  }
}

// ==================== MAILGUN EMAIL INTEGRATION ====================

/**
 * 🆕 Send Invoice via Email (Mailgun)
 */
export const sendInvoiceEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    console.log('=== SEND INVOICE EMAIL ===')
    console.log('Invoice ID:', id)

    // Get invoice with all details including payment link
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, phone, gstin, billing_address),
        items:invoice_items(*)
      `)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single()

    if (error || !invoice) {
      console.error('Invoice not found:', error)
      res.status(404).json({ 
        success: false,
        error: 'Invoice not found' 
      })
      return
    }

    if (!invoice.client?.email) {
      res.status(400).json({ 
        success: false,
        error: 'Client email not found' 
      })
      return
    }

    // Get user details for PDF generation
    const { data: userData } = await supabase
      .from('users')
      .select('business_name, email, phone, gstin, pan, address, state_code, state_name')
      .eq('id', req.user!.id)
      .single()

    if (!userData) {
      res.status(404).json({ 
        success: false,
        error: 'User not found' 
      })
      return
    }

    const user = {
      businessName: userData.business_name,
      email: userData.email,
      phone: userData.phone || '',
      gstin: userData.gstin || '',
      pan: userData.pan || '',
      address: userData.address || '',
      stateCode: userData.state_code || '',
      stateName: userData.state_name || ''
    }

    // Generate payment link if it doesn't exist
    let paymentLink = invoice.payment_link_url

    if (!paymentLink && invoice.status !== 'paid') {
      console.log('Payment link not found, generating new one...')
      
      try {
        const paymentLinkData = await razorpayService.createPaymentLink({
          amount: parseFloat(invoice.total_amount),
          invoiceNumber: invoice.invoice_number,
          customerName: invoice.client.name,
          customerEmail: invoice.client.email,
          customerPhone: invoice.client.phone || '',
          description: `Payment for Invoice #${invoice.invoice_number}`,
          invoiceId: id,
        })

        paymentLink = paymentLinkData.paymentLinkUrl

        // Update invoice with payment link
        await supabase
          .from('invoices')
          .update({
            razorpay_payment_link_id: paymentLinkData.paymentLinkId,
            razorpay_order_id: paymentLinkData.orderId,
            payment_link_url: paymentLink,
            payment_link_created_at: new Date().toISOString(),
          })
          .eq('id', id)

        console.log('✅ Payment link generated:', paymentLink)
      } catch (linkError: any) {
        console.error('Failed to generate payment link:', linkError)
        // Continue without payment link - don't fail the email
      }
    }

    console.log('Sending email to:', invoice.client.email)
    console.log('Payment Link:', paymentLink || 'None')

    // 🔧 FIX: Generate PDF buffer
    console.log('Generating PDF for email attachment...')
    const pdfBuffer = await generateInvoicePDF(invoice as any, user)
    console.log('✅ PDF generated, size:', pdfBuffer.length, 'bytes')

    if (!pdfBuffer) {
      res.status(500).json({ 
        success: false,
        error: 'Failed to generate PDF' 
      })
      return
    }

    // Format due date
    const formattedDueDate = new Date(invoice.due_date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

    // Send email with payment link and PDF attachment
    console.log('Sending email via Mailgun...')
    await emailService.sendInvoice({
      to: invoice.client.email,
      customerName: invoice.client.name,
      invoiceNumber: invoice.invoice_number,
      amount: parseFloat(invoice.total_amount),
      paymentLink: paymentLink || '',
      pdfBuffer: pdfBuffer,
      dueDate: formattedDueDate,
    })

    // Update invoice with email sent status
    await supabase
      .from('invoices')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        status: invoice.status === 'draft' ? 'sent' : invoice.status, // Auto-update draft to sent
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    console.log('✅ Invoice email sent successfully')

    res.json({
      success: true,
      message: 'Invoice sent successfully',
      emailSentTo: invoice.client.email,
      paymentLink: paymentLink
    })
  } catch (error: any) {
    console.error('❌ Send invoice error:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to send invoice email' 
    })
  }
}

/**
 * 🆕 Send Payment Reminder
 */
export const sendPaymentReminder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    console.log('=== SEND PAYMENT REMINDER ===')
    console.log('Invoice ID:', id)

    // Get invoice with client details
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email)
      `)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single()

    if (error || !invoice) {
      console.error('Invoice not found:', error)
      res.status(404).json({ 
        success: false,
        error: 'Invoice not found' 
      })
      return
    }

    // Check if already paid
    if (invoice.status === 'paid') {
      res.status(400).json({ 
        success: false,
        error: 'Invoice is already paid. No reminder needed.' 
      })
      return
    }

    // Check if payment link exists
    if (!invoice.payment_link_url) {
      res.status(400).json({ 
        success: false,
        error: 'Please generate payment link first' 
      })
      return
    }

    // Calculate days overdue
    const dueDate = new Date(invoice.due_date)
    const today = new Date()
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

    // Format due date
    const formattedDueDate = dueDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

    console.log('Sending reminder to:', invoice.client.email)

    // Send reminder email
    const emailResult = await emailService.sendPaymentReminder({
      to: invoice.client.email,
      customerName: invoice.client.name,
      invoiceNumber: invoice.invoice_number,
      amount: parseFloat(invoice.total_amount),
      dueDate: formattedDueDate,
      paymentLink: invoice.payment_link_url,
      daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
    })

    // Log reminder sent
    await supabase
      .from('invoices')
      .update({
        last_reminder_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    console.log('✅ Payment reminder sent successfully')

    res.json({ 
      success: true, 
      message: `Payment reminder sent to ${invoice.client.email}`,
      messageId: emailResult.messageId,
      daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
    })
  } catch (error: any) {
    console.error('❌ Send reminder error:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to send payment reminder' 
    })
  }
}
