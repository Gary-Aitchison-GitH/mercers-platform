import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'

// POST /api/auth/set-role — dev only, used to set Gary/Dawn's initial roles
export async function POST(req: NextRequest) {
  try {
    const { targetUid, role, devToken } = await req.json()

    // Only a dev can call this
    const decoded = await getAdminAuth().verifyIdToken(devToken)
    if (decoded.role !== 'dev') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await getAdminAuth().setCustomUserClaims(targetUid, { role })
    return Response.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
