// Latest GST 2.0 Tax Slabs (Effective Sept 22, 2025)
export const GST_SLABS = {
  EXEMPT: { rate: 0, label: 'Exempt', description: 'No GST' },
  STANDARD: { rate: 5, label: 'Standard', description: '5% GST' },
  STANDARD_SERVICES: { rate: 18, label: 'Standard', description: '18% GST' },
  LUXURY: { rate: 40, label: 'Luxury/Sin', description: '40% GST' }
} as const

// HSN/SAC Codes with Latest 2025 Rates
export const HSN_SAC_CODES = [
  // IT Services (SAC Code 998314)
  {
    code: '998314',
    description: 'IT Services - Software Development',
    gstRate: 18,
    category: 'Services'
  },
  {
    code: '998313',
    description: 'IT Services - Consulting & Advisory',
    gstRate: 18,
    category: 'Services'
  },
  {
    code: '998315',
    description: 'IT Services - Maintenance & Support',
    gstRate: 18,
    category: 'Services'
  },

  // Design & Creative Services
  {
    code: '996511',
    description: 'Design Services - Graphics/UI/UX',
    gstRate: 18,
    category: 'Services'
  },
  {
    code: '996512',
    description: 'Design Services - Web Design',
    gstRate: 18,
    category: 'Services'
  },

  // Marketing & Professional Services
  {
    code: '998311',
    description: 'Marketing Services - Digital Marketing',
    gstRate: 18,
    category: 'Services'
  },
  {
    code: '998312',
    description: 'Accounting Services - Bookkeeping',
    gstRate: 18,
    category: 'Services'
  },

  // Goods - Daily Essentials (5% under GST 2.0)
  {
    code: '1001',
    description: 'Cereals - Rice, Wheat',
    gstRate: 5,
    category: 'Goods'
  },
  {
    code: '1002',
    description: 'Pulses - Dal, Beans',
    gstRate: 5,
    category: 'Goods'
  },
  {
    code: '2001',
    description: 'Vegetables & Fruits',
    gstRate: 5,
    category: 'Goods'
  },

  // Goods - General (18%)
  {
    code: '8704',
    description: 'Motor Vehicles - Cars',
    gstRate: 18,
    category: 'Goods'
  },
  {
    code: '8528',
    description: 'Electronics - Television',
    gstRate: 18,
    category: 'Goods'
  },

  // Luxury Goods (40% under GST 2.0)
  {
    code: '8704',
    description: 'Luxury Vehicle - High-end Car',
    gstRate: 40,
    category: 'Goods'
  },
  {
    code: '2402',
    description: 'Tobacco Products',
    gstRate: 40,
    category: 'Goods'
  }
] as const

// Indian States with Codes (for CGST/SGST vs IGST)
export const STATES_WITH_CODES = [
  { code: '01', name: 'Andaman and Nicobar Islands' },
  { code: '02', name: 'Andhra Pradesh' },
  { code: '03', name: 'Arunachal Pradesh' },
  { code: '04', name: 'Assam' },
  { code: '05', name: 'Bihar' },
  { code: '06', name: 'Chandigarh' },
  { code: '07', name: 'Chhattisgarh' },
  { code: '08', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '09', name: 'Delhi' },
  { code: '10', name: 'Goa' },
  { code: '11', name: 'Gujarat' },
  { code: '12', name: 'Haryana' },
  { code: '13', name: 'Himachal Pradesh' },
  { code: '14', name: 'Jammu and Kashmir' },
  { code: '15', name: 'Jharkhand' },
  { code: '16', name: 'Karnataka' },
  { code: '17', name: 'Kerala' },
  { code: '18', name: 'Ladakh' },
  { code: '19', name: 'Lakshadweep' },
  { code: '20', name: 'Madhya Pradesh' },
  { code: '21', name: 'Maharashtra' },
  { code: '22', name: 'Manipur' },
  { code: '23', name: 'Meghalaya' },
  { code: '24', name: 'Mizoram' },
  { code: '25', name: 'Nagaland' },
  { code: '26', name: 'Odisha' },
  { code: '27', name: 'Puducherry' },
  { code: '28', name: 'Punjab' },
  { code: '29', name: 'Rajasthan' },
  { code: '30', name: 'Sikkim' },
  { code: '31', name: 'Tamil Nadu' },
  { code: '32', name: 'Telangana' },
  { code: '33', name: 'Tripura' },
  { code: '34', name: 'Uttar Pradesh' },
  { code: '35', name: 'Uttarakhand' },
  { code: '36', name: 'West Bengal' }
] as const

// GST Invoice Requirements & Rules (Latest 2025)
export const GST_COMPLIANCE_RULES = {
  MANDATORY_FIELDS: [
    'invoiceNumber',
    'invoiceDate',
    'supplierName',
    'supplierGSTIN',
    'supplierAddress',
    'recipientName',
    'recipientAddress',
    'placeOfSupply',
    'itemDescription',
    'hsnSacCode',
    'quantity',
    'rate',
    'taxableValue',
    'taxRate',
    'taxAmount',
    'totalAmount'
  ],
  E_INVOICING_THRESHOLD: 5_00_00_000, // Rs. 5 crore
  E_INVOICING_REPORTING_THRESHOLD: 10_00_00_000, // Rs. 10 crore
  E_INVOICING_REPORTING_DAYS: 30, // Days to report to IRP
  INVOICE_RETENTION_YEARS: 8,
  MINIMUM_INVOICE_VALUE_FOR_UNREGISTERED: 50_000, // Rs. 50,000
  AGGREGATE_INVOICE_THRESHOLD: 200, // Rs. 200
  MFA_MANDATORY_THRESHOLD: 20_00_00_000 // Rs. 20 crore
}

export const TAX_BREAKDOWN = {
  SAME_STATE: { cgst: true, sgst: true, igst: false },
  DIFFERENT_STATE: { cgst: false, sgst: false, igst: true }
}

// Invoice Types per GST Rules
export const INVOICE_TYPES = {
  TAX_INVOICE: 'TAX INVOICE',
  BILL_OF_SUPPLY: 'BILL OF SUPPLY',
  CREDIT_NOTE: 'CREDIT NOTE',
  DEBIT_NOTE: 'DEBIT NOTE',
  AGGREGATE_INVOICE: 'AGGREGATE INVOICE'
}

// Payment Terms (Standard)
export const PAYMENT_TERMS = [
  { label: 'Net 15', days: 15 },
  { label: 'Net 30', days: 30 },
  { label: 'Net 45', days: 45 },
  { label: 'Net 60', days: 60 },
  { label: 'Due on Receipt', days: 0 }
]
