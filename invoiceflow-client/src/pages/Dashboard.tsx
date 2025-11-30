import { motion } from 'framer-motion'
import { 
  DocumentTextIcon, 
  ClockIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const stats = [
    {
      name: 'Total Invoices',
      value: '0',
      icon: DocumentTextIcon,
      color: 'from-violet-blue to-electric-purple',
      bgColor: 'bg-violet-blue-50'
    },
    {
      name: 'Pending Payments',
      value: '₹0',
      icon: ClockIcon,
      color: 'from-dodger-blue to-violet-blue',
      bgColor: 'bg-dodger-blue-50'
    },
    {
      name: 'Paid This Month',
      value: '₹0',
      icon: CheckCircleIcon,
      color: 'from-vibrant-green to-green-500',
      bgColor: 'bg-vibrant-green-50'
    }
  ]

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's an overview of your invoices.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.name}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white rounded-xl shadow-soft border border-gray-100 hover:shadow-medium transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                  </div>
                </div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">{stat.name}</h3>
                <p className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Recent Invoices Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-soft border border-gray-100"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Recent Invoices</h2>
        </div>
        <div className="p-12 text-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <DocumentTextIcon className="w-16 h-16 mx-auto text-violet-blue-200 mb-4" />
          </motion.div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
          <p className="text-gray-500 mb-6">Create your first invoice to get started</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="gradient-violet text-white px-6 py-3 rounded-lg font-medium shadow-medium hover:shadow-strong transition-all duration-200"
          >
            + Create Invoice
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
