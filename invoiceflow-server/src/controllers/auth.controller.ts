import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '../lib/supabase.js'
import type { AuthRequest } from '../middleware/authMiddleware.js'

interface User {
  id: string
  email: string
  business_name: string
  gstin?: string
  address?: string
}

const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  )
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, businessName, gstin, address } = req.body

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' })
      return
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        business_name: businessName,
        gstin,
        address
      })
      .select('id, email, business_name, gstin, address, created_at')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      res.status(500).json({ error: 'Registration failed' })
      return
    }

    const token = generateToken(user.id)

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        businessName: user.business_name,
        gstin: user.gstin,
        address: user.address
      },
      token
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const token = generateToken(user.id)

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        businessName: user.business_name,
        gstin: user.gstin,
        address: user.address
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
}

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, business_name, gstin, address, created_at')
      .eq('id', req.user!.id)
      .single()

    if (error || !user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        businessName: user.business_name,
        gstin: user.gstin,
        address: user.address,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
}

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Logout successful' })
}
