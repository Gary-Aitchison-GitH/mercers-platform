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

  const isAdmin = ['admin', 'dev'].includes(decoded.role as string)
  const agent = isAdmin ? null : await getOrCreateAgent(db, decoded)

  let participantFilter = {}
  if (!isAdmin && agent) {
    participantFilter = { participants: { some: { agentId: agent.id } } }
  }

  const threads = await db.thread.findMany({
    where: { status: 'active', ...participantFilter },
    select: {
      participants: {
        where: agent ? { agentId: agent.id } : {},
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
    if (last.senderId === agent?.id) return false // I sent it
    const lastReadAt = t.participants[0]?.lastReadAt
    if (!lastReadAt) return true // never read this thread
    return last.createdAt > lastReadAt
  }).length

  return Response.json({ count })
}
