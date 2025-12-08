import axios from 'axios'
import type { LoginFormData, RegisterFormData, AuthResponse, User } from '../types'

const API_URL = 'http://localhost:5000/api'

// Create axios instance WITHOUT interceptors for auth operations
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor to authApi to verify no token is being added
authApi.interceptors.request.use(
  (config) => {
    console.log('🔍 AUTH API REQUEST:', {
      url: config.url,
      method: config.method,
      data: config.data,
      hasAuthHeader: !!config.headers.Authorization
    })
    
    // Make sure no token is added
    if (config.headers.Authorization) {
      console.error('❌ FOUND TOKEN IN AUTH REQUEST - REMOVING IT')
      delete config.headers.Authorization
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Create separate axios instance WITH interceptors for authenticated requests
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - adds token to authenticated requests
api.interceptors.request.use(
  (config) => {
    console.log('🔍 API REQUEST (with interceptor):', {
      url: config.url,
      method: config.method
    })
    
    const token = localStorage.getItem('token')
    if (token) {
      console.log('✅ Adding token to request')
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handles 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API ERROR:', {
      status: error.response?.status,
      url: error.config?.url
    })
    
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      console.log('Current path:', currentPath)
      
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        console.log('Clearing auth and redirecting to login')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authService = {
  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    console.log('📝 REGISTER called with:', { email: data.email })
    const response = await authApi.post('/auth/register', data)
    return response.data
  },

  login: async (data: LoginFormData): Promise<AuthResponse> => {
    console.log('🔐 LOGIN called with:', { email: data.email })
    const response = await authApi.post('/auth/login', data)
    console.log('✅ LOGIN response received')
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    console.log('👤 GET CURRENT USER called')
    const response = await api.get('/auth/me')
    return response.data.user
  },

  logout: () => {
    console.log('🚪 LOGOUT called')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}
