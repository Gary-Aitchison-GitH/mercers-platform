import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'

// GET /api/auth/setup?token=XXX — validate token, return agent email/name
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return Response.json({ error: 'Missing token' }, { status: 400 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const agent = await db.agent.findUnique({ where: { inviteToken: token } })
  if (!agent) return Response.json({ error: 'Invalid invite link' }, { status: 404 })
  if (!agent.inviteTokenExp || agent.inviteTokenExp < new Date()) {
    return Response.json({ error: 'This invite link has expired. Ask your admin to generate a new one.' }, { status: 410 })
  }

  return Response.json({ email: agent.email, name: agent.name })
}

// POST /api/auth/setup — set password, activate account
export async function POST(req: NextRequest) {
  try {
    const { token, password, name, phone } = await req.json()
    if (!token || !password) return Response.json({ error: 'Missing fields' }, { status: 400 })

    const db = await getDb()
    if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

    const agent = await db.agent.findUnique({ where: { inviteToken: token } })
    if (!agent) return Response.json({ error: 'Invalid invite link' }, { status: 404 })
    if (!agent.inviteTokenExp || agent.inviteTokenExp < new Date()) {
      return Response.json({ error: 'Invite link expired. Ask your admin to generate a new one.' }, { status: 410 })
    }
    if (!agent.firebaseUid) return Response.json({ error: 'Account not found' }, { status: 404 })

    // Set the password and display name via Admin SDK
    await getAdminAuth().updateUser(agent.firebaseUid, { password, ...(name ? { displayName: name } : {}) })

    // Mark active, save name, clear token
    await db.agent.update({
      where: { id: agent.id },
      data: { inviteStatus: 'active', inviteToken: null, inviteTokenExp: null, ...(name ? { name } : {}), ...(phone ? { phone } : {}) },
    })

    return Response.json({ success: true, email: agent.email })
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
