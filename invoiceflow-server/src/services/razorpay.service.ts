// backend/src/services/razorpay.service.ts
import Razorpay from 'razorpay'
import crypto from 'crypto'

export class RazorpayService {
  private razorpay: Razorpay

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
  }

  // Create Payment Link for Invoice
  async createPaymentLink(params: {
    amount: number
    invoiceNumber: string
    customerName: string
    customerEmail: string
    customerPhone?: string
    description: string
    invoiceId: string
  }) {
    try {
      const paymentLink = await this.razorpay.paymentLink.create({
        amount: Math.round(params.amount * 100), // Convert to paise (round to avoid decimals)
        currency: 'INR',
        description: params.description,
        customer: {
          name: params.customerName,
          email: params.customerEmail,
          contact: params.customerPhone || '',
        },
        notify: {
  sms: false,
  email: false, // Let Mailgun handle emails
},
reminder_enable: false,
        notes: {
          invoice_id: params.invoiceId,
          invoice_number: params.invoiceNumber,
        },
        // callback_url: `${process.env.FRONTEND_URL}/invoices/${params.invoiceId}/payment-success`,
        // callback_method: 'get',
      })

      console.log('✅ Razorpay payment link created:', paymentLink.id)

      return {
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink.short_url,
        orderId: (paymentLink as any).order_id || paymentLink.id, // Fallback to payment link ID
      }
    } catch (error: any) {
      console.error('❌ Razorpay Payment Link Error:', error)
      throw new Error(`Razorpay Error: ${error.message || 'Failed to create payment link'}`)
    }
  }

  // Verify Webhook Signature
  verifyWebhookSignature(
    webhookBody: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(webhookBody)
        .digest('hex')

      return expectedSignature === signature
    } catch (error) {
      console.error('❌ Signature verification error:', error)
      return false
    }
  }

  // Verify Payment Signature (for frontend verification)
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${orderId}|${paymentId}`)
        .digest('hex')

      return generatedSignature === signature
    } catch (error) {
      console.error('❌ Payment signature verification error:', error)
      return false
    }
  }

  // Fetch Payment Details
  async getPaymentDetails(paymentId: string) {
    try {
      return await this.razorpay.payments.fetch(paymentId)
    } catch (error: any) {
      console.error('❌ Fetch payment error:', error)
      throw new Error('Failed to fetch payment details')
    }
  }

  // Fetch Payment Link Details
  async getPaymentLinkDetails(paymentLinkId: string) {
    try {
      return await this.razorpay.paymentLink.fetch(paymentLinkId)
    } catch (error: any) {
      console.error('❌ Fetch payment link error:', error)
      throw new Error('Failed to fetch payment link details')
    }
  }
}

export default new RazorpayService()
