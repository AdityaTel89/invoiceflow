import type { Response } from 'express'
import type { AuthRequest } from '../middleware/authMiddleware.js'
import { supabaseAdmin } from '../config/supabase.config.js'
import bcrypt from 'bcryptjs'
import { validatePhone } from '../utils/validators.js'
import { auditLog } from '../middleware/audit.middleware.js'

/**
 * Get user profile
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        business_name,
        phone,
        address,
        city,
        state,
        postal_code,
        country,
        kyc_status,
        linked_account_id,
        created_at
      `)
      .eq('id', userId)
      .single()

    if (error || !user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        businessName: user.business_name,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        postalCode: user.postal_code,
        country: user.country,
        kycStatus: user.kyc_status,
        linkedAccountId: user.linked_account_id,
        createdAt: user.created_at
      }
    })
  } catch (error: any) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
}

/**
 * Update user profile
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const { businessName, phone, address, city, state, postalCode, country } = req.body

    console.log('=== UPDATE PROFILE ===')
    console.log('User ID:', userId)
    console.log('Data:', { businessName, phone, city, state })

    // Validation
    const errors: string[] = []

    if (businessName && businessName.trim().length < 2) {
      errors.push('Business name must be at least 2 characters')
    }

    if (phone && !validatePhone(phone)) {
      errors.push('Invalid phone number format')
    }

    if (postalCode && !/^\d{6}$/.test(postalCode)) {
      errors.push('Invalid postal code')
    }

    if (errors.length > 0) {
      res.status(400).json({ success: false, errors })
      return
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (businessName !== undefined) updateData.business_name = businessName.trim()
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (postalCode !== undefined) updateData.postal_code = postalCode
    if (country !== undefined) updateData.country = country

    // Update user in database
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        id,
        email,
        business_name,
        phone,
        address,
        city,
        state,
        postal_code,
        country,
        kyc_status,
        linked_account_id,
        created_at
      `)
      .single()

    if (error) {
      console.error('Update profile error:', error)
      res.status(500).json({ error: 'Failed to update profile' })
      return
    }

    // Audit log
    await auditLog(userId, {
      action: 'profile_updated',
      entityType: 'user',
      entityId: userId,
      requestData: { businessName, phone, city, state },
      status: 'success'
    })

    console.log('✅ Profile updated successfully')

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        businessName: updatedUser.business_name,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
        state: updatedUser.state,
        postalCode: updatedUser.postal_code,
        country: updatedUser.country,
        kycStatus: updatedUser.kyc_status,
        linkedAccountId: updatedUser.linked_account_id,
        createdAt: updatedUser.created_at
      }
    })
  } catch (error: any) {
    console.error('❌ Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

/**
 * Change password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const { currentPassword, newPassword } = req.body

    console.log('=== CHANGE PASSWORD ===')
    console.log('User ID:', userId)

    // Validation
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password are required' })
      return
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' })
      return
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    if (!passwordRegex.test(newPassword)) {
      res.status(400).json({ 
        error: 'Password must contain uppercase, lowercase, number, and special character' 
      })
      return
    }

    // Get current user data
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isValidPassword) {
      res.status(401).json({ error: 'Current password is incorrect' })
      return
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', userId)

    if (updateError) {
      console.error('Password update error:', updateError)
      res.status(500).json({ error: 'Failed to update password' })
      return
    }

    // Audit log
    await auditLog(userId, {
      action: 'password_changed',
      entityType: 'user',
      entityId: userId,
      status: 'success'
    })

    console.log('✅ Password changed successfully')

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error: any) {
    console.error('❌ Change password error:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
}

/**
 * Delete account (soft delete)
 */
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const { password } = req.body

    console.log('=== DELETE ACCOUNT ===')
    console.log('User ID:', userId)

    if (!password) {
      res.status(400).json({ error: 'Password is required' })
      return
    }

    // Get current user data
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('password_hash, email')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      res.status(401).json({ error: 'Incorrect password' })
      return
    }

    // Soft delete - mark as deleted
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', userId)

    if (deleteError) {
      console.error('Delete account error:', deleteError)
      res.status(500).json({ error: 'Failed to delete account' })
      return
    }

    // Audit log
    await auditLog(userId, {
      action: 'account_deleted',
      entityType: 'user',
      entityId: userId,
      status: 'success'
    })

    console.log('✅ Account deleted successfully')

    res.json({
      success: true,
      message: 'Account deleted successfully'
    })
  } catch (error: any) {
    console.error('❌ Delete account error:', error)
    res.status(500).json({ error: 'Failed to delete account' })
  }
}

/**
 * Get account statistics
 */
export const getAccountStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id

    // Get invoice stats
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('id, status, total_amount')
      .eq('user_id', userId)

    // Get client count
    const { count: clientCount } = await supabaseAdmin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get settlement stats
    const { data: settlements } = await supabaseAdmin
      .from('settlements')
      .select('net_amount, settlement_status')
      .eq('user_id', userId)

    const stats = {
      totalInvoices: invoices?.length || 0,
      totalClients: clientCount || 0,
      totalRevenue: invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0,
      settledAmount: settlements?.filter(s => s.settlement_status === 'settled')
        .reduce((sum, s) => sum + s.net_amount, 0) || 0,
      pendingSettlements: settlements?.filter(s => 
        ['pending', 'initiated', 'processed'].includes(s.settlement_status)
      ).length || 0
    }

    res.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    console.error('Get account stats error:', error)
    res.status(500).json({ error: 'Failed to fetch account statistics' })
  }
}
