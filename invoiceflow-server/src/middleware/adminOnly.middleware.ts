import { Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase.config.js'
import type { AuthRequest } from './authMiddleware.js'

export const adminOnlyMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check if user is admin using Supabase function
    const { data: isAdmin, error } = await supabaseAdmin.rpc('is_admin')

    if (error) {
      console.error('Admin check error:', error)
      return res.status(500).json({ error: 'Failed to verify admin status' })
    }

    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Forbidden: Admin access required',
        message: 'You do not have permission to access this resource'
      })
    }

    next()
  } catch (error) {
    console.error('Admin middleware error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
