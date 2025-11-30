import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RegisterSchema } from '../types'
import type { RegisterFormData } from '../types'
import { authService } from '../services/authService'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema)
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError('')
      const response = await authService.register(data)
      login(response.token, response.user)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-strong border border-violet-blue/10"
      >
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6"
          >
            <h1 className="text-5xl font-bold text-gradient-violet mb-2">
              InvoiceFlow
            </h1>
            <h2 className="text-2xl font-semibold text-gray-800">Create Account</h2>
            <p className="text-gray-600 mt-2">Start managing invoices today</p>
          </motion.div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-fiery-rose-50 border border-fiery-rose-200 text-fiery-rose-600 px-4 py-3 rounded-lg mb-4"
            >
              {error}
            </motion.div>
          )}

          <motion.form
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                {...register('businessName')}
                type="text"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue focus:border-transparent transition-all duration-200"
                placeholder="Your Business Name"
              />
              {errors.businessName && (
                <p className="text-fiery-rose text-sm mt-1">{errors.businessName.message}</p>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue focus:border-transparent transition-all duration-200"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-fiery-rose text-sm mt-1">{errors.email.message}</p>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                {...register('password')}
                type="password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-fiery-rose text-sm mt-1">{errors.password.message}</p>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="text-fiery-rose text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GSTIN (Optional)
              </label>
              <input
                {...register('gstin')}
                type="text"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue focus:border-transparent transition-all duration-200"
                placeholder="22AAAAA0000A1Z5"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address (Optional)
              </label>
              <textarea
                {...register('address')}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-blue focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Business Address"
              />
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full gradient-violet text-white py-3 rounded-lg font-medium shadow-medium hover:shadow-strong disabled:opacity-50 transition-all duration-300"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </motion.button>
          </motion.form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center mt-6 text-gray-600"
          >
            Already have an account?{' '}
            <Link to="/login" className="text-violet-blue hover:text-electric-purple font-medium transition-colors">
              Sign in
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
