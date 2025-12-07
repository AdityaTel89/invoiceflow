// backend/src/routes/dashboard.routes.ts
import express, { Response } from 'express'
import { supabase } from '../lib/supabase.js'
import type { AuthRequest } from '../middleware/authMiddleware.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

// Apply authentication middleware
router.use(authMiddleware)

// GET /api/dashboard/stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    console.log('=== DASHBOARD STATS REQUEST ===')
    console.log('User ID:', userId)

    // Get all invoices for the user
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('status, total_amount, invoice_date, paid_date, due_date')
      .eq('user_id', userId)

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch invoice stats' 
      })
    }

    console.log('Fetched invoices:', invoices?.length || 0)

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Calculate stats
    const stats = {
      // Total invoices count
      totalInvoices: invoices?.length || 0,

      // Status breakdown
      draft: invoices?.filter(inv => inv.status === 'draft').length || 0,
      sent: invoices?.filter(inv => inv.status === 'sent').length || 0,
      paid: invoices?.filter(inv => inv.status === 'paid').length || 0,
      overdue: invoices?.filter(inv => {
        if (inv.status === 'paid' || inv.status === 'cancelled') return false
        const dueDate = new Date(inv.due_date)
        return dueDate < now
      }).length || 0,
      cancelled: invoices?.filter(inv => inv.status === 'cancelled').length || 0,

      // Revenue calculations
      totalRevenue: invoices?.reduce((sum, inv) => {
        return sum + parseFloat(inv.total_amount || '0')
      }, 0) || 0,

      paidRevenue: invoices
        ?.filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0) || 0,

      pendingPayments: invoices
        ?.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0) || 0,

      overdueAmount: invoices
        ?.filter(inv => {
          if (inv.status === 'paid' || inv.status === 'cancelled') return false
          const dueDate = new Date(inv.due_date)
          return dueDate < now
        })
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0) || 0,

      // This month stats
      thisMonthInvoices: invoices
        ?.filter(inv => {
          const invDate = new Date(inv.invoice_date)
          return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear
        }).length || 0,

      thisMonthRevenue: invoices
        ?.filter(inv => {
          const invDate = new Date(inv.invoice_date)
          return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear
        })
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0) || 0,

      paidThisMonth: invoices
        ?.filter(inv => {
          if (!inv.paid_date) return false
          const paidDate = new Date(inv.paid_date)
          return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear
        })
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0) || 0,
    }

    console.log('Calculated stats:', stats)

    res.json({
      success: true,
      stats
    })
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard stats',
      details: error.message 
    })
  }
})

// GET /api/dashboard/recent-invoices
router.get('/recent-invoices', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const limit = parseInt(req.query.limit as string) || 5

    console.log('=== RECENT INVOICES REQUEST ===')
    console.log('User ID:', userId)
    console.log('Limit:', limit)

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        due_date,
        total_amount,
        status,
        paid_date,
        client:clients(id, name, email)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent invoices:', error)
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch recent invoices' 
      })
    }

    console.log('Fetched recent invoices:', invoices?.length || 0)

    res.json({
      success: true,
      invoices: invoices || []
    })
  } catch (error: any) {
    console.error('Recent invoices error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch recent invoices',
      details: error.message 
    })
  }
})

// GET /api/dashboard/charts-data
router.get('/charts-data', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    // Get last 6 months of data
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('invoice_date, total_amount, status, paid_date')
      .eq('user_id', userId)
      .gte('invoice_date', sixMonthsAgo.toISOString().split('T')[0])
      .order('invoice_date', { ascending: true })

    if (error) {
      console.error('Error fetching chart data:', error)
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch chart data' 
      })
    }

    // Group by month
    const monthlyData = new Map()

    invoices?.forEach(invoice => {
      const date = new Date(invoice.invoice_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          totalInvoices: 0,
          totalRevenue: 0,
          paidRevenue: 0,
          pendingRevenue: 0
        })
      }

      const data = monthlyData.get(monthKey)
      const amount = parseFloat(invoice.total_amount || '0')
      
      data.totalInvoices++
      data.totalRevenue += amount

      if (invoice.status === 'paid') {
        data.paidRevenue += amount
      } else if (invoice.status !== 'cancelled') {
        data.pendingRevenue += amount
      }
    })

    const chartData = Array.from(monthlyData.values())

    res.json({
      success: true,
      chartData
    })
  } catch (error: any) {
    console.error('Chart data error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch chart data',
      details: error.message 
    })
  }
})

export default router
