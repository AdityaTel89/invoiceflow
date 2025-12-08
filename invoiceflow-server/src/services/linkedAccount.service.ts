import Razorpay from 'razorpay'
import crypto from 'crypto'
import { supabaseAdmin } from '../config/supabase.config.js'

const RAZORPAY_ROUTE_ENABLED = process.env.RAZORPAY_ROUTE_ENABLED === 'true'

interface CreateLinkedAccountParams {
  userId: string
  email: string
  phone: string
  businessName: string
  businessType: string
  pan: string
  gstin: string
  accountNumber: string
  ifscCode: string
  accountHolderName: string
  businessAddress: string
  ipAddress?: string
}

interface LinkedAccountResponse {
  id: string
  status: string
  email?: string
  phone?: string
  legal_business_name?: string
  business_type?: string
  activated_at?: number
  [key: string]: any
}

interface RazorpayAccount {
  id: string
  status: string
  activated_at?: number
}

class LinkedAccountService {
  private razorpay: Razorpay | null = null

  constructor() {
    if (RAZORPAY_ROUTE_ENABLED && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      })
      console.log('✅ Razorpay Route: ENABLED')
    } else {
      console.log('⚠️  Razorpay Route: DISABLED (Development Mode)')
    }
  }

  /**
   * Create Razorpay linked account
   */
  async createLinkedAccount(params: CreateLinkedAccountParams): Promise<LinkedAccountResponse> {
    const {
      userId,
      email,
      phone,
      businessName,
      businessType,
      pan,
      gstin,
      accountNumber,
      ifscCode,
      accountHolderName,
      businessAddress
    } = params

    // ✅ DEVELOPMENT MODE - Mock Razorpay Response
    if (!RAZORPAY_ROUTE_ENABLED || !this.razorpay) {
      console.log('🧪 DEV MODE: Creating mock linked account...')
      
      const mockAccountId = `acc_mock_${crypto.randomBytes(8).toString('hex')}`
      
      return {
        id: mockAccountId,
        status: 'created',
        email,
        phone,
        legal_business_name: businessName,
        business_type: businessType,
        profile: {
          category: 'services',
          subcategory: 'consulting',
          addresses: {
            registered: {
              street: businessAddress,
              city: 'Bangalore',
              state: 'Karnataka',
              postal_code: '560001',
              country: 'IN'
            }
          }
        },
        legal_info: {
          pan,
          gst: gstin
        },
        bank_account: {
          ifsc_code: ifscCode,
          account_number: accountNumber.slice(-4), // Only last 4 digits
          beneficiary_name: accountHolderName
        },
        notes: {
          user_id: userId,
          environment: 'development'
        }
      }
    }

    // ✅ PRODUCTION MODE - Real Razorpay API
    try {
      console.log('Creating Razorpay linked account...')

      const accountData: any = {
        email,
        phone,
        legal_business_name: businessName,
        business_type: businessType,
        contact_name: accountHolderName,
        profile: {
          category: 'services',
          subcategory: 'consulting',
          addresses: {
            registered: {
              street1: businessAddress,
              street2: '',
              city: 'Bangalore',
              state: 'Karnataka',
              postal_code: '560001',
              country: 'IN'
            }
          }
        },
        legal_info: {
          pan,
          gst: gstin
        },
        bank_account: {
          ifsc_code: ifscCode,
          account_number: accountNumber,
          beneficiary_name: accountHolderName
        },
        notes: {
          user_id: userId
        }
      }

      const response = await this.razorpay.accounts.create(accountData) as LinkedAccountResponse
      console.log('✅ Razorpay linked account created:', response.id)
      return response
    } catch (error: any) {
      console.error('❌ Razorpay linked account error:', error)
      throw new Error(`Failed to create linked account: ${error.error?.description || error.message}`)
    }
  }

  /**
   * Sync KYC status from Razorpay
   */
  async syncKYCStatus(userId: string, accountId: string): Promise<{ kycStatus: string; account: RazorpayAccount }> {
    // ✅ DEVELOPMENT MODE - Mock Status
    if (!RAZORPAY_ROUTE_ENABLED || !this.razorpay) {
      console.log('🧪 DEV MODE: Mocking KYC status sync...')
      
      return {
        kycStatus: 'submitted',
        account: {
          id: accountId,
          status: 'created',
          activated_at: undefined
        }
      }
    }

    // ✅ PRODUCTION MODE - Real Razorpay API
    try {
      const account = await this.razorpay.accounts.fetch(accountId) as RazorpayAccount

      let kycStatus = 'submitted'
      if (account.status === 'activated') {
        kycStatus = 'verified'
      } else if (account.status === 'rejected') {
        kycStatus = 'rejected'
      } else if (account.status === 'under_review') {
        kycStatus = 'under_review'
      }

      // Update user KYC status in database
      if (kycStatus === 'verified') {
        await supabaseAdmin
          .from('users')
          .update({
            kyc_status: 'verified',
            kyc_verified_at: new Date().toISOString()
          } as any)
          .eq('id', userId)
      }

      return { kycStatus, account }
    } catch (error: any) {
      console.error('❌ Razorpay account fetch error:', error)
      throw new Error('Failed to sync KYC status')
    }
  }

  /**
   * Get account details
   */
  async getAccountDetails(accountId: string): Promise<RazorpayAccount> {
    if (!RAZORPAY_ROUTE_ENABLED || !this.razorpay) {
      return {
        id: accountId,
        status: 'created',
        activated_at: undefined
      }
    }

    return await this.razorpay.accounts.fetch(accountId) as RazorpayAccount
  }
}

export default new LinkedAccountService()
