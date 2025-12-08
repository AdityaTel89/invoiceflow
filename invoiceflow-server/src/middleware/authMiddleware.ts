import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../config/supabase.config.js'

interface JwtPayload {
  userId: string
}

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    businessName: string
    isAdmin?: boolean
  }
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7)

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload

    // Fetch user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, business_name, is_admin, is_active')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
      console.log('❌ User not found for token:', decoded.userId)
      res.status(401).json({ error: 'User not found' })
      return
    }

    // Check if user is active
    if (!user.is_active) {
      res.status(403).json({ error: 'Account is deactivated' })
      return
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      businessName: user.business_name,
      isAdmin: user.is_admin || false
    }
    
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('❌ Invalid token:', error.message)
      res.status(401).json({ error: 'Invalid token' })
    } else if (error instanceof jwt.TokenExpiredError) {
      console.error('❌ Token expired:', error.message)
      res.status(401).json({ error: 'Token expired' })
    } else {
      console.error('❌ Auth middleware error:', error)
      res.status(401).json({ error: 'Authentication failed' })
    }
  }
}
