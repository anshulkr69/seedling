import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import * as fs from 'fs'
import * as path from 'path'

// Load .env manually if process.env.SUPABASE_URL is not set
if (!process.env.SUPABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf-8')
      envConfig.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
        if (match && match[1]) {
          const key = match[1]
          let value = match[2] || ''
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1)
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1)
          }
          process.env[key] = value.trim()
        }
      })
    }
  } catch (err) {
    console.error('Failed to parse .env file:', err)
  }
}

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
const jwtSecret = process.env.SUPABASE_SERVICE_ROLE_KEY! // The key provided in .env is the JWT secret

if (!supabaseUrl || !supabaseAnonKey || !jwtSecret) {
  console.error('Missing Supabase environment variables in server/.env')
  process.exit(1)
}

// Generate a custom service_role token using the JWT secret
const serviceRolePayload = {
  role: 'service_role',
  iss: 'supabase',
  ref: 'dihlowrqpbwibupxkgds',
  iat: Math.floor(Date.now() / 1000) - 10,
  exp: Math.floor(Date.now() / 1000) + 3600
}
const serviceRoleToken = jwt.sign(serviceRolePayload, jwtSecret, { algorithm: 'HS256' })

// Service role client (uses anonKey for API gateway bypass and signed token for DB privileges)
const serviceClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  global: {
    headers: {
      Authorization: `Bearer ${serviceRoleToken}`
    }
  }
})

// Anon client (standard authenticated users for testing RLS)
const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
})

async function runTests() {
  console.log('🌱 Starting Supabase Row Level Security (RLS) Verification Tests...\n')
  
  const testUserAEmail = `test.user.a.${Date.now()}@seedlingtest.org`
  const testUserBEmail = `test.user.b.${Date.now()}@seedlingtest.org`
  const testPassword = 'TestPassword123!'
  
  let userAId: string | null = null
  let userBId: string | null = null
  let orgAId: string | null = null
  let orgBId: string | null = null
  
  try {
    // 1. Create User A and User B
    console.log(`[1/8] Creating test users...\n  User A: ${testUserAEmail}\n  User B: ${testUserBEmail}`)
    
    const { data: authA, error: errA } = await serviceClient.auth.admin.createUser({
      email: testUserAEmail,
      password: testPassword,
      email_confirm: true
    })
    if (errA || !authA.user) throw new Error(`Failed to create User A: ${errA?.message}`)
    userAId = authA.user.id
    
    const { data: authB, error: errB } = await serviceClient.auth.admin.createUser({
      email: testUserBEmail,
      password: testPassword,
      email_confirm: true
    })
    if (errB || !authB.user) throw new Error(`Failed to create User B: ${errB?.message}`)
    userBId = authB.user.id
    
    // 2. Create organizations for both users using service client
    console.log('[2/8] Creating organization profiles...')
    
    const { data: orgA, error: errOrgA } = await serviceClient
      .from('organizations')
      .insert({
        user_id: userAId,
        name: 'Organization A',
        type: 'NGO'
      })
      .select()
      .single()
    if (errOrgA || !orgA) throw new Error(`Failed to create Org A: ${errOrgA?.message}`)
    orgAId = orgA.id
    
    const { data: orgB, error: errOrgB } = await serviceClient
      .from('organizations')
      .insert({
        user_id: userBId,
        name: 'Organization B',
        type: 'NGO'
      })
      .select()
      .single()
    if (errOrgB || !orgB) throw new Error(`Failed to create Org B: ${errOrgB?.message}`)
    orgBId = orgB.id
    
    // 3. Create projects for both orgs
    console.log('[3/8] Seeding project records...')
    
    const { error: errProjA } = await serviceClient
      .from('projects')
      .insert({
        org_id: orgAId,
        name: 'Project Alpha (Org A)'
      })
    if (errProjA) throw new Error(`Failed to create Project A: ${errProjA.message}`)
    
    const { error: errProjB } = await serviceClient
      .from('projects')
      .insert({
        org_id: orgBId,
        name: 'Project Beta (Org B)'
      })
    if (errProjB) throw new Error(`Failed to create Project B: ${errProjB.message}`)
    
    // 4. Authenticate as User A
    console.log('[4/8] Authenticating client as User A...')
    const { data: sessionA, error: errSessionA } = await anonClient.auth.signInWithPassword({
      email: testUserAEmail,
      password: testPassword
    })
    if (errSessionA || !sessionA.session) throw new Error(`Failed to sign in as User A: ${errSessionA?.message}`)
    
    const userClientA = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${sessionA.session.access_token}`
        }
      }
    })
    
    // 5. Test RLS on organizations
    console.log('[5/8] Testing tenant isolation on "organizations" table...')
    const { data: visibleOrgs, error: errFetchOrgs } = await userClientA
      .from('organizations')
      .select('*')
    if (errFetchOrgs) throw new Error(`Failed to fetch orgs as User A: ${errFetchOrgs.message}`)
    
    const orgNames = visibleOrgs.map(o => o.name)
    console.log(`  Visible organizations to User A:`, orgNames)
    if (orgNames.includes('Organization B')) {
      throw new Error('RLS Failure: User A can see Organization B!')
    }
    if (!orgNames.includes('Organization A')) {
      throw new Error('Error: User A cannot see their own Organization A!')
    }
    console.log('  ✅ Organizations RLS policy verified.')
    
    // 6. Test RLS on projects
    console.log('[6/8] Testing tenant isolation on "projects" table...')
    const { data: visibleProjects, error: errFetchProjects } = await userClientA
      .from('projects')
      .select('*')
    if (errFetchProjects) throw new Error(`Failed to fetch projects as User A: ${errFetchProjects.message}`)
    
    const projectNames = visibleProjects.map(p => p.name)
    console.log(`  Visible projects to User A:`, projectNames)
    if (projectNames.includes('Project Beta (Org B)')) {
      throw new Error('RLS Failure: User A can see Project B from Organization B!')
    }
    if (!projectNames.includes('Project Alpha (Org A)')) {
      throw new Error('Error: User A cannot see their own Project Alpha!')
    }
    console.log('  ✅ Projects RLS policy verified.')
    
    // 7. Test RLS block on INSERT to grants
    console.log('[7/8] Testing write protection on global "grants" table...')
    const { error: errInsertGrant } = await userClientA
      .from('grants')
      .insert({
        title: 'Unauthorized Test Grant',
        funder: 'Malicious Actor'
      })
    
    if (!errInsertGrant) {
      throw new Error('RLS Failure: Non-service-role authenticated user was able to INSERT into the global grants table!')
    }
    console.log(`  Received expected error on unauthorized insert: "${errInsertGrant.message}"`)
    console.log('  ✅ Grants write-restriction policy verified.')
    
    console.log('\n🎉 ALL Row Level Security verification checks passed successfully!')
  } catch (error: any) {
    console.error('\n❌ Verification Failed:', error.message)
    process.exitCode = 1
  } finally {
    // 8. Cleanup
    console.log('\n[8/8] Cleaning up test data from Supabase...')
    if (userAId) {
      const { error } = await serviceClient.auth.admin.deleteUser(userAId)
      if (error) console.error('  Failed to clean up User A:', error.message)
      else console.log('  Cleaned up User A and cascaded profiles/projects.')
    }
    if (userBId) {
      const { error } = await serviceClient.auth.admin.deleteUser(userBId)
      if (error) console.error('  Failed to clean up User B:', error.message)
      else console.log('  Cleaned up User B and cascaded profiles/projects.')
    }
    console.log('\nCleanup finished.')
  }
}

runTests()
