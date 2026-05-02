import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) return Response.json({ error: 'No token' }, { status: 401 })

    const decoded = await getAdminAuth().verifyIdToken(token)
    return Response.json({ uid: decoded.uid, role: decoded.role ?? 'user', email: decoded.email })
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 401 })
  }
}
