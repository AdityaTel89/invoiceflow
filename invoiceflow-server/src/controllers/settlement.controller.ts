import type { Response } from 'express'
import type { AuthRequest } from '../middleware/authMiddleware.js'
import settlementService from '../services/settlement.service.js'

export const calculateSettlement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceAmount, commissionRate } = req.body

    if (!invoiceAmount || invoiceAmount <= 0) {
      res.status(400).json({ error: 'Invalid invoice amount' })
      return
    }

    const breakdown = await settlementService.calculateSettlement(
      invoiceAmount,
      commissionRate || 0
    )

    res.json({
      success: true,
      data: breakdown
    })
  } catch (error: any) {
    console.error('Calculate settlement error:', error)
    res.status(500).json({ error: 'Failed to calculate settlement' })
  }
}

export const getUserSettlements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const limit = parseInt(req.query.limit as string) || 50

    const settlements = await settlementService.getUserSettlements(userId, limit)

    res.json({
      success: true,
      data: settlements
    })
  } catch (error: any) {
    console.error('Get settlements error:', error)
    res.status(500).json({ error: 'Failed to fetch settlements' })
  }
}

export const getSettlementByInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId } = req.params

    const settlement = await settlementService.getSettlementByInvoice(invoiceId)

    if (!settlement) {
      res.status(404).json({ error: 'Settlement not found' })
      return
    }

    res.json({
      success: true,
      data: settlement
    })
  } catch (error: any) {
    console.error('Get settlement error:', error)
    res.status(500).json({ error: 'Failed to fetch settlement' })
  }
}
