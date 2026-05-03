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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = await verifyClient(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const { id } = await params

  const user = await db.user.findUnique({ where: { firebaseUid: decoded.uid } })
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const client = await db.client.findUnique({ where: { userId: user.id } })
  if (!client) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const thread = await db.thread.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, title: true, location: true, images: true, status: true, listingType: true } },
      participants: {
        include: {
          agent: { select: { id: true, name: true, email: true } },
          client: { select: { id: true, name: true } },
        },
      },
      messages: { orderBy: { createdAt: 'asc' } },
      milestones: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!thread) return Response.json({ error: 'Not found' }, { status: 404 })

  const isParticipant = thread.participants.some(p => p.clientId === client.id)
  if (!isParticipant) return Response.json({ error: 'Forbidden' }, { status: 403 })

  return Response.json({ thread })
}
