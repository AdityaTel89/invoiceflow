export interface UpdateProfileRequest {
  businessName?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

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
