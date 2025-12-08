import { Toaster } from 'react-hot-toast'

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: '#fff',
          color: '#1f2937',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          maxWidth: '500px',
        },
        // Success toast
        success: {
          duration: 4000,
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
          style: {
            background: '#ecfdf5',
            border: '1px solid #10b981',
            color: '#065f46',
          },
        },
        // Error toast
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
          style: {
            background: '#fef2f2',
            border: '1px solid #ef4444',
            color: '#991b1b',
          },
        },
        // Loading toast
        loading: {
          iconTheme: {
            primary: '#6366f1',
            secondary: '#fff',
          },
          style: {
            background: '#eef2ff',
            border: '1px solid #6366f1',
            color: '#3730a3',
          },
        },
      }}
    />
  )
}
