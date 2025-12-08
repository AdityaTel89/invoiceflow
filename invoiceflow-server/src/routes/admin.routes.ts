import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { adminOnlyMiddleware } from '../middleware/adminOnly.middleware.js'
import {
  getPendingKYC,
  verifyDocument,
  getAuditLogs,
  getAdminStats,
  approveKYC,
  rejectKYC,
  getAllUsers,
  toggleUserStatus
} from '../controllers/admin.controller.js'

const router = express.Router()

// All admin routes require authentication + admin role
router.use(authMiddleware)
router.use(adminOnlyMiddleware)

// Dashboard stats
router.get('/stats', getAdminStats)

// KYC Management
router.get('/pending-kyc', getPendingKYC)
router.patch('/kyc/:userId/approve', approveKYC)
router.patch('/kyc/:userId/reject', rejectKYC)
router.patch('/verify-document/:documentId', verifyDocument)

// User Management
router.get('/users', getAllUsers)
router.patch('/users/:userId/status', toggleUserStatus)

// Audit Logs
router.get('/audit-logs', getAuditLogs)

export default router
