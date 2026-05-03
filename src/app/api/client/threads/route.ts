import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'

async function verifyClient(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    if (decoded.role !== 'user') return null
    return decoded
  } catch {
    return null
  }
}

async function getClientRecord(uid: string) {
  const db = await getDb()
  if (!db) return null
  const user = await db.user.findUnique({ where: { firebaseUid: uid } })
  if (!user) return null
  return db.client.findUnique({ where: { userId: user.id }, include: { assignedAgent: true } })
}

export async function GET(req: NextRequest) {
  const decoded = await verifyClient(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const client = await getClientRecord(decoded.uid)
  if (!client) return Response.json({ threads: [] })

  const threads = await db.thread.findMany({
    where: { participants: { some: { clientId: client.id } } },
    include: {
      listing: { select: { id: true, title: true, location: true, images: true, status: true } },
      participants: {
        include: {
          agent: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      milestones: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return Response.json({ threads, clientId: client.id })
}

export async function POST(req: NextRequest) {
  const decoded = await verifyClient(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const client = await getClientRecord(decoded.uid)
  if (!client) return Response.json({ error: 'Client record not found' }, { status: 404 })

  const body = await req.json()
  const { type, title, listingId, firstMessage } = body as {
    type: 'LISTING' | 'GENERAL'
    title?: string
    listingId?: string
    firstMessage?: string
  }

  if (type === 'LISTING' && !listingId) {
    return Response.json({ error: 'listingId required for LISTING thread' }, { status: 400 })
  }
  if (type === 'GENERAL' && !title?.trim()) {
    return Response.json({ error: 'title required for GENERAL thread' }, { status: 400 })
  }

  const agentParticipants = client.assignedAgentId
    ? [{ participantType: 'AGENT' as const, agentId: client.assignedAgentId }]
    : []

  const thread = await db.thread.create({
    data: {
      type,
      title: title ?? null,
      listingId: listingId ?? null,
      participants: {
        create: [
          { participantType: 'CLIENT', clientId: client.id },
          ...agentParticipants,
        ],
      },
      ...(firstMessage?.trim()
        ? {
            messages: {
              create: {
                senderType: 'CLIENT',
                senderId: client.id,
                senderName: client.name,
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
          client: { select: { id: true, name: true } },
        },
      },
      messages: true,
      milestones: true,
    },
  })

  return Response.json({ thread }, { status: 201 })
}
