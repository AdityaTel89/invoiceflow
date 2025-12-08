import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import {
  calculateSettlement,
  getUserSettlements,
  getSettlementByInvoice
} from '../controllers/settlement.controller.js'

const router = express.Router()

// POST /api/settlements/calculate
router.post('/calculate', authMiddleware, calculateSettlement)

// GET /api/settlements
router.get('/', authMiddleware, getUserSettlements)

// GET /api/settlements/invoice/:invoiceId
router.get('/invoice/:invoiceId', authMiddleware, getSettlementByInvoice)

export default router
