import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'

// POST /api/auth/invite — admin/dev creates an agent invite
export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, role = 'agent', inviterToken } = await req.json()

    // Verify the inviter is admin or dev
    const decoded = await getAdminAuth().verifyIdToken(inviterToken)
    if (!decoded.role || !['admin', 'dev'].includes(decoded.role as string)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Create Firebase user (no password — they set it via the invite link)
    const userRecord = await getAdminAuth().createUser({ email, displayName: name })

    // Set role claim
    await getAdminAuth().setCustomUserClaims(userRecord.uid, { role: role === 'admin' ? 'admin' : 'agent' })

    // Generate password reset link (this is the invite link)
    const inviteLink = await getAdminAuth().generatePasswordResetLink(email)

    // Create Agent record in DB
    const db = await getDb()
    if (db) {
      await db.agent.upsert({
        where: { email },
        update: { firebaseUid: userRecord.uid, name, phone: phone ?? '', inviteStatus: 'pending' },
        create: {
          firebaseUid: userRecord.uid,
          name,
          email,
          phone: phone ?? '',
          role: 'Agent',
          bio: '',
          regionalPresence: [],
          specialties: [],
          inviteStatus: 'pending',
        },
      })
    }

    return Response.json({ success: true, inviteLink, uid: userRecord.uid })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
