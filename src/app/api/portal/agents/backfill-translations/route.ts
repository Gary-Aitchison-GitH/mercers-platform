import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'
import { translateAgent } from '@/lib/translate'

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    if (!['admin', 'dev'].includes(decoded.role as string)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const agents = await db.agent.findMany({
    where: { bioSn: null, isActive: true },
    select: { id: true, bio: true, role: true },
  })

  const results = { success: 0, failed: 0 }

  for (const agent of agents) {
    if (!agent.bio?.trim() && !agent.role?.trim()) { results.failed++; continue }
    try {
      const translations = await translateAgent(agent.bio ?? '', agent.role ?? '')
      await db.agent.update({ where: { id: agent.id }, data: translations })
      results.success++
    } catch {
      results.failed++
    }
  }

  return Response.json({ ...results, total: agents.length })
}
