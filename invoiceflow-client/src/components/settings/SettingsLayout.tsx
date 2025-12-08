import { Link, useLocation } from 'react-router-dom'
import { 
  BuildingOfficeIcon, 
  ShieldCheckIcon, 
  BanknotesIcon,
  UserCircleIcon 
} from '@heroicons/react/24/outline'

interface SettingsTab {
  name: string
  href: string
  icon: any
}

const settingsTabs: SettingsTab[] = [
  { name: 'Profile', href: '/settings/profile', icon: UserCircleIcon },
  { name: 'Business Details', href: '/settings/business-details', icon: BuildingOfficeIcon },
  { name: 'KYC Status', href: '/settings/kyc-status', icon: ShieldCheckIcon },
  { name: 'Settlements', href: '/settings/settlements', icon: BanknotesIcon }
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account and business settings</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {settingsTabs.map(tab => {
            const Icon = tab.icon
            const isActive = location.pathname === tab.href

            return (
              <Link
                key={tab.name}
                to={tab.href}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-violet-blue text-violet-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  )
}
