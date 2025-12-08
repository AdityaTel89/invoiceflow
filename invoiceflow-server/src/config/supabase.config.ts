import { createClient } from '@supabase/supabase-js'

// Environment variables should already be loaded by server.ts
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables (don't throw, just warn)
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ ERROR: Supabase environment variables not loaded!')
  console.error('   This usually means dotenv.config() was not called before imports')
  console.error('   Check that server.ts loads dotenv FIRST')
  
  // Don't throw here - let server.ts handle the validation
  // This prevents the error during import phase
}

// Admin client for server-side operations (with service role key)
// Has full database access, bypasses RLS policies
export const supabaseAdmin = createClient(
  supabaseUrl || '', 
  supabaseServiceKey || '', 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Client for client-side operations (with anon key)
// Respects RLS policies
export const supabaseClient = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
)

// Default export for backward compatibility
export default supabaseAdmin

// Log success (only in development)
if (process.env.NODE_ENV === 'development' && supabaseUrl) {
  console.log('✅ Supabase initialized successfully')
  console.log('   URL:', supabaseUrl)
  console.log('   Admin client: Ready')
  console.log('   Anon client: Ready')
}
