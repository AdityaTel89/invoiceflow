// ==================== IMPORTS ====================
// NO dotenv here - loaded by index.ts
import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import clientRoutes from './routes/client.routes.js'
import invoiceRoutes from './routes/invoice.routes.js'
import webhookRoutes from './routes/webhooks.routes.js'
import profileRoutes from './routes/profile.routes.js'
import linkedAccountRoutes from './routes/linkedAccount.routes.js'
import settlementRoutes from './routes/settlement.routes.js'
import adminRoutes from './routes/admin.routes.js'

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))

// ⚠️ Webhooks MUST come before express.json() to get raw body
app.use('/api/webhooks', webhookRoutes)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
    next()
  })
}

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/linked-account', linkedAccountRoutes)
app.use('/api/settlements', settlementRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/profile', profileRoutes)

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  })
})

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server error:', err)
  
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  res.status(err.status || 500).json({ 
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  })
})

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 InvoiceFlow Server Started')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📍 Server URL: http://localhost:${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🗄️  Database: Supabase (Connected)`)
  console.log(`💳 Razorpay: ${process.env.RAZORPAY_ROUTE_ENABLED === 'true' ? 'ENABLED' : 'DISABLED'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('Available Routes:')
  console.log('  AUTH:')
  console.log('    POST   /api/auth/register')
  console.log('    POST   /api/auth/login')
  console.log('    GET    /api/auth/me')
  console.log('  ADMIN:')
  console.log('    GET    /api/admin/stats')
  console.log('    GET    /api/admin/pending-kyc')
  console.log('    GET    /api/admin/users')
  console.log('    GET    /api/admin/audit-logs')
  console.log('  USER:')
  console.log('    GET    /api/dashboard/stats')
  console.log('    GET    /api/clients')
  console.log('    GET    /api/invoices')
  console.log('  HEALTH:')
  console.log('    GET    /health')
  console.log('\n✅ Server is ready to accept connections!\n')
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...')
  process.exit(0)
})

export default app
