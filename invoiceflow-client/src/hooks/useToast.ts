import toast from 'react-hot-toast'

export const useToast = () => {
  const success = (message: string, options?: any) => {
    return toast.success(message, {
      ...options,
      style: {
        background: '#ecfdf5',
        border: '1px solid #10b981',
        color: '#065f46',
        fontWeight: '500',
      },
    })
  }

  const error = (message: string, options?: any) => {
    return toast.error(message, {
      ...options,
      style: {
        background: '#fef2f2',
        border: '1px solid #ef4444',
        color: '#991b1b',
        fontWeight: '500',
      },
    })
  }

  const loading = (message: string, options?: any) => {
    return toast.loading(message, {
      ...options,
      style: {
        background: '#eef2ff',
        border: '1px solid #6366f1',
        color: '#3730a3',
        fontWeight: '500',
      },
    })
  }

  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string
      error: string
    },
    options?: any
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      options
    )
  }

  const custom = (message: string, options?: any) => {
    return toast(message, options)
  }

  const dismiss = (toastId?: string) => {
    toast.dismiss(toastId)
  }

  return {
    success,
    error,
    loading,
    promise,
    custom,
    dismiss,
  }
}
