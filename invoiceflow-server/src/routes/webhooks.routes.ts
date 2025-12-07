// backend/src/routes/webhooks.routes.ts
import express, { Request, Response } from 'express'
import razorpayService from '../services/razorpay.service.js'
import emailService from '../services/email.service.js'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

// POST /api/webhooks/razorpay
router.post('/razorpay', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'] as string
    const webhookBody = req.body.toString()

    console.log('=== RAZORPAY WEBHOOK RECEIVED ===')

    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(
      webhookBody,
      webhookSignature,
      process.env.RAZORPAY_WEBHOOK_SECRET!
    )

    if (!isValid) {
      console.error('❌ Invalid webhook signature')
      return res.status(400).json({ error: 'Invalid signature' })
    }

    const event = JSON.parse(webhookBody)
    const { event: eventType, payload } = event

    console.log('🔔 Webhook event type:', eventType)

    // Handle payment.captured event
    if (eventType === 'payment.captured') {
      const payment = payload.payment.entity
      const invoiceId = payment.notes?.invoice_id

      if (!invoiceId) {
        console.error('❌ No invoice_id in payment notes')
        return res.status(400).json({ error: 'Invoice ID not found' })
      }

      console.log('💳 Payment captured for invoice:', invoiceId)

      // Update invoice status to paid
      const { data: updatedInvoice, error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
          razorpay_payment_id: payment.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select(`
          *,
          client:clients(id, name, email)
        `)
        .single()

      if (updateError) {
        console.error('❌ Error updating invoice:', updateError)
        return res.status(500).json({ error: 'Failed to update invoice' })
      }

      if (!updatedInvoice) {
        console.error('❌ Invoice not found:', invoiceId)
        return res.status(404).json({ error: 'Invoice not found' })
      }

      console.log('✅ Invoice status updated to paid')

      // Get client details if not included in select
      if (updatedInvoice.client && updatedInvoice.client.email) {
        const client = updatedInvoice.client

        try {
          // Send payment confirmation email via Mailgun
          await emailService.sendPaymentConfirmation({
            to: client.email,
            customerName: client.name,
            invoiceNumber: updatedInvoice.invoice_number,
            amount: parseFloat(updatedInvoice.total_amount),
            paymentId: payment.id,
            paidDate: new Date(updatedInvoice.paid_date).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
          })

          console.log('✅ Payment confirmation email sent to:', client.email)
        } catch (emailError) {
          console.error('❌ Error sending confirmation email:', emailError)
          // Don't fail the webhook if email fails
        }
      }

      console.log('=== WEBHOOK PROCESSED SUCCESSFULLY ===')
    }

    // Handle payment_link.paid event (alternative to payment.captured)
    else if (eventType === 'payment_link.paid') {
      const paymentLinkData = payload.payment_link.entity
      const invoiceId = paymentLinkData.notes?.invoice_id

      if (!invoiceId) {
        console.error('❌ No invoice_id in payment link notes')
        return res.status(400).json({ error: 'Invoice ID not found' })
      }

      console.log('🔗 Payment link paid for invoice:', invoiceId)

      // Update invoice status
      const { data: updatedInvoice, error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select(`
          *,
          client:clients(id, name, email)
        `)
        .single()

      if (!updateError && updatedInvoice && updatedInvoice.client) {
        try {
          await emailService.sendPaymentConfirmation({
            to: updatedInvoice.client.email,
            customerName: updatedInvoice.client.name,
            invoiceNumber: updatedInvoice.invoice_number,
            amount: parseFloat(updatedInvoice.total_amount),
            paymentId: paymentLinkData.id,
            paidDate: new Date().toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
          })

          console.log('✅ Payment confirmation email sent')
        } catch (emailError) {
          console.error('❌ Error sending email:', emailError)
        }
      }
    }

    // Handle payment.failed event
    else if (eventType === 'payment.failed') {
      const payment = payload.payment.entity
      const invoiceId = payment.notes?.invoice_id

      if (invoiceId) {
        console.log('❌ Payment failed for invoice:', invoiceId)
        // You can add logic to notify user about failed payment
      }
    }

    res.json({ status: 'ok', event: eventType })
  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error.message 
    })
  }
})

// Health check endpoint
router.get('/razorpay/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Razorpay webhook endpoint is active' })
})

export default router
