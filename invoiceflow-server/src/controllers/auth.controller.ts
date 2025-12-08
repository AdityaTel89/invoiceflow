import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../config/supabase.config.js'
import type { AuthRequest } from '../middleware/authMiddleware.js'

interface User {
  id: string
  email: string
  business_name: string
  gstin?: string
  address?: string
  is_admin?: boolean
  kyc_status?: string
  linked_account_id?: string | null
}

const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  )
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, businessName, gstin, address } = req.body

    console.log('=== REGISTRATION REQUEST ===')
    console.log('Email:', email)
    console.log('Business Name:', businessName)

    // Validate required fields
    if (!email || !password || !businessName) {
      res.status(400).json({ error: 'Email, password, and business name are required' })
      return
    }

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      console.log('❌ Email already registered:', email)
      res.status(400).json({ error: 'Email already registered' })
      return
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        business_name: businessName,
        gstin: gstin || null,
        address: address || null,
        is_admin: false, // New users are not admins by default
        kyc_status: 'not_started',
        is_active: true
      })
      .select('id, email, business_name, gstin, address, is_admin, kyc_status, linked_account_id, created_at')
      .single()

    if (error) {
      console.error('❌ Supabase insert error:', error)
      res.status(500).json({ error: 'Registration failed' })
      return
    }

    const token = generateToken(user.id)

    console.log('✅ User registered successfully:', user.id)

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        businessName: user.business_name,
        gstin: user.gstin,
        address: user.address,
        isAdmin: user.is_admin || false,
        kycStatus: user.kyc_status,
        linkedAccountId: user.linked_account_id
      },
      token
    })
  } catch (error) {
    console.error('❌ Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    console.log('=== LOGIN REQUEST ===')
    console.log('Email:', email)

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    // Find user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, business_name, password_hash, gstin, address, is_admin, is_active, kyc_status, linked_account_id')
      .eq('email', email)
      .single()

    if (error || !user) {
      console.log('❌ User not found:', email)
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Check if user is active
    if (!user.is_active) {
      console.log('❌ User account is deactivated:', email)
      res.status(403).json({ error: 'Account is deactivated. Please contact support.' })
      return
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email)
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Update last login time
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() } as any)
      .eq('id', user.id)

    const token = generateToken(user.id)

    console.log('✅ User logged in successfully:', user.id)
    console.log('   Is Admin:', user.is_admin || false)

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        businessName: user.business_name,
        gstin: user.gstin,
        address: user.address,
        isAdmin: user.is_admin || false,
        kycStatus: user.kyc_status,
        linkedAccountId: user.linked_account_id
      },
      token
    })
  } catch (error) {
    console.error('❌ Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
}

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, business_name, gstin, address, is_admin, kyc_status, linked_account_id, phone, created_at')
      .eq('id', req.user!.id)
      .single()

    if (error || !user) {
      console.log('❌ User not found:', req.user!.id)
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        businessName: user.business_name,
        gstin: user.gstin,
        address: user.address,
        phone: user.phone,
        isAdmin: user.is_admin || false,
        kycStatus: user.kyc_status,
        linkedAccountId: user.linked_account_id,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    console.error('❌ Get user error:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
}

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Logout successful' })
}

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const { currentPassword, newPassword } = req.body

    console.log('=== CHANGE PASSWORD REQUEST ===')
    console.log('User ID:', userId)

    // Validate required fields
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' })
      return
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' })
      return
    }

    // Get user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single()

    if (error || !user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)

    if (!isPasswordValid) {
      console.log('❌ Invalid current password')
      res.status(401).json({ error: 'Current password is incorrect' })
      return
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Password update error:', updateError)
      res.status(500).json({ error: 'Failed to update password' })
      return
    }

    console.log('✅ Password changed successfully')

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('❌ Change password error:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
}

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id

    // Generate new token
    const token = generateToken(userId)

    res.json({
      success: true,
      token
    })
  } catch (error) {
    console.error('❌ Refresh token error:', error)
    res.status(500).json({ error: 'Failed to refresh token' })
  }
}

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body

    // TODO: Implement email verification logic
    // For now, just return success

    res.json({
      success: true,
      message: 'Email verified successfully'
    })
  } catch (error) {
    console.error('❌ Email verification error:', error)
    res.status(500).json({ error: 'Email verification failed' })
  }
}

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body

    console.log('=== FORGOT PASSWORD REQUEST ===')
    console.log('Email:', email)

    // Check if user exists
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    // Always return success (don't reveal if email exists)
    res.json({
      success: true,
      message: 'If an account with that email exists, we sent a password reset link.'
    })

    // TODO: Send password reset email
    if (user) {
      console.log('✅ Password reset email would be sent to:', email)
      // Implement email sending logic here
    }
  } catch (error) {
    console.error('❌ Forgot password error:', error)
    res.status(500).json({ error: 'Failed to process forgot password request' })
  }
}

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body

    console.log('=== RESET PASSWORD REQUEST ===')

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' })
      return
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' })
      return
    }

    // TODO: Verify reset token
    // For now, just return error
    res.status(400).json({ error: 'Invalid or expired reset token' })
  } catch (error) {
    console.error('❌ Reset password error:', error)
    res.status(500).json({ error: 'Failed to reset password' })
  }
}
