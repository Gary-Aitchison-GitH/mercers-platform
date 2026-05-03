import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'
import { getOrCreateAgent } from '@/lib/get-agent'

async function verifyStaff(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) { console.log('[threads] no auth token'); return null }
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    if (!['agent', 'admin', 'dev'].includes(decoded.role as string)) {
      console.log('[threads] verifyStaff: role rejected:', decoded.role, decoded.uid)
      return null
    }
    return decoded
  } catch (e) {
    console.log('[threads] verifyStaff error:', e)
    return null
  }
}

export async function GET(req: NextRequest) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  console.log('[threads GET] uid:', decoded.uid, 'role:', decoded.role, 'email:', decoded.email)
  const agent = await getOrCreateAgent(db, decoded)
  console.log('[threads GET] agent:', agent ? `id=${agent.id}` : 'null')

  const isAdmin = ['admin', 'dev'].includes(decoded.role as string)

  const where = (isAdmin || !agent)
    ? {}
    : { participants: { some: { agentId: agent.id } } }

  const threads = await db.thread.findMany({
    where,
    include: {
      listing: { select: { id: true, title: true, location: true, images: true, status: true } },
      participants: {
        include: {
          agent: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, email: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      milestones: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return Response.json({ threads })
}

export async function POST(req: NextRequest) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  console.log('[threads POST] uid:', decoded.uid, 'role:', decoded.role, 'email:', decoded.email)
  const agent = await getOrCreateAgent(db, decoded)
  console.log('[threads POST] agent:', agent ? `id=${agent.id}` : 'null')
  if (!agent) return Response.json({ error: 'Agent record not found' }, { status: 404 })

  const body = await req.json()
  const { type, title, listingId, clientIds, agentIds, firstMessage } = body as {
    type: 'LISTING' | 'GENERAL'
    title?: string
    listingId?: string
    clientIds?: string[]
    agentIds?: string[]
    firstMessage?: string
  }

  if (type === 'LISTING' && !listingId) {
    return Response.json({ error: 'listingId required for LISTING thread' }, { status: 400 })
  }
  if (type === 'GENERAL' && !title?.trim()) {
    return Response.json({ error: 'title required for GENERAL thread' }, { status: 400 })
  }

  const thread = await db.thread.create({
    data: {
      type,
      title: title ?? null,
      listingId: listingId ?? null,
      participants: {
        create: [
          { participantType: 'AGENT', agentId: agent.id },
          ...((agentIds ?? [])
            .filter(id => id !== agent.id)
            .map(agentId => ({ participantType: 'AGENT' as const, agentId }))),
          ...((clientIds ?? []).map(clientId => ({
            participantType: 'CLIENT' as const,
            clientId,
          }))),
        ],
      },
      ...(firstMessage?.trim()
        ? {
            messages: {
              create: {
                senderType: 'AGENT',
                senderId: agent.id,
                senderName: agent.name,
                content: firstMessage.trim(),
              },
            },
          }
        : {}),
    },
    include: {
      listing: { select: { id: true, title: true, location: true, images: true, status: true } },
      participants: {
        include: {
          agent: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, email: true } },
        },
      },
      messages: true,
      milestones: true,
    },
  })

  return Response.json({ thread }, { status: 201 })
}
