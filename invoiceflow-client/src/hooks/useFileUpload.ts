import { useState } from 'react'

interface UploadProgress {
  [key: string]: number
}

export const useFileUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({})
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = ( type: string) => {
    setUploadProgress(prev => ({ ...prev, [type]: 0 }))
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const current = prev[type] || 0
        if (current >= 100) {
          clearInterval(interval)
          return prev
        }
        return { ...prev, [type]: Math.min(current + 10, 100) }
      })
    }, 100)

    return () => clearInterval(interval)
  }

  const resetProgress = () => {
    setUploadProgress({})
    setUploading(false)
  }

  return {
    uploadProgress,
    uploading,
    handleFileSelect,
    resetProgress,
    setUploading
  }
}
