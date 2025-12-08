import { motion } from 'framer-motion'
import { DocumentArrowUpIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { DOCUMENT_TYPES } from '../../utils/constants'
import type { DocumentUpload } from '../../types/kyc.types'

interface Props {
  documents: DocumentUpload[]
  onChange: (documents: DocumentUpload[]) => void
  errors: Record<string, string>
  disabled?: boolean
}

export default function DocumentUploadSection({ documents, onChange, errors, disabled }: Props) {
  const handleFileSelect = (type: string, file: File | null) => {
    const updated = documents.map(doc => 
      doc.type === type 
        ? { 
            ...doc, 
            file, 
            preview: file ? URL.createObjectURL(file) : undefined,
            uploaded: false
          } 
        : doc
    )
    
    // If document type doesn't exist, add it
    const exists = documents.find(d => d.type === type)
    if (!exists && file) {
      updated.push({
        type: type as any,
        file,
        preview: URL.createObjectURL(file),
        uploaded: false
      })
    }
    
    onChange(updated)
  }

  const removeFile = (type: string) => {
    onChange(documents.filter(doc => doc.type !== type))
  }

  const getDocumentByType = (type: string) => {
    return documents.find(doc => doc.type === type)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-lg shadow-soft p-6 space-y-6"
    >
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="p-2 bg-orange-50 rounded-lg">
          <DocumentArrowUpIcon className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Document Uploads</h3>
          <p className="text-sm text-gray-500">Upload clear images or PDFs (max 5MB each)</p>
        </div>
      </div>

      <div className="space-y-4">
        {DOCUMENT_TYPES.map(({ type, label, required }) => {
          const doc = getDocumentByType(type)
          const error = errors[type]

          return (
            <div key={type} className="border border-gray-200 rounded-lg p-4 hover:border-violet-blue transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    {label}
                    {required && <span className="text-fiery-rose ml-1">*</span>}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {type === 'pan' && 'Clear image of PAN card'}
                    {type === 'gstin' && 'GST registration certificate PDF'}
                    {type === 'cancelled_cheque' && 'For bank account verification'}
                    {type === 'business_proof' && 'Registration certificate (if company/LLP)'}
                  </p>
                </div>
                {doc?.file && (
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                )}
              </div>

              {!doc?.file ? (
                <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all ${
                  error ? 'border-fiery-rose bg-red-50' : 'border-gray-300 hover:border-violet-blue hover:bg-violet-blue-50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <DocumentArrowUpIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Click to upload</span>
                  <span className="text-xs text-gray-500 mt-1">PNG, JPG or PDF (max 5MB)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={(e) => handleFileSelect(type, e.target.files?.[0] || null)}
                    disabled={disabled}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {doc.preview && doc.file.type.startsWith('image/') && (
                      <img src={doc.preview} alt={label} className="w-12 h-12 object-cover rounded" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(type)}
                    disabled={disabled}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <XCircleIcon className="w-5 h-5 text-fiery-rose" />
                  </button>
                </div>
              )}

              {error && (
                <p className="mt-2 text-sm text-fiery-rose">{error}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Upload Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">📋 Upload Guidelines</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• All documents must be clear and readable</li>
          <li>• File size should not exceed 5MB</li>
          <li>• Accepted formats: JPG, PNG, PDF</li>
          <li>• Ensure all details are visible and not cropped</li>
        </ul>
      </div>
    </motion.div>
  )
}
