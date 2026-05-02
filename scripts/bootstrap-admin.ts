/**
 * One-time script: set initial roles for Gary (dev) and Dawn (admin).
 * Run AFTER creating their Firebase accounts via /signup on the site.
 *
 *   npx tsx scripts/bootstrap-admin.ts gary@email.com dev
 *   npx tsx scripts/bootstrap-admin.ts dawn@email.com admin
 */

import { resolve } from 'path'
import { config } from 'dotenv'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Load .env.local (dotenv handles quotes, multiline escapes, and Windows line endings)
config({ path: resolve(process.cwd(), '.env.local'), override: false })

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
