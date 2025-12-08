import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  businessName: z.string().min(2, 'Business name is required'),
  gstin: z.string().optional(),
  address: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

export type LoginFormData = z.infer<typeof LoginSchema>
export type RegisterFormData = z.infer<typeof RegisterSchema>

export interface User {
  id: string
  email: string
  businessName: string
  isAdmin?: boolean
  kycStatus?: string
  linkedAccountId?: string | null
  gstin?: string | null
  address?: string | null
  phone?: string | null
  createdAt?: string
}

export interface AuthResponse {
  message: string
  user: User
  token: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  gstin?: string
  pan?: string
  createdAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  clientName?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issueDate: string
  dueDate: string
  subtotal: number
  tax: number
  totalAmount: number
  items: InvoiceItem[]
  notes?: string
  createdAt: string
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}
