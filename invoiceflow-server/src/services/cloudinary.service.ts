// src/services/cloudinary.service.ts
import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

/**
 * Upload PDF to Cloudinary as 'raw' resource type
 * Raw is more reliable for PDFs of any size
 */
export const uploadInvoicePDF = async (
  pdfBuffer: Buffer,
  invoiceNumber: string
): Promise<{ secure_url: string; public_id: string }> => {
  console.log('=== CLOUDINARY UPLOAD START ===')
  console.log('Invoice Number:', invoiceNumber)
  console.log('Buffer Size:', pdfBuffer.length, 'bytes')

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'invoices',
        public_id: `invoice_${invoiceNumber}_${Date.now()}`,
        resource_type: 'raw',     // ✅ Use raw for reliability
        format: 'pdf',
        access_mode: 'public',
        type: 'upload',
        invalidate: true,
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error)
          reject(error)
        } else if (result) {
          console.log('✅ PDF uploaded successfully')
          console.log('   URL:', result.secure_url)
          console.log('   Public ID:', result.public_id)
          console.log('   Resource Type:', result.resource_type)
          console.log('   Format:', result.format)
          console.log('=== CLOUDINARY UPLOAD SUCCESS ===')
          
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id
          })
        } else {
          reject(new Error('Upload failed - no result'))
        }
      }
    )

    const bufferStream = Readable.from(pdfBuffer)
    bufferStream.pipe(uploadStream)
  })
}

/**
 * Delete PDF from Cloudinary
 */
export const deleteInvoicePDF = async (publicId: string): Promise<void> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { 
      resource_type: 'raw',
      invalidate: true
    })
    console.log('✅ PDF deleted from Cloudinary:', result)
  } catch (error) {
    console.error('❌ Error deleting PDF from Cloudinary:', error)
    throw error
  }
}

export default cloudinary
