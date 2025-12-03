// src/types/invoice.types.ts

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export interface InvoiceItem {
  id?: string
  invoice_id?: string
  line_number?: number
  description: string
  hsn_sac: string
  quantity: number
  unit?: string
  rate: number
  discount?: number
  taxable_value?: number
  tax_rate: number
  cgst_amount?: number
  sgst_amount?: number
  igst_amount?: number
  cess_amount?: number
  amount?: number
}

export interface Invoice {
  id?: string
  invoice_number: string
  invoice_date: string
  due_date: string
  supply_date?: string
  user_id: string
  client_id: string
  place_of_supply: string
  is_reverse_charge?: boolean
  
  subtotal: number | string
  tax_amount: number | string
  total_amount: number | string
  cgst_amount?: number | string
  sgst_amount?: number | string
  igst_amount?: number | string
  cess_amount?: number | string
  round_off?: number | string
  amount_in_words?: string
  
  status: InvoiceStatus
  paid_date?: string
  pdf_url?: string
  notes?: string
  terms_conditions?: string
  
  // E-Invoice
  irn?: string
  irn_ack_no?: string
  irn_ack_date?: string
  irn_qr_code?: string
  
  // E-Way Bill
  eway_bill_no?: string
  eway_valid_from?: string
  eway_valid_to?: string
  vehicle_no?: string
  transporter_id?: string
  
  created_at?: string
  updated_at?: string
  
  client?: {
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
  
  items?: InvoiceItem[]
}

export interface CreateInvoiceDTO {
  invoice_date: string
  due_date: string
  supply_date?: string
  client_id: string
  place_of_supply: string
  is_reverse_charge?: boolean
  notes?: string
  terms_conditions?: string
  items: InvoiceItem[]
}

export interface UpdateInvoiceDTO extends Partial<CreateInvoiceDTO> {
  status?: InvoiceStatus
  paid_date?: string
  supply_date?: string
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
