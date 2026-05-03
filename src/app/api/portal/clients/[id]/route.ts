import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    if (!['admin', 'dev'].includes(decoded.role as string)) return null
    return decoded
  } catch {
    return null
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = await verifyAdmin(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 403 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const { id } = await params
  const { assignedAgentId } = await req.json()

  const client = await db.client.update({
    where: { id },
    data: { assignedAgentId: assignedAgentId ?? null },
    include: { assignedAgent: { select: { id: true, name: true } } },
  })

  return Response.json({ client })
}
