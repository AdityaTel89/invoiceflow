import express from 'express'
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  getInvoiceStats,
  generatePDF,
  getInvoicePDFUrl,
  generatePaymentLink,
  sendInvoiceEmail,
  sendPaymentReminder
} from '../controllers/invoice.controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

// Apply authentication middleware to all routes
router.use(authMiddleware)

// ⚠️ IMPORTANT: Specific routes MUST come before parameterized routes

// Stats route (must be before /:id)
router.get('/stats', getInvoiceStats)

// PDF routes (must be before /:id)
router.get('/:id/pdf', generatePDF)           // Generate and download PDF
router.get('/:id/pdf-url', getInvoicePDFUrl)  // Get PDF URL

// 🆕 Razorpay Payment Link routes (must be before /:id)
router.post('/:id/payment-link', generatePaymentLink)  // Generate Razorpay payment link

// 🆕 Mailgun Email routes (must be before /:id)
router.post('/:id/send-email', sendInvoiceEmail)       // Send invoice via email with PDF
router.post('/:id/send-reminder', sendPaymentReminder) // Send payment reminder

// ✅ DEBUG: Log route registration
console.log('✅ Registered route: GET /:id/pdf-url -> getInvoicePDFUrl')
console.log('✅ Registered route: POST /:id/payment-link -> generatePaymentLink')
console.log('✅ Registered route: POST /:id/send-email -> sendInvoiceEmail')
console.log('✅ Registered route: POST /:id/send-reminder -> sendPaymentReminder')

// List and CRUD routes
router.get('/', getInvoices)                  // Get all invoices
router.get('/:id', getInvoiceById)            // Get single invoice
router.post('/', createInvoice)               // Create invoice
router.put('/:id', updateInvoice)             // Update invoice
router.delete('/:id', deleteInvoice)          // Delete invoice
router.patch('/:id/status', updateInvoiceStatus) // Update status

export default router
