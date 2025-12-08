import { Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase.config.js'
import type { AuthRequest } from './authMiddleware.js'

interface AuditLogParams {
  action: string
  entityType?: string
  entityId?: string
  requestData?: any
  responseData?: any
  status?: 'success' | 'failed' | 'error'
}

export const auditLog = async (
  userId: string | undefined,
  params: AuditLogParams
): Promise<void> => {
  try {
    if (!userId) {
      console.warn('⚠️ Audit log skipped: No user ID')
      return
    }

    await supabaseAdmin.rpc('log_audit', {
      p_user_id: userId,  // ✅ Add user_id parameter
      p_action: params.action,
      p_entity_type: params.entityType || null,
      p_entity_id: params.entityId || null,
      p_request_data: params.requestData || null,
      p_response_data: params.responseData || null,
      p_status: params.status || 'success'
    } as any)
  } catch (error) {
    console.error('Audit log error:', error)
    // Don't throw - audit failure shouldn't break the request
  }
}

export const auditMiddleware = (action: string, entityType?: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id
    const originalJson = res.json.bind(res)

    // Override res.json to capture response
    res.json = function (data: any) {
      const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'error'

      // Log audit after response
      auditLog(userId, {
        action,
        entityType,
        entityId: req.params.id || req.body.id,
        requestData: {
          body: req.body,
          params: req.params,
          query: req.query
        },
        responseData: data,
        status
      }).catch(err => console.error('Audit logging failed:', err))

      return originalJson(data)
    }

    next()
  }
}
