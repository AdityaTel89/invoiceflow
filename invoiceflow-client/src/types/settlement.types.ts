export interface Settlement {
  id: string
  invoice_id: string
  user_id: string
  invoice_amount: number
  platform_commission: number
  razorpay_fees: number
  gst_on_fees: number
  net_amount: number
  transfer_id?: string
  razorpay_payment_id?: string
  settlement_status: 'pending' | 'initiated' | 'processed' | 'settled' | 'failed' | 'reversed'
  settlement_utr?: string
  failure_reason?: string
  initiated_at?: string
  settled_at?: string
  created_at: string
  invoice?: {
    invoice_number: string
    total_amount: number
    invoice_date: string
  }
}

export interface SettlementCalculation {
  platform_commission: number
  razorpay_fees: number
  gst_on_fees: number
  net_amount: number
}
