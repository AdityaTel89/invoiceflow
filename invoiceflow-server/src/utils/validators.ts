/**
 * Indian GSTIN validation
 * Format: 29ABCDE1234F1Z5 (15 chars)
 * First 2: State code (01-37)
 * Next 10: PAN
 * Next 1: Entity number
 * Next 1: Z (default)
 * Last 1: Checksum
 */
export const validateGSTIN = (gstin: string): boolean => {
  const gstinRegex = /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return gstinRegex.test(gstin)
}

/**
 * PAN validation
 * Format: ABCDE1234F (10 chars)
 */
export const validatePAN = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan)
}

/**
 * IFSC code validation
 * Format: ABCD0123456 (11 chars)
 * First 4: Bank code (alphabets)
 * 5th: Always 0
 * Last 6: Branch code (alphanumeric)
 */
export const validateIFSC = (ifsc: string): boolean => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
  return ifscRegex.test(ifsc)
}

/**
 * Bank account number validation
 * Length: 9-18 digits
 */
export const validateBankAccount = (account: string): boolean => {
  return /^[0-9]{9,18}$/.test(account)
}

/**
 * Extract PAN from GSTIN
 * PAN is at positions 2-12 (0-indexed)
 */
export const extractPANFromGSTIN = (gstin: string): string => {
  return gstin.substring(2, 12)
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (Indian format)
 * 10 digits
 */
export const validatePhone = (phone: string): boolean => {
  return /^[6-9]\d{9}$/.test(phone)
}

/**
 * Business type enum
 */
export const BUSINESS_TYPES = [
  'proprietorship',
  'partnership',
  'private_limited',
  'public_limited',
  'llp',
  'trust',
  'society',
  'other'
] as const

export type BusinessType = typeof BUSINESS_TYPES[number]

export const validateBusinessType = (type: string): boolean => {
  return BUSINESS_TYPES.includes(type as BusinessType)
}
