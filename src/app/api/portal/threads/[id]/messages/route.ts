import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'
import { getOrCreateAgent } from '@/lib/get-agent'
import { notifyThreadParticipants } from '@/lib/email'

async function verifyStaff(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) { console.log('[thread-messages] no auth token'); return null }
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    if (!['agent', 'admin', 'dev'].includes(decoded.role as string)) {
      console.log('[thread-messages] role rejected:', decoded.role, decoded.uid)
      return null
    }
    return decoded
  } catch (e) {
    console.log('[thread-messages] verifyStaff error:', e)
    return null
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const { id: threadId } = await params

  console.log('[thread-messages POST] uid:', decoded.uid, 'role:', decoded.role, 'email:', decoded.email, 'thread:', threadId)
  const agent = await getOrCreateAgent(db, decoded)
  console.log('[thread-messages POST] agent:', agent ? `id=${agent.id}` : 'null')
  if (!agent) return Response.json({ error: 'Agent record not found' }, { status: 404 })

  const body = await req.json()
  const { content } = body as { content: string }
  if (!content?.trim()) return Response.json({ error: 'content required' }, { status: 400 })

  const thread = await db.thread.findUnique({
    where: { id: threadId },
    include: {
      listing: { select: { title: true } },
      participants: {
        include: { client: { select: { name: true, email: true } } },
      },
    },
  })

  const [message] = await db.$transaction([
    db.threadMessage.create({
      data: {
        threadId,
        senderType: 'AGENT',
        senderId: agent.id,
        senderName: agent.name,
        content: content.trim(),
      },
    }),
    db.thread.update({ where: { id: threadId }, data: { updatedAt: new Date() } }),
  ])

  if (thread) {
    const threadTitle = thread.listing?.title ?? thread.participants.find(p => p.participantType === 'AGENT')?.client?.name ?? 'Conversation'
    const clientRecipients = thread.participants
      .filter(p => p.participantType === 'CLIENT' && p.client?.email)
      .map(p => ({ name: p.client!.name, email: p.client!.email! }))
    notifyThreadParticipants({
      recipients: clientRecipients,
      senderName: agent.name,
      threadTitle,
      messagePreview: content.trim(),
      portalPath: 'client',
    }).catch(e => console.error('[thread-messages] email error:', e))
  }

  return Response.json({ message }, { status: 201 })
}
