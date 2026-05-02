import { agents } from '@/lib/data/agents'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = await getDb()
  if (db) {
    const dbAgents = await db.agent.findMany({ where: { isActive: true } })
    if (dbAgents.length > 0) return Response.json({ agents: dbAgents })
  }
  return Response.json({ agents })
}
