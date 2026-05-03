import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'

async function verifyStaff(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    if (!['agent', 'admin', 'dev'].includes(decoded.role as string)) return null
    return decoded
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const agent = await db.agent.findUnique({ where: { firebaseUid: decoded.uid } })
  if (!agent) return Response.json({ error: 'Agent not found' }, { status: 404 })

  return Response.json({ agent })
}

export async function PUT(req: NextRequest) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const { role, bio, phone, specialties, regionalPresence, image } = await req.json()

  const agent = await db.agent.update({
    where: { firebaseUid: decoded.uid },
    data: {
      ...(role !== undefined && { role }),
      ...(bio !== undefined && { bio }),
      ...(phone !== undefined && { phone }),
      ...(specialties !== undefined && { specialties }),
      ...(regionalPresence !== undefined && { regionalPresence }),
      ...(image !== undefined && { image }),
    },
  })

  return Response.json({ agent })
}
