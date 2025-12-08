export interface UserProfile {
  id: string
  email: string
  businessName: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  kycStatus: string
  linkedAccountId: string | null
  createdAt: string
}

export interface AccountStats {
  totalInvoices: number
  totalClients: number
  totalRevenue: number
  settledAmount: number
  pendingSettlements: number
}
