import { getDb } from '@/lib/db'

export async function GET() {
  const db = await getDb()
  if (db) {
    const dbAgents = await db.agent.findMany({
      where: { isActive: true, inviteStatus: 'active', role: { notIn: ['dev', 'admin'] } },
      select: {
        id: true, name: true, role: true, email: true, phone: true,
        bio: true, specialties: true, regionalPresence: true, image: true,
      },
      orderBy: { createdAt: 'asc' },
    })
    return Response.json({ agents: dbAgents })
  }
  return Response.json({ agents: [] })
}
