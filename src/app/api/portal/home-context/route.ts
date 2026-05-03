import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'

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
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const isAdmin = ['admin', 'dev'].includes(decoded.role as string)

  let agentRecord: { id: string } | null = null
  if (!isAdmin) {
    agentRecord = await db.agent.findUnique({ where: { firebaseUid: decoded.uid }, select: { id: true } })
  }

  const clientFilter = agentRecord ? { assignedAgentId: agentRecord.id } : {}
  const listingFilter = agentRecord ? { agentId: agentRecord.id } : {}

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [activeListings, totalClients, viewingClients, newInquiries, newRequests] = await Promise.all([
    db.listing.count({ where: { ...listingFilter, status: 'AVAILABLE' } }),
    db.client.count({ where: clientFilter }),
    db.client.count({ where: { ...clientFilter, journeyStage: 'viewing' } }),
    db.threadMessage.count({ where: { senderType: 'CLIENT', createdAt: { gte: sevenDaysAgo } } }),
    isAdmin ? db.featureRequest.count({ where: { status: 'new' } }) : Promise.resolve(0),
  ])

  const recentConvos = await db.conversation.findMany({
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: {
      client: { select: { name: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  const conversations = recentConvos.map(c => ({
    id: c.id,
    clientName: c.client?.name ?? 'Website visitor',
    lastMessage: c.messages[0]?.content?.slice(0, 90) ?? 'No messages yet',
    lastAt: c.createdAt.toISOString(),
    unread: c.unreadCount,
  }))

  return Response.json({
    pipeline: { activeListings, totalClients, viewingStage: viewingClients, newInquiries },
    conversations,
    newRequests,
  })
}
