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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const { id } = await params

  // Mark this thread as read for the opening agent
  const agent = await getOrCreateAgent(db, decoded)
  if (agent) {
    await db.threadParticipant.updateMany({
      where: { threadId: id, agentId: agent.id },
      data: { lastReadAt: new Date() },
    })
  }

  const thread = await db.thread.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, title: true, location: true, images: true, status: true, listingType: true } },
      participants: {
        include: {
          agent: { select: { id: true, name: true, email: true } },
          client: { select: { id: true, name: true, email: true } },
        },
      },
      messages: { orderBy: { createdAt: 'asc' } },
      milestones: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!thread) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json({ thread })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const { id } = await params
  const body = await req.json()
  const { status, title } = body as { status?: string; title?: string }

  const thread = await db.thread.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(title !== undefined && { title }),
    },
  })

  return Response.json({ thread })
}
