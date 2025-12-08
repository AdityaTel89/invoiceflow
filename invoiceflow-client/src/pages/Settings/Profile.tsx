import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import SettingsLayout from '../../components/settings/SettingsLayout'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import profileService from '../../services/profile.service' // ✅ Add this import
import type { UserProfile } from '../../types/profile.types' // ✅ Add this import

interface ProfileData {
  email: string
  businessName: string
  phone: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface PasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null) // ✅ Add this state
    const toast = useToast()
  const [profileData, setProfileData] = useState<ProfileData>({
    email: user?.email || '',
    businessName: user?.businessName || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  })

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const data = await profileService.getProfile()
      setProfile(data)
      setProfileData({
        email: data.email,
        businessName: data.businessName,
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        postalCode: data.postalCode || '',
        country: data.country || 'India'
      })
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile data' })
    } finally {
      setLoading(false)
    }
  }

  const validateProfile = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!profileData.businessName) {
      newErrors.businessName = 'Business name is required'
    }

    if (profileData.phone && !/^[6-9]\d{9}$/.test(profileData.phone)) {
      newErrors.phone = 'Invalid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePassword = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateProfile()) return

    try {
      setLoading(true)
      await profileService.updateProfile({
        businessName: profileData.businessName,
        phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        postalCode: profileData.postalCode,
        country: profileData.country
      })
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      await fetchProfileData() // Refresh data
      setTimeout(() => setMessage(null), 5000)
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update profile' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePassword()) return

    try {
      setLoading(true)
      await profileService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setTimeout(() => setMessage(null), 5000)
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to change password' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Rest of the JSX remains the same...
  return (
    <SettingsLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Success/Error Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg p-4 ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex gap-3">
                {message.type === 'success' ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </motion.div>
          )}

          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-soft p-6"
          >
            <div className="flex items-center gap-3 pb-4 border-b mb-6">
              <div className="p-2 bg-violet-blue-50 rounded-lg">
                <UserCircleIcon className="w-6 h-6 text-violet-blue" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                <p className="text-sm text-gray-500">Update your account details</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="w-4 h-4" />
                    Email Address
                  </div>
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    Business Name
                  </div>
                </label>
                <input
                  type="text"
                  value={profileData.businessName}
                  onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all ${
                    errors.businessName ? 'border-fiery-rose' : 'border-gray-300'
                  }`}
                  placeholder="Your business name"
                />
                {errors.businessName && (
                  <p className="mt-1 text-sm text-fiery-rose">{errors.businessName}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="w-4 h-4" />
                    Phone Number
                  </div>
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value.replace(/\D/g, '') })}
                  maxLength={10}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all ${
                    errors.phone ? 'border-fiery-rose' : 'border-gray-300'
                  }`}
                  placeholder="10-digit mobile number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-fiery-rose">{errors.phone}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4" />
                    Address
                  </div>
                </label>
                <textarea
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all"
                  placeholder="Street address"
                />
              </div>

              {/* City, State, Postal Code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={profileData.state}
                    onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={profileData.postalCode}
                    onChange={(e) => setProfileData({ ...profileData, postalCode: e.target.value.replace(/\D/g, '') })}
                    maxLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all"
                    placeholder="PIN Code"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className={`px-6 py-3 rounded-lg font-medium text-white shadow-medium transition-all ${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'gradient-violet hover:shadow-strong'
                  }`}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* Change Password Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-soft p-6"
          >
            <div className="flex items-center gap-3 pb-4 border-b mb-6">
              <div className="p-2 bg-orange-50 rounded-lg">
                <KeyIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-500">Update your account password</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all ${
                    errors.currentPassword ? 'border-fiery-rose' : 'border-gray-300'
                  }`}
                  placeholder="Enter current password"
                />
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-fiery-rose">{errors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all ${
                    errors.newPassword ? 'border-fiery-rose' : 'border-gray-300'
                  }`}
                  placeholder="Enter new password"
                />
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-fiery-rose">{errors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue transition-all ${
                    errors.confirmPassword ? 'border-fiery-rose' : 'border-gray-300'
                  }`}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-fiery-rose">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• At least 8 characters long</li>
                  <li>• Contains uppercase and lowercase letters</li>
                  <li>• Contains at least one number</li>
                  <li>• Contains at least one special character</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className={`px-6 py-3 rounded-lg font-medium text-white shadow-medium transition-all ${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 hover:shadow-strong'
                  }`}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Summary */}
          <div className="bg-white rounded-lg shadow-soft p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full gradient-violet flex items-center justify-center text-white text-2xl font-bold">
                  {profileData.businessName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{profileData.businessName}</p>
                  <p className="text-sm text-gray-500">{profileData.email}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Type:</span>
                    <span className="font-medium text-gray-900">Business</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since:</span>
                    <span className="font-medium text-gray-900">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric'
                      }) : 'Dec 2025'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-900 mb-2">🔒 Security Tips</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Use a strong, unique password</li>
              <li>• Change your password regularly</li>
              <li>• Never share your credentials</li>
              <li>• Enable two-factor authentication (coming soon)</li>
            </ul>
          </div>

          {/* Need Help */}
          <div className="bg-white rounded-lg shadow-soft p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Contact our support team for any account-related queries.
            </p>
            <button className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </SettingsLayout>
  )
}
