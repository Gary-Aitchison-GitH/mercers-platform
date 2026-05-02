import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'

const APP_URL = 'https://mercers-properties.vercel.app'
const INVITE_HOURS = 12

export async function POST(req: NextRequest) {
  try {
    const { agentId, inviterToken } = await req.json()

    const decoded = await getAdminAuth().verifyIdToken(inviterToken)
    if (!decoded.role || !['admin', 'dev'].includes(decoded.role as string)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const db = await getDb()
    if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

    const agent = await db.agent.findUnique({ where: { id: agentId } })
    if (!agent) return Response.json({ error: 'Agent not found' }, { status: 404 })

    const token = randomUUID()
    const exp = new Date(Date.now() + INVITE_HOURS * 60 * 60 * 1000)

    await db.agent.update({
      where: { id: agentId },
      data: { inviteToken: token, inviteTokenExp: exp },
    })

    const inviteLink = `${APP_URL}/agents/setup?token=${token}`
    return Response.json({ inviteLink })
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
