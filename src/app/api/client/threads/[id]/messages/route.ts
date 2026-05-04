import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'
import { notifyThreadParticipants } from '@/lib/email'

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = await verifyClient(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const { id: threadId } = await params

  const user = await db.user.findUnique({ where: { firebaseUid: decoded.uid } })
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const client = await db.client.findUnique({ where: { userId: user.id } })
  if (!client) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const thread = await db.thread.findUnique({
    where: { id: threadId },
    select: { participants: { select: { clientId: true, participantType: true } } },
  })
  if (!thread) return Response.json({ error: 'Not found' }, { status: 404 })

  const isParticipant = thread.participants.some(p => p.clientId === client.id)
  if (!isParticipant) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { content } = body as { content: string }
  if (!content?.trim()) return Response.json({ error: 'content required' }, { status: 400 })

  const threadFull = await db.thread.findUnique({
    where: { id: threadId },
    include: {
      listing: { select: { title: true } },
      participants: {
        include: { agent: { select: { name: true, email: true } } },
      },
    },
  })

  const [message] = await db.$transaction([
    db.threadMessage.create({
      data: {
        threadId,
        senderType: 'CLIENT',
        senderId: client.id,
        senderName: client.name,
        content: content.trim(),
      },
    }),
    db.thread.update({ where: { id: threadId }, data: { updatedAt: new Date() } }),
  ])

  if (threadFull) {
    const threadTitle = threadFull.listing?.title ?? threadFull.title ?? 'Conversation'
    const agentRecipients = threadFull.participants
      .filter(p => p.participantType === 'AGENT' && p.agent?.email)
      .map(p => ({ name: p.agent!.name, email: p.agent!.email! }))
    await notifyThreadParticipants({
      recipients: agentRecipients,
      senderName: client.name,
      threadTitle,
      messagePreview: content.trim(),
      portalPath: 'agents',
    }).catch(e => console.error('[client-messages] email error:', e))
  }

  return Response.json({ message }, { status: 201 })
}
