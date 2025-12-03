// src/utils/gstValidator.ts
import { InvoiceItem } from '../types/invoice.types'

// GSTIN Format: 15 characters (State Code + PAN + Entity + Z + Checksum)
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

export function validateGstin(gstin: string): boolean {
  if (!gstin || gstin.length !== 15) return false
  return GSTIN_REGEX.test(gstin.toUpperCase())
}

export function extractStateCodeFromGstin(gstin: string): string {
  if (!validateGstin(gstin)) return ''
  return gstin.substring(0, 2)
}

export function isInterStateSupply(
  supplierStateCode: string,
  recipientStateCode: string
): boolean {
  return supplierStateCode !== recipientStateCode
}

export function validateHsnSac(code: string, annualTurnover: number): { valid: boolean; message?: string } {
  if (!code) return { valid: false, message: 'HSN/SAC code is required' }
  
  const minDigits = annualTurnover > 500000000 ? 6 : annualTurnover > 150000000 ? 4 : 0
  
  if (minDigits > 0 && code.length < minDigits) {
    return {
      valid: false,
      message: `HSN/SAC must be at least ${minDigits} digits for your turnover`
    }
  }
  
  return { valid: true }
}

export function calculateLineTax(
  item: InvoiceItem,
  isInterState: boolean,
  cessRate: number = 0
): {
  taxable_value: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  cess_amount: number
  amount: number
} {
  const gross = Number(item.quantity) * Number(item.rate)
  const discount = Number(item.discount || 0)
  const taxableValue = gross - discount
  
  const gstAmount = (taxableValue * Number(item.tax_rate)) / 100
  const cessAmount = (taxableValue * cessRate) / 100
  
  let cgst = 0
  let sgst = 0
  let igst = 0
  
  if (isInterState) {
    igst = gstAmount
  } else {
    cgst = gstAmount / 2
    sgst = gstAmount / 2
  }
  
  const total = taxableValue + cgst + sgst + igst + cessAmount
  
  return {
    taxable_value: Number(taxableValue.toFixed(2)),
    cgst_amount: Number(cgst.toFixed(2)),
    sgst_amount: Number(sgst.toFixed(2)),
    igst_amount: Number(igst.toFixed(2)),
    cess_amount: Number(cessAmount.toFixed(2)),
    amount: Number(total.toFixed(2))
  }
}

export function numberToWords(amount: number): string {
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
  
  if (crore > 0) {
    words += convertTwoDigit(crore, ones, teens, tens) + ' Crore '
  }
  if (lakh > 0) {
    words += convertTwoDigit(lakh, ones, teens, tens) + ' Lakh '
  }
  if (thousand > 0) {
    words += convertTwoDigit(thousand, ones, teens, tens) + ' Thousand '
  }
  if (hundred > 0) {
    words += ones[hundred] + ' Hundred '
  }
  if (remainder > 0) {
    words += convertTwoDigit(remainder, ones, teens, tens)
  }
  
  return words.trim() + ' Rupees Only'
}

function convertTwoDigit(num: number, ones: string[], teens: string[], tens: string[]): string {
  if (num < 10) return ones[num]
  if (num >= 10 && num < 20) return teens[num - 10]
  return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '')
}

export function generateInvoiceNumber(prefix: string = 'INV'): string {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${year}${month}-${random}`
}

export function isEInvoiceRequired(annualTurnover: number): boolean {
  return annualTurnover > 500000000 // ₹5 Crore
}

export function isEWayBillRequired(invoiceAmount: number): boolean {
  return invoiceAmount > 50000 // ₹50,000
}

export function calculateEWayBillValidity(distance: number): { validFrom: Date; validTo: Date } {
  const now = new Date()
  const daysValid = Math.ceil(distance / 100) // 100km per day
  const validTo = new Date(now)
  validTo.setDate(validTo.getDate() + daysValid)
  
  return {
    validFrom: now,
    validTo
  }
}
