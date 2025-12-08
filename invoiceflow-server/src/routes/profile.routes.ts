import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware.js'
import { auditMiddleware } from '../middleware/audit.middleware.js'
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getAccountStats
} from '../controllers/profile.controller.js'

const router = express.Router()

// All routes require authentication
router.use(authMiddleware)

// GET /api/profile - Get user profile
router.get('/', getProfile)

// PUT /api/profile - Update user profile
router.put(
  '/',
  rateLimitMiddleware('profile_update', 10, 1), // 10 updates per hour
  auditMiddleware('profile_update', 'user'),
  updateProfile
)

// PUT /api/profile/change-password - Change password
router.put(
  '/change-password',
  rateLimitMiddleware('password_change', 5, 24), // 5 attempts per day
  auditMiddleware('password_change', 'user'),
  changePassword
)

// DELETE /api/profile - Delete account
router.delete(
  '/',
  rateLimitMiddleware('account_delete', 3, 24), // 3 attempts per day
  auditMiddleware('account_delete', 'user'),
  deleteAccount
)

// GET /api/profile/stats - Get account statistics
router.get('/stats', getAccountStats)

export default router
