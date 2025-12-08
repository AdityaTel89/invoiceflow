import express from 'express'
import multer from 'multer'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware.js'
import { auditMiddleware } from '../middleware/audit.middleware.js'
import {
  createLinkedAccount,
  getKYCStatus
} from '../controllers/linkedAccount.controller.js'

const router = express.Router()

// ✅ FIX: Proper multer types
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, PDF allowed.'))
    }
  }
})

// POST /api/linked-account/create
router.post(
  '/create',
  authMiddleware,
  rateLimitMiddleware('kyc_submission', 5, 24),
  upload.array('documents', 4), // Max 4 documents
  auditMiddleware('kyc_submission', 'linked_account'),
  createLinkedAccount
)

// GET /api/linked-account/status
router.get('/status', authMiddleware, getKYCStatus)

export default router
