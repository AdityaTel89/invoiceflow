import { GST_COMPLIANCE_RULES } from '../types/gst.types'

export const validateGSTCompliance = (invoice: any, user: any) => {
  const errors: string[] = []

  // Check mandatory fields
  GST_COMPLIANCE_RULES.MANDATORY_FIELDS.forEach(field => {
    if (!invoice[field]) {
      errors.push(`Missing mandatory field: ${field}`)
    }
  })

  // Validate GSTIN format
  if (invoice.recipientGstin && invoice.recipientGstin.length > 0) {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    if (!gstinRegex.test(invoice.recipientGstin)) {
      errors.push('Invalid recipient GSTIN format')
    }
  }

  // Check unregistered recipient with high value
  if (
    !invoice.recipientGstin &&
    parseFloat(String(invoice.total_amount)) > GST_COMPLIANCE_RULES.MINIMUM_INVOICE_VALUE_FOR_UNREGISTERED
  ) {
    // Require additional details for unregistered recipients
    if (!invoice.recipientName || !invoice.recipientAddress) {
      errors.push(
        `For invoices exceeding ₹${GST_COMPLIANCE_RULES.MINIMUM_INVOICE_VALUE_FOR_UNREGISTERED}, ` +
        'unregistered recipient details must include name and address'
      )
    }
  }

  // Check HSN/SAC code presence
  invoice.items?.forEach((item: any, idx: number) => {
    if (!item.hsnSac) {
      errors.push(`Item ${idx + 1}: HSN/SAC code is mandatory`)
    }
  })

  // Check if e-invoicing is required
  const turnover = parseFloat(String(user.annualTurnover || 0))
  if (turnover > GST_COMPLIANCE_RULES.E_INVOICING_THRESHOLD) {
    // Add warning for e-invoicing compliance
    console.warn('⚠️ Warning: Your turnover exceeds ₹5 Cr. E-invoicing is mandatory.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: turnover > GST_COMPLIANCE_RULES.E_INVOICING_THRESHOLD ? 
      ['E-invoicing required for annual turnover > ₹5 Cr'] : []
  }
}

export const getInvoiceType = (invoice: any): string => {
  // Determine invoice type based on business rules
  if (invoice.totalAmount === 0) return 'BILL OF SUPPLY'
  if (invoice.status === 'credit') return 'CREDIT NOTE'
  if (invoice.status === 'debit') return 'DEBIT NOTE'
  if (invoice.items?.reduce((s: number, i: any) => s + i.amount, 0) < 200) return 'AGGREGATE INVOICE'
  return 'TAX INVOICE'
}
