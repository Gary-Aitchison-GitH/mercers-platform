/**
 * One-time script: set initial roles for Gary (dev) and Dawn (admin).
 * Run AFTER creating their Firebase accounts via /signup on the site.
 *
 *   npx tsx scripts/bootstrap-admin.ts gary@email.com dev
 *   npx tsx scripts/bootstrap-admin.ts dawn@email.com admin
 */

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (m) {
      const k = m[1].trim(); const v = m[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[k]) process.env[k] = v
    }
  }
}

const [email, role] = process.argv.slice(2)
if (!email || !role) {
  console.error('Usage: npx tsx scripts/bootstrap-admin.ts <email> <role>')
  process.exit(1)
}
if (!['dev', 'admin', 'agent'].includes(role)) {
  console.error('Role must be: dev | admin | agent')
  process.exit(1)
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
    }),
  })
}

const auth = getAuth()

async function run() {
  const user = await auth.getUserByEmail(email)
  await auth.setCustomUserClaims(user.uid, { role })
  console.log(`✓ Set role="${role}" on ${email} (uid: ${user.uid})`)
  console.log('Note: the user must sign out and back in for the new role to take effect.')
}

run().catch(err => { console.error('Error:', err.message); process.exit(1) })
