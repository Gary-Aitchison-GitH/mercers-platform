import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'

// POST /api/auth/register — public buyer/seller self-registration
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, clientType = 'BUYER', idToken } = await req.json()

    // Verify the Firebase token (user already created client-side)
    const decoded = await getAdminAuth().verifyIdToken(idToken)

    // Set role claim as "user"
    await getAdminAuth().setCustomUserClaims(decoded.uid, { role: 'user' })

    // Create User + Client record in DB
    const db = await getDb()
    if (db) {
      const user = await db.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email ?? email,
          name,
          role: 'user',
          clientType: clientType as 'BUYER' | 'SELLER' | 'BOTH',
        },
      })

      await db.client.create({
        data: {
          userId: user.id,
          name,
          email: decoded.email ?? email,
          clientType: clientType as 'BUYER' | 'SELLER' | 'BOTH',
        },
      })

      return Response.json({ success: true, userId: user.id })
    }

    return Response.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
