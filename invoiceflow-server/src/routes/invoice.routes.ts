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
  getInvoicePDFUrl 
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

// ✅ DEBUG: Log route registration
console.log('✅ Registered route: GET /:id/pdf-url -> getInvoicePDFUrl')

// List and CRUD routes
router.get('/', getInvoices)                  // Get all invoices
router.get('/:id', getInvoiceById)            // Get single invoice
router.post('/', createInvoice)               // Create invoice
router.put('/:id', updateInvoice)             // Update invoice
router.delete('/:id', deleteInvoice)          // Delete invoice
router.patch('/:id/status', updateInvoiceStatus) // Update status

export default router
