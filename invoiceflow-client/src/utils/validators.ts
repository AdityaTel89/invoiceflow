export const validateGSTIN = (gstin: string): boolean => {
  const gstinRegex = /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return gstinRegex.test(gstin)
}

export const validatePAN = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan)
}

export const validateIFSC = (ifsc: string): boolean => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
  return ifscRegex.test(ifsc)
}

// ✅ ADD THIS FUNCTION
export const validateBankAccount = (account: string): boolean => {
  // Bank account numbers are typically 9-18 digits
  const accountRegex = /^[0-9]{9,18}$/
  return accountRegex.test(account)
}

export const extractPANFromGSTIN = (gstin: string): string => {
  return gstin.substring(2, 12)
}

export const validatePhone = (phone: string): boolean => {
  return /^[6-9]\d{9}$/.test(phone)
}

export const formatBankAccount = (account: string): string => {
  return account.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
}

export const maskBankAccount = (account: string): string => {
  if (account.length <= 4) return account
  return '*'.repeat(account.length - 4) + account.slice(-4)
}
