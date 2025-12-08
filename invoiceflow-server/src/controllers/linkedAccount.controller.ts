import type { Response } from 'express'
import type { AuthRequest } from '../middleware/authMiddleware.js'
import linkedAccountService from '../services/linkedAccount.service.js'
import supabaseService from '../services/supabase.service.js'
import { uploadKYCDocument } from '../services/cloudinary.service.js'
import { supabaseAdmin } from '../config/supabase.config.js'
import { auditLog } from '../middleware/audit.middleware.js'
import {
  validateGSTIN,
  validatePAN,
  validateIFSC,
  validateBankAccount,
  extractPANFromGSTIN,
  validateBusinessType,
  validatePhone
} from '../utils/validators.js'

export const createLinkedAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const {
      businessName,
      gstin,
      pan,
      businessType,
      businessAddress,
      accountNumber,
      confirmAccountNumber,
      ifscCode,
      accountHolderName,
      bankName,
      branch,
      phone
    } = req.body

    // ✅ FIX: Proper file access
    const files = (req.files as Express.Multer.File[]) || []

    console.log('=== KYC SUBMISSION START ===')
    console.log('User ID:', userId)
    console.log('Business Name:', businessName)

    // VALIDATION
    const errors: string[] = []

    if (!validateGSTIN(gstin)) {
      errors.push('Invalid GSTIN format')
    }

    if (!validatePAN(pan)) {
      errors.push('Invalid PAN format')
    }

    const gstinPAN = extractPANFromGSTIN(gstin)
    if (gstinPAN !== pan) {
      errors.push('PAN does not match GSTIN')
    }

    if (!validateIFSC(ifscCode)) {
      errors.push('Invalid IFSC code')
    }

    if (!validateBankAccount(accountNumber)) {
      errors.push('Invalid bank account number')
    }

    if (accountNumber !== confirmAccountNumber) {
      errors.push('Account numbers do not match')
    }

    if (!validateBusinessType(businessType)) {
      errors.push('Invalid business type')
    }

    if (!validatePhone(phone)) {
      errors.push('Invalid phone number')
    }

    if (errors.length > 0) {
      res.status(400).json({ success: false, errors })
      return
    }

    // UPLOAD DOCUMENTS TO CLOUDINARY
    const uploadedDocs: any = {}

    if (files.length > 0) {
      for (const file of files) {
        const docType = file.fieldname
        
        const result = await uploadKYCDocument(
          file.buffer,
          userId,
          docType,
          file.originalname
        )

        uploadedDocs[docType] = result

        // ✅ Insert without type checking
        await supabaseAdmin.from('linked_account_documents').insert({
          user_id: userId,
          document_type: docType,
          file_url: result.secure_url,
          file_public_id: result.public_id,
          original_filename: file.originalname,
          file_size_bytes: result.bytes,
          verification_status: 'pending'
        } as any)
      }
    }

    console.log('✅ Documents uploaded:', Object.keys(uploadedDocs))

    // CREATE RAZORPAY LINKED ACCOUNT
    const linkedAccount = await linkedAccountService.createLinkedAccount({
      userId,
      email: req.user!.email,
      phone,
      businessName,
      businessType,
      pan,
      gstin,
      accountNumber,
      ifscCode,
      accountHolderName,
      businessAddress,
      ipAddress: req.ip
    })

    // UPDATE USER TABLE
    const last4Digits = accountNumber.slice(-4)

    await supabaseAdmin.from('users').update({
      linked_account_id: linkedAccount.id,
      kyc_status: 'submitted',
      kyc_submitted_at: new Date().toISOString(),
      bank_account_last4: last4Digits,
      bank_ifsc: ifscCode,
      bank_account_holder_name: accountHolderName,
      gstin: gstin,
      pan: pan,
      phone: phone
    } as any).eq('id', userId)

    // AUDIT LOG
    await auditLog(userId, {
      action: 'kyc_submitted',
      entityType: 'linked_account',
      entityId: linkedAccount.id,
      requestData: { businessName, businessType },
      status: 'success'
    })

    console.log('=== KYC SUBMISSION SUCCESS ===')

    res.status(201).json({
      success: true,
      message: 'KYC submitted successfully. Review within 24-48 hours.',
      data: {
        linkedAccountId: linkedAccount.id,
        kycStatus: 'submitted',
        submittedAt: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('❌ Create linked account error:', error)

    await auditLog(req.user?.id, {
      action: 'kyc_submission_failed',
      entityType: 'linked_account',
      status: 'error',
      responseData: { error: error.message }
    })

    res.status(500).json({
      success: false,
      error: 'Failed to create linked account',
      details: error.message
    })
  }
}

export const getKYCStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('linked_account_id, kyc_status, kyc_submitted_at, kyc_verified_at, kyc_rejection_reason')
      .eq('id', userId)
      .single()

    if (error || !user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // If linked account exists, sync status from Razorpay
    if (user.linked_account_id && user.kyc_status !== 'verified') {
      try {
        const { kycStatus, account } = await linkedAccountService.syncKYCStatus(
          userId,
          user.linked_account_id
        )
        
        res.json({
          success: true,
          data: {
            kycStatus,
            linkedAccountId: user.linked_account_id,
            submittedAt: user.kyc_submitted_at,
            verifiedAt: user.kyc_verified_at,
            rejectionReason: user.kyc_rejection_reason,
            accountActive: !!account.activated_at
          }
        })
        return
      } catch (syncError) {
        console.error('KYC sync error:', syncError)
      }
    }

    res.json({
      success: true,
      data: {
        kycStatus: user.kyc_status,
        linkedAccountId: user.linked_account_id,
        submittedAt: user.kyc_submitted_at,
        verifiedAt: user.kyc_verified_at,
        rejectionReason: user.kyc_rejection_reason
      }
    })
  } catch (error: any) {
    console.error('Get KYC status error:', error)
    res.status(500).json({ error: 'Failed to fetch KYC status' })
  }
}
