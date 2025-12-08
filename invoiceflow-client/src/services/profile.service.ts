import api from './api'
import type { UserProfile } from '../types/profile.types'

export interface UpdateProfileData {
  businessName?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export const profileService = {
  // Get user profile
  async getProfile(): Promise<UserProfile> {
    const response = await api.get('/profile')
    return response.data.data
  },

  // Update profile
  async updateProfile(data: UpdateProfileData) {
    const response = await api.put('/profile', data)
    return response.data
  },

  // Change password
  async changePassword(data: ChangePasswordData) {
    const response = await api.put('/profile/change-password', data)
    return response.data
  },

  // Delete account
  async deleteAccount(password: string) {
    const response = await api.delete('/profile', {
      data: { password }
    })
    return response.data
  },

  // Get account stats
  async getAccountStats() {
    const response = await api.get('/profile/stats')
    return response.data.data
  }
}

export default profileService
