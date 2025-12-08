import type { Response } from 'express'
import type { AuthRequest } from '../middleware/authMiddleware.js'
import supabaseService from '../services/supabase.service.js'
import { supabaseAdmin } from '../config/supabase.config.js'
import { auditLog } from '../middleware/audit.middleware.js'

export const getPendingKYC = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pending = await supabaseService.getPendingKYC()

    res.json({
      success: true,
      data: pending
    })
  } catch (error: any) {
    console.error('Get pending KYC error:', error)
    res.status(500).json({ error: 'Failed to fetch pending KYC submissions' })
  }
}

export const verifyDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params
    const { verificationStatus, notes } = req.body
    const adminId = req.user!.id

    const { data, error } = await supabaseAdmin
      .from('linked_account_documents')
      .update({
        verification_status: verificationStatus,
        verification_notes: notes,
        verified_at: new Date().toISOString(),
        verified_by: adminId
      } as any)
      .eq('id', documentId)
      .select('*')
      .single()

    if (error) {
      res.status(500).json({ error: 'Failed to verify document' })
      return
    }

    // If all documents verified, update user KYC status
    if (verificationStatus === 'verified' && data) {
      const { data: allDocs } = await supabaseAdmin
        .from('linked_account_documents')
        .select('verification_status')
        .eq('user_id', data.user_id)

      const allVerified = allDocs?.every((doc: any) => doc.verification_status === 'verified')

      if (allVerified) {
        await supabaseService.updateKYCStatus(data.user_id, 'verified')
      }
    }

    await auditLog(adminId, {
      action: 'document_verified',
      entityType: 'document',
      entityId: documentId,
      requestData: { verificationStatus, notes },
      status: 'success'
    })

    res.json({
      success: true,
      message: 'Document verification updated',
      data
    })
  } catch (error: any) {
    console.error('Verify document error:', error)
    res.status(500).json({ error: 'Failed to verify document' })
  }
}

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, userId, startDate, endDate, limit } = req.query

    let query = supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (action) query = query.eq('action', action as string)
    if (userId) query = query.eq('user_id', userId as string)
    if (startDate) query = query.gte('created_at', startDate as string)
    if (endDate) query = query.lte('created_at', endDate as string)
    if (limit) query = query.limit(parseInt(limit as string))

    const { data, error } = await query

    if (error) throw error

    res.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('Get audit logs error:', error)
    res.status(500).json({ error: 'Failed to fetch audit logs' })
  }

}
export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Total users
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })

    // Total invoices
    const { count: totalInvoices } = await supabaseAdmin
      .from('invoices')
      .select('id', { count: 'exact', head: true })

    // KYC stats
    const { count: pendingKYC } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('kyc_status', 'submitted')

    const { count: verifiedKYC } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('kyc_status', 'verified')

    const { count: rejectedKYC } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('kyc_status', 'rejected')

    // Total revenue
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('total_amount')
      .eq('status', 'paid')

    const totalRevenue = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0

    // Active users (logged in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: activeUsers } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('last_login_at', thirtyDaysAgo.toISOString())

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalInvoices: totalInvoices || 0,
        pendingKYC: pendingKYC || 0,
        verifiedKYC: verifiedKYC || 0,
        rejectedKYC: rejectedKYC || 0,
        totalRevenue,
        activeUsers: activeUsers || 0,
        totalSettlements: 0 // TODO: Implement settlements
      }
    })
  } catch (error: any) {
    console.error('Get admin stats error:', error)
    res.status(500).json({ error: 'Failed to fetch admin statistics' })
  }
}

export const approveKYC = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const adminId = req.user!.id

    // Update user KYC status
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        kyc_status: 'verified',
        kyc_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', userId)

    if (error) throw error

    // Audit log
    await auditLog(adminId, {
      action: 'kyc_approved',
      entityType: 'user',
      entityId: userId,
      status: 'success'
    })

    res.json({
      success: true,
      message: 'KYC approved successfully'
    })
  } catch (error: any) {
    console.error('Approve KYC error:', error)
    res.status(500).json({ error: 'Failed to approve KYC' })
  }
}

export const rejectKYC = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const { reason } = req.body
    const adminId = req.user!.id

    // Update user KYC status
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        kyc_status: 'rejected',
        kyc_rejection_reason: reason,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', userId)

    if (error) throw error

    // Audit log
    await auditLog(adminId, {
      action: 'kyc_rejected',
      entityType: 'user',
      entityId: userId,
      requestData: { reason },
      status: 'success'
    })

    res.json({
      success: true,
      message: 'KYC rejected'
    })
  } catch (error: any) {
    console.error('Reject KYC error:', error)
    res.status(500).json({ error: 'Failed to reject KYC' })
  }
}

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        business_name,
        kyc_status,
        is_active,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get invoice counts and revenue for each user
    const usersWithStats = await Promise.all(
      users.map(async (user: any) => {
        const { data: invoices } = await supabaseAdmin
          .from('invoices')
          .select('total_amount, status')
          .eq('user_id', user.id)

        const totalInvoices = invoices?.length || 0
        const totalRevenue = invoices
          ?.filter((inv: any) => inv.status === 'paid')
          .reduce((sum: number, inv: any) => sum + inv.total_amount, 0) || 0

        return {
          id: user.id,
          email: user.email,
          businessName: user.business_name,
          kycStatus: user.kyc_status,
          isActive: user.is_active,
          createdAt: user.created_at,
          totalInvoices,
          totalRevenue
        }
      })
    )

    res.json({
      success: true,
      data: usersWithStats
    })
  } catch (error: any) {
    console.error('Get all users error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
}

export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const { isActive } = req.body
    const adminId = req.user!.id

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', userId)

    if (error) throw error

    // Audit log
    await auditLog(adminId, {
      action: isActive ? 'user_activated' : 'user_deactivated',
      entityType: 'user',
      entityId: userId,
      status: 'success'
    })

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error: any) {
    console.error('Toggle user status error:', error)
    res.status(500).json({ error: 'Failed to update user status' })
  }
}