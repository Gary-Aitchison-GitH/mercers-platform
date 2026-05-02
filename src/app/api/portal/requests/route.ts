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

  const requests = await db.featureRequest.findMany({
    where: isAdmin ? {} : { agentEmail: decoded.email! },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ requests })
}

export async function POST(req: NextRequest) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const { title, description, type, priority, chatHistory } = await req.json()

  const agent = await db.agent.findUnique({
    where: { firebaseUid: decoded.uid },
    select: { id: true, name: true },
  })

  const request = await db.featureRequest.create({
    data: {
      agentId: agent?.id ?? null,
      agentName: agent?.name ?? decoded.email ?? 'Unknown',
      agentEmail: decoded.email ?? '',
      type: type ?? 'feature',
      title,
      description,
      priority: priority ?? 'medium',
      status: 'new',
      chatHistory: chatHistory ?? [],
    },
  })

  return Response.json({ request }, { status: 201 })
}
