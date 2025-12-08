// Load environment variables FIRST
import dotenv from 'dotenv'
dotenv.config()

// Validate critical environment variables before any imports
if (!process.env.SUPABASE_URL) {
  console.error('❌ SUPABASE_URL is not defined in .env file')
  process.exit(1)
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not defined in .env file')
  process.exit(1)
}

if (!process.env.SUPABASE_ANON_KEY) {
  console.error('❌ SUPABASE_ANON_KEY is not defined in .env file')
  process.exit(1)
}

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not defined in .env file')
  process.exit(1)
}

// Now import and start the server
import('./server.js').then((module) => {
  // Server starts automatically when imported
}).catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
