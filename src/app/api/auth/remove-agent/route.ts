import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'

export async function DELETE(req: NextRequest) {
  try {
    const { agentId, inviterToken } = await req.json()

    const decoded = await getAdminAuth().verifyIdToken(inviterToken)
    if (!decoded.role || !['admin', 'dev'].includes(decoded.role as string)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const db = await getDb()
    if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

    const agent = await db.agent.findUnique({ where: { id: agentId } })
    if (!agent) return Response.json({ error: 'Agent not found' }, { status: 404 })

    // Delete from Firebase if they have a uid
    if (agent.firebaseUid) {
      try {
        await getAdminAuth().deleteUser(agent.firebaseUid)
      } catch {
        // User may already be deleted in Firebase — continue
      }
    }

    // Remove from DB (listings must be reassigned/deleted first if any exist)
    await db.listing.deleteMany({ where: { agentId } })
    await db.conversation.updateMany({ where: { agentId }, data: { agentId: null } })
    await db.aiMatch.updateMany({ where: { agentId }, data: { agentId: null } })
    await db.agent.delete({ where: { id: agentId } })

    return Response.json({ success: true })
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
