import { z } from 'zod'

// Line Item Schema with GST 2.0 fields
export const LineItemSchema = z.object({
  id: z.string().optional(),
  line_number: z.number().optional(),
  description: z.string().min(3, 'Description is required'),
  hsn_sac: z.string().regex(/^\d{4,8}$/, 'Invalid HSN/SAC code (4-8 digits)'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().default('NOS'),
  rate: z.number().min(0, 'Rate must be positive'),
  discount: z.number().min(0).default(0),
  taxable_value: z.number().optional(),
  tax_rate: z.number().min(0).max(100, 'Tax rate must be between 0-100'),
  cgst_amount: z.number().optional(),
  sgst_amount: z.number().optional(),
  igst_amount: z.number().optional(),
  cess_amount: z.number().optional(),
  amount: z.number()
})

// Invoice Schema with GST 2.0 fields
export const InvoiceSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  invoice_number: z.string().optional(),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  supply_date: z.string().optional(),
  place_of_supply: z.string().min(1, 'Place of supply is required'),
  is_reverse_charge: z.boolean().default(false),
  items: z.array(LineItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  terms_conditions: z.string().optional()
})

export type LineItem = z.infer<typeof LineItemSchema>
export type InvoiceFormData = z.infer<typeof InvoiceSchema>

// Complete Invoice Interface
export interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  supply_date?: string
  client_id: string
  user_id: string
  place_of_supply: string
  is_reverse_charge: boolean
  
  // Amounts
  subtotal: number | string
  tax_amount: number | string
  total_amount: number | string
  
  // Tax Breakdown
  cgst_amount: number | string
  sgst_amount: number | string
  igst_amount: number | string
  cess_amount: number | string
  
  // Additional Fields
  round_off: number | string
  amount_in_words?: string
  
  // Status
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  paid_date?: string
  pdf_url?: string
  notes?: string
  terms_conditions?: string
  
  // E-Invoice Fields
  irn?: string
  irn_ack_no?: string
  irn_ack_date?: string
  irn_qr_code?: string
  
  // E-Way Bill Fields
  eway_bill_no?: string
  eway_valid_from?: string
  eway_valid_to?: string
  vehicle_no?: string
  transporter_id?: string
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Relations
  client?: Client
  items?: InvoiceItem[]

   razorpay_payment_link_id?: string
  razorpay_order_id?: string
  payment_link_url?: string
  payment_link_created_at?: string
  razorpay_payment_id?: string
  
  // 🆕 Email fields
  email_sent?: boolean
  email_sent_at?: string
  last_reminder_sent_at?: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  line_number: number
  description: string
  hsn_sac: string
  quantity: number | string
  unit: string
  rate: number | string
  discount: number | string
  taxable_value: number | string
  tax_rate: number | string
  cgst_amount: number | string
  sgst_amount: number | string
  igst_amount: number | string
  cess_amount: number | string
  amount: number | string
  created_at?: string
  updated_at?: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  gstin?: string
  pan?: string
  billing_address?: string
  shipping_address?: string
  state_code?: string
  state_name?: string
}

export interface InvoiceStats {
  total: number
  draft: number
  sent: number
  paid: number
  overdue: number
  totalRevenue: number
  paidRevenue: number
  unpaidRevenue: number
}

// Common HSN/SAC Codes (GST 2.0 - Updated Dec 2025)
export const COMMON_HSN_SAC = [
  { code: '998314', description: 'IT Services - Software Development', gstRate: 18 },
  { code: '998313', description: 'IT Services - Consulting & Advisory', gstRate: 18 },
  { code: '998315', description: 'IT Services - Maintenance & Support', gstRate: 18 },
  { code: '996511', description: 'Design Services - Graphics/UI/UX', gstRate: 18 },
  { code: '996512', description: 'Design Services - Web Design', gstRate: 18 },
  { code: '998311', description: 'Marketing Services - Digital Marketing', gstRate: 18 },
  { code: '998312', description: 'Accounting Services - Bookkeeping', gstRate: 18 },
  { code: '995411', description: 'Legal Services', gstRate: 18 },
  { code: '996211', description: 'Management Consulting', gstRate: 18 },
  { code: '997212', description: 'Photography Services', gstRate: 18 },
]

// Indian States with Codes (for GST)
export const INDIAN_STATES = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
]

// Unit of Measurement
export const UNITS = [
  'NOS', 'PCS', 'KGS', 'LTR', 'MTR', 'BOX', 'SET', 'HRS', 'DAYS', 'MONTHS'
]

// GST Rates (GST 2.0 - Updated)
export const GST_RATES = [
  { value: 0, label: '0% (Exempt)' },
  { value: 5, label: '5% (Standard Goods)' },
  { value: 12, label: '12% (Reduced Rate)' },
  { value: 18, label: '18% (Standard Services)' },
  { value: 28, label: '28% (Luxury Goods)' },
]
