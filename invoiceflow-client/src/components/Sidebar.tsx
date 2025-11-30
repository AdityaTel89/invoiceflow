import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  CogIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  name: string
  href?: string
  icon: any
  subItems?: { name: string; href: string; icon?: any }[]
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState<string | null>('Invoices')

  const navItems: NavItem[] = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: HomeIcon 
    },
    { 
      name: 'Invoices', 
      icon: DocumentTextIcon,
      subItems: [
        { name: 'All Invoices', href: '/invoices', icon: DocumentDuplicateIcon },
        { name: 'Draft', href: '/invoices/draft', icon: DocumentDuplicateIcon },
        { name: 'Sent', href: '/invoices/sent', icon: PaperAirplaneIcon },
        { name: 'Paid', href: '/invoices/paid', icon: CheckCircleIcon },
        { name: 'Overdue', href: '/invoices/overdue', icon: ExclamationCircleIcon },
      ]
    },
    { 
      name: 'Clients', 
      href: '/clients', 
      icon: UserGroupIcon 
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: ChartBarIcon 
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: CogIcon 
    },
  ]

  const isActive = (path: string) => location.pathname === path

  const toggleSubmenu = (name: string) => {
    if (collapsed) return // Don't toggle if sidebar is collapsed
    setExpandedMenu(expandedMenu === name ? null : name)
  }

  const handleLinkClick = () => {
    onClose() // Close mobile sidebar
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? '64px' : '256px' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:block bg-white border-r border-gray-200 relative"
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:shadow-lg transition-all z-10"
        >
          {collapsed ? (
            <ChevronRightIcon className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
          )}
        </button>

        {/* Desktop Sidebar Header */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          {collapsed ? (
            <div className="w-8 h-8 gradient-violet rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IF</span>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-gradient-violet">InvoiceFlow</h1>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
          {navItems.map((item) => {
            const Icon = item.icon
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isExpanded = expandedMenu === item.name
            const active = item.href ? isActive(item.href) : false

            return (
              <div key={item.name}>
                {/* Main Menu Item */}
                {item.href ? (
                  <Link
                    to={item.href}
                    className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                      active
                        ? 'gradient-violet text-white shadow-medium'
                        : 'text-gray-700 hover:bg-violet-blue-50'
                    }`}
                    title={collapsed ? item.name : ''}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.name}</span>}
                    </div>
                  </Link>
                ) : (
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                      isExpanded && !collapsed
                        ? 'bg-violet-blue-50 text-violet-blue'
                        : 'text-gray-700 hover:bg-violet-blue-50'
                    }`}
                    title={collapsed ? item.name : ''}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.name}</span>}
                    </div>
                    {!collapsed && hasSubItems && (
                      <ChevronDownIcon 
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>
                )}

                {/* Submenu Items */}
                {hasSubItems && !collapsed && (
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1 ml-4 space-y-1 border-l-2 border-violet-blue-100 pl-3">
                          {item.subItems?.map((subItem) => {
                            const SubIcon = subItem.icon
                            const subActive = isActive(subItem.href)
                            
                            return (
                              <Link
                                key={subItem.name}
                                to={subItem.href}
                                onClick={handleLinkClick}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                                  subActive
                                    ? 'bg-violet-blue text-white font-medium'
                                    : 'text-gray-600 hover:bg-violet-blue-50 hover:text-violet-blue'
                                }`}
                              >
                                {SubIcon && <SubIcon className="w-4 h-4" />}
                                <span>{subItem.name}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            )
          })}
        </nav>
      </motion.aside>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : '-100%'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-strong overflow-y-auto"
      >
        {/* Mobile Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gradient-violet">InvoiceFlow</h1>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isExpanded = expandedMenu === item.name
            const active = item.href ? isActive(item.href) : false

            return (
              <div key={item.name}>
                {/* Main Menu Item */}
                {item.href ? (
                  <Link
                    to={item.href}
                    onClick={handleLinkClick}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      active
                        ? 'gradient-violet text-white shadow-medium'
                        : 'text-gray-700 hover:bg-violet-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </Link>
                ) : (
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isExpanded
                        ? 'bg-violet-blue-50 text-violet-blue'
                        : 'text-gray-700 hover:bg-violet-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {hasSubItems && (
                      <ChevronDownIcon 
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>
                )}

                {/* Submenu Items */}
                {hasSubItems && (
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1 ml-4 space-y-1 border-l-2 border-violet-blue-100 pl-3">
                          {item.subItems?.map((subItem) => {
                            const SubIcon = subItem.icon
                            const subActive = isActive(subItem.href)
                            
                            return (
                              <Link
                                key={subItem.name}
                                to={subItem.href}
                                onClick={handleLinkClick}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                                  subActive
                                    ? 'bg-violet-blue text-white font-medium'
                                    : 'text-gray-600 hover:bg-violet-blue-50 hover:text-violet-blue'
                                }`}
                              >
                                {SubIcon && <SubIcon className="w-4 h-4" />}
                                <span>{subItem.name}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            )
          })}
        </nav>
      </motion.aside>
    </>
  )
}
