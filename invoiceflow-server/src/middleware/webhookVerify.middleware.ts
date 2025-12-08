import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

export const verifyRazorpayWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string
    const webhookBody = req.body.toString()

    if (!signature) {
      console.error('❌ Missing webhook signature')
      return res.status(400).json({ error: 'Missing signature' })
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(webhookBody)
      .digest('hex')

    if (expectedSignature !== signature) {
      console.error('❌ Invalid webhook signature')
      return res.status(400).json({ error: 'Invalid signature' })
    }

    console.log('✅ Webhook signature verified')
    next()
  } catch (error) {
    console.error('❌ Webhook verification error:', error)
    res.status(500).json({ error: 'Webhook verification failed' })
  }
}
