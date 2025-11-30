import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../lib/supabase.js'

interface JwtPayload {
  userId: string
}

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    businessName: string
  }
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, business_name')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    req.user = {
      id: user.id,
      email: user.email,
      businessName: user.business_name
    }
    
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
}
