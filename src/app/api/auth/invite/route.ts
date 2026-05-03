import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'

const APP_URL = 'https://mercers-properties.vercel.app'
const INVITE_HOURS = 12

export async function POST(req: NextRequest) {
  try {
    const { name = '', email, role = 'agent', inviterToken } = await req.json()

    const decoded = await getAdminAuth().verifyIdToken(inviterToken)
    if (!decoded.role || !['admin', 'dev'].includes(decoded.role as string)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const userRecord = await getAdminAuth().createUser({ email, ...(name ? { displayName: name } : {}) })
    await getAdminAuth().setCustomUserClaims(userRecord.uid, { role: role === 'admin' ? 'admin' : 'agent' })

    const token = randomUUID()
    const exp = new Date(Date.now() + INVITE_HOURS * 60 * 60 * 1000)
    const inviteLink = `${APP_URL}/agents/setup?token=${token}`

    const db = await getDb()
    if (db) {
      await db.agent.upsert({
        where: { email },
        update: { firebaseUid: userRecord.uid, name, phone: '', inviteStatus: 'pending', inviteToken: token, inviteTokenExp: exp },
        create: {
          firebaseUid: userRecord.uid,
          name,
          email,
          phone: '',
          role: '',
          bio: '',
          regionalPresence: [],
          specialties: [],
          inviteStatus: 'pending',
          inviteToken: token,
          inviteTokenExp: exp,
        },
      })
    }

    return Response.json({ success: true, inviteLink, uid: userRecord.uid })
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
