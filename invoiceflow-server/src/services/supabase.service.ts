import { supabaseAdmin } from '../config/supabase.config.js'

export class SupabaseService {
  // Get user by ID
  async getUserById(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  // Update user KYC status
  async updateKYCStatus(
    userId: string,
    status: string,
    linkedAccountId?: string,
    rejectionReason?: string
  ) {
    const updateData: any = {
      kyc_status: status
    }

    if (status === 'submitted') {
      updateData.kyc_submitted_at = new Date().toISOString()
    }

    if (status === 'verified') {
      updateData.kyc_verified_at = new Date().toISOString()
    }

    if (linkedAccountId) {
      updateData.linked_account_id = linkedAccountId
    }

    if (rejectionReason) {
      updateData.kyc_rejection_reason = rejectionReason
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData as any)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Create settlement record
  async createSettlement(settlementData: {
    invoice_id: string
    user_id: string
    invoice_amount: number
    platform_commission: number
    razorpay_fees: number
    gst_on_fees: number
    net_amount: number
    transfer_id?: string
    razorpay_payment_id?: string
    settlement_status: string
  }) {
    const { data, error } = await supabaseAdmin
      .from('settlements')
      .insert(settlementData as any)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update settlement status
  async updateSettlementStatus(
    settlementId: string,
    status: string,
    utr?: string
  ) {
    const updateData: any = {
      settlement_status: status
    }

    if (status === 'settled') {
      updateData.settled_at = new Date().toISOString()
    }

    if (utr) {
      updateData.settlement_utr = utr
    }

    const { data, error } = await supabaseAdmin
      .from('settlements')
      .update(updateData as any)
      .eq('id', settlementId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get pending KYC submissions (admin)
  async getPendingKYC() {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, business_name, kyc_status, kyc_submitted_at, linked_account_id')
      .eq('kyc_status', 'submitted')
      .order('kyc_submitted_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Get user documents
  async getUserDocuments(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('linked_account_documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })

    if (error) throw error
    return data
  }
}

export default new SupabaseService()
