import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'
import { getOrCreateAgent } from '@/lib/get-agent'

async function verifyStaff(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    if (!['agent', 'admin', 'dev'].includes(decoded.role as string)) return null
    return decoded
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ count: 0 })

  const agent = await getOrCreateAgent(db, decoded)
  if (!agent) return Response.json({ count: 0 })

  const threads = await db.thread.findMany({
    where: { status: 'active', participants: { some: { agentId: agent.id } } },
    select: {
      participants: {
        where: { agentId: agent.id },
        select: { lastReadAt: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { senderType: true, senderId: true, createdAt: true },
      },
    },
  })

  const count = threads.filter(t => {
    const last = t.messages[0]
    if (!last) return false
    if (last.senderId === agent.id) return false
    const lastReadAt = t.participants[0]?.lastReadAt
    if (!lastReadAt) return true
    return last.createdAt > lastReadAt
  }).length

  return Response.json({ count })
}
