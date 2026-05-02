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
  let where = {}

  if (!isAdmin) {
    const agent = await db.agent.findUnique({ where: { firebaseUid: decoded.uid } })
    if (!agent) return Response.json({ clients: [] })
    where = { assignedAgentId: agent.id }
  }

  const clients = await db.client.findMany({
    where,
    include: {
      buyerRequirements: true,
      assignedAgent: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ clients })
}
