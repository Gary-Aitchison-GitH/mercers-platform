import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'

// Called by the setup page after password is confirmed — marks agent as active
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = await getAdminAuth().verifyIdToken(token)
    const db = await getDb()
    if (!db) return Response.json({ ok: true }) // non-fatal

    await db.agent.updateMany({
      where: { firebaseUid: decoded.uid },
      data: { inviteStatus: 'active' },
    })

    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: true }) // best-effort, don't block login
  }
}
