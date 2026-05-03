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

  let participantFilter = {}
  if (!isAdmin) {
    const agent = await getOrCreateAgent(db, decoded)
    if (agent) {
      participantFilter = { participants: { some: { agentId: agent.id } } }
    }
  }

  // Threads where the last message is from a CLIENT — meaning the agent needs to respond
  const threads = await db.thread.findMany({
    where: { status: 'active', ...participantFilter },
    select: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { senderType: true },
      },
    },
  })

  const count = threads.filter(t => t.messages[0]?.senderType === 'CLIENT').length

  return Response.json({ count })
}
