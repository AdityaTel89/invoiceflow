// src/components/InvoiceStatusBadge.tsx
import {
  ClockIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface InvoiceStatusBadgeProps {
  status: string // Accept any string
  dueDate?: string
  className?: string
  showIcon?: boolean
}

type StatusKey = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'unpaid'

const STATUS_CONFIG: Record<StatusKey, {
  label: string
  color: string
  icon: React.ComponentType<{ className?: string }>
  dot: string
}> = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: ClockIcon,
    dot: 'bg-gray-400'
  },
  sent: {
    label: 'Sent',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: PaperAirplaneIcon,
    dot: 'bg-blue-500'
  },
  paid: {
    label: 'Paid',
    color: 'bg-green-100 text-green-700 border-green-300',
    icon: CheckCircleIcon,
    dot: 'bg-green-500'
  },
  overdue: {
    label: 'Overdue',
    color: 'bg-red-100 text-red-700 border-red-300',
    icon: ExclamationTriangleIcon,
    dot: 'bg-red-500'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-200 text-gray-600 border-gray-400',
    icon: XCircleIcon,
    dot: 'bg-gray-500'
  },
  unpaid: {
    label: 'Unpaid',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    icon: ClockIcon,
    dot: 'bg-yellow-500'
  }
}

export default function InvoiceStatusBadge({ 
  status, 
  dueDate, 
  className = '', 
  showIcon = true 
}: InvoiceStatusBadgeProps) {
  // Check if invoice is overdue
  const getActualStatus = (): StatusKey => {
    // Normalize status to lowercase and trim
    const normalizedStatus = status?.toLowerCase().trim() as StatusKey

    // If status is 'sent' or 'unpaid', check if it's overdue
    if ((normalizedStatus === 'sent' || normalizedStatus === 'unpaid') && dueDate) {
      const due = new Date(dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      due.setHours(0, 0, 0, 0)
      
      if (due < today) {
        return 'overdue'
      }
    }

    // Return the status if it exists in config, otherwise default to 'draft'
    if (normalizedStatus in STATUS_CONFIG) {
      return normalizedStatus
    }

    return 'draft' // Default fallback
  }

  const actualStatus = getActualStatus()
  const config = STATUS_CONFIG[actualStatus]
  const Icon = config.icon

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.color} ${className}`}
    >
      {showIcon ? (
        <Icon className="w-4 h-4" />
      ) : (
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      )}
      {config.label}
    </span>
  )
}

// Export types for use in other components
export type { StatusKey }
export { STATUS_CONFIG }
