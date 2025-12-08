export type KYCStatus = 'not_started' | 'pending' | 'submitted' | 'under_review' | 'verified' | 'rejected'

export type BusinessType = 'proprietorship' | 'partnership' | 'private_limited' | 'public_limited' | 'llp' | 'trust' | 'society' | 'other'

export type DocumentType = 'pan' | 'gstin' | 'cancelled_cheque' | 'business_proof' | 'address_proof' | 'other'

export interface BusinessDetails {
  businessName: string
  gstin: string
  pan: string
  businessType: BusinessType
  businessAddress: string
}

export interface BankDetails {
  accountNumber: string
  confirmAccountNumber: string
  ifscCode: string
  accountHolderName: string
  bankName: string
  branch: string
}

export interface DocumentUpload {
  type: DocumentType
  file: File | null
  preview?: string
  uploaded?: boolean
  url?: string
}

export interface KYCFormData extends BusinessDetails, BankDetails {
  phone: string
  documents: DocumentUpload[]
}

export interface KYCStatusResponse {
  kycStatus: KYCStatus
  linkedAccountId?: string
  submittedAt?: string
  verifiedAt?: string
  rejectionReason?: string
  accountActive?: boolean
}
