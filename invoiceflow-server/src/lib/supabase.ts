import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables first
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is missing from .env file')
  console.error('Current directory:', process.cwd())
  console.error('Looking for .env at:', process.cwd() + '\\.env')
  throw new Error('SUPABASE_URL is required in .env file')
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing from .env file')
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in .env file')
}

console.log('✅ Supabase initialized successfully')

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
