import { Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase.config.js'
import type { AuthRequest } from './authMiddleware.js'

export const rateLimitMiddleware = (action: string, maxAttempts: number = 5, windowHours: number = 24) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id

      if (!userId) {
        console.error('❌ Rate limit check failed: No user ID found')
        return res.status(401).json({ error: 'Unauthorized - Please login first' })
      }

      console.log('🔍 Checking rate limit:', { userId, action, maxAttempts, windowHours })

      // Call Supabase rate limit function with user_id from auth context
      const { data: isAllowed, error } = await supabaseAdmin.rpc('check_rate_limit', {
        p_user_id: userId,  // ✅ Add user_id parameter
        p_action: action,
        p_max_attempts: maxAttempts,
        p_window_hours: windowHours
      } as any)

      if (error) {
        console.error('Rate limit check error:', error)
        // Allow request to proceed on rate limit check failure
        return next()
      }

      if (!isAllowed) {
        return res.status(429).json({
          error: `Rate limit exceeded. Maximum ${maxAttempts} ${action} attempts allowed per ${windowHours} hours.`,
          retryAfter: windowHours * 3600 // seconds
        })
      }

      next()
    } catch (error) {
      console.error('Rate limit middleware error:', error)
      // Allow request to proceed on error
      next()
    }
  }
}
