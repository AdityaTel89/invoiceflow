import { Request } from 'express'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        businessName: string  // ✅ Added to match authMiddleware.ts
      }
      files?: any // Multer files
    }
  }
}
