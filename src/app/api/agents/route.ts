import { getDb } from '@/lib/db'

export async function GET() {
  const db = await getDb()
  if (db) {
    const dbAgents = await db.agent.findMany({
      where: { isActive: true, inviteStatus: 'active', role: { notIn: ['dev'] } },
      select: {
        id: true, name: true, role: true, roleSn: true, roleNd: true,
        email: true, phone: true,
        bio: true, bioSn: true, bioNd: true,
        specialties: true, regionalPresence: true, image: true,
      },
      orderBy: { createdAt: 'asc' },
    })
    return Response.json({ agents: dbAgents })
  }
  return Response.json({ agents: [] })
}
