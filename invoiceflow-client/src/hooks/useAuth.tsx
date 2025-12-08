import { useState, useEffect, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

export interface User {
  id: string
  email: string
  businessName: string
  isAdmin?: boolean
  kycStatus?: string
  linkedAccountId?: string | null
  gstin?: string | null
  address?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, businessName: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Initialize auth state from localStorage ONCE
  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser) as User
          setUser(parsedUser)
        } catch (error) {
          console.error('Auth initialization error:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        }
      }
      
      setLoading(false)
    }

    initAuth()
  }, []) // Empty dependency array - runs ONCE on mount

  const login = async (email: string, password: string) => {
    console.log('🔑 useAuth.login called with:', { email })
    
    try {
      const response = await authService.login({ email, password })
      const { token, user: userData } = response

      console.log('✅ Login successful, saving to localStorage')
      
      // Save to localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))

      // Update state
      setUser(userData)
      
      console.log('🚀 Navigating to dashboard')
      
      // Redirect based on user role
      if (userData.isAdmin) {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (error) {
      console.error('❌ Login error in useAuth:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, businessName: string) => {
    try {
      const response = await authService.register({ 
        email, 
        password, 
        businessName,
        confirmPassword: password 
      })
      const { token, user: userData } = response

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))

      setUser(userData)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error('Register error:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login', { replace: true })
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    isAdmin: user?.isAdmin || false
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
