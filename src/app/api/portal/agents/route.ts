import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    if (!['agent', 'admin', 'dev'].includes(decoded.role as string)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  if (!db) return Response.json({ agents: [] })

  const agents = await db.agent.findMany({
    where: { isActive: true, inviteStatus: 'active' },
    select: { id: true, name: true, role: true, email: true, phone: true, bio: true, specialties: true, regionalPresence: true, image: true },
    orderBy: { createdAt: 'asc' },
  })

  return Response.json({ agents })
}
