import { supabaseAdmin } from '../config/supabase.config.js'

export class SettlementService {
  /**
   * Calculate settlement breakdown
   * Platform commission + Razorpay fees (2% + 18% GST)
   */
  async calculateSettlement(invoiceAmount: number, commissionRate: number = 0) {
    const { data, error } = await supabaseAdmin.rpc('calculate_settlement_amount', {
      p_invoice_amount: invoiceAmount,
      p_commission_rate: commissionRate
    } as any) // ✅ Type assertion for RPC functions

    if (error) {
      console.error('Settlement calculation error:', error)
      throw new Error('Failed to calculate settlement')
    }

    return data[0] // Returns { platform_commission, razorpay_fees, gst_on_fees, net_amount }
  }

  /**
   * Get user's settlement history
   */
  async getUserSettlements(userId: string, limit: number = 50) {
    const { data, error } = await supabaseAdmin
      .from('settlements')
      .select(`
        *,
        invoice:invoices(invoice_number, total_amount, invoice_date)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  /**
   * Get settlement by invoice ID
   */
  async getSettlementByInvoice(invoiceId: string) {
    const { data, error } = await supabaseAdmin
      .from('settlements')
      .select('*')
      .eq('invoice_id', invoiceId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // Ignore not found
    return data
  }
}

export default new SettlementService()
