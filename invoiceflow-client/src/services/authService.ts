import axios from 'axios'
import type { LoginFormData, RegisterFormData, AuthResponse, User } from '../types'

const API_URL = 'http://localhost:5000/api/auth'

export const api = axios.create({
  baseURL: 'http://localhost:5000/api'
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/register`, data)
    return response.data
  },

  login: async (data: LoginFormData): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/login`, data)
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data.user
  },

  logout: () => {
    localStorage.removeItem('token')
  }
}
