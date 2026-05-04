import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'
import { translateAgent } from '@/lib/translate'

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

  // Guard: never let "dev" permission string overwrite the display job title
  const safeRole = role !== undefined && role === 'dev' ? undefined : role

  // Fetch current values so we can translate even when only one field changed
  const current = await db.agent.findUnique({ where: { firebaseUid: decoded.uid }, select: { bio: true, role: true } })

  const updateData: Record<string, unknown> = {
    ...(safeRole !== undefined && { role: safeRole }),
    ...(bio !== undefined && { bio }),
    ...(phone !== undefined && { phone }),
    ...(specialties !== undefined && { specialties }),
    ...(regionalPresence !== undefined && { regionalPresence }),
    ...(image !== undefined && { image }),
  }

  // Auto-translate whenever bio or role changes
  if ((bio !== undefined || safeRole !== undefined) && current) {
    const bioToTranslate = bio ?? current.bio ?? ''
    const roleToTranslate = safeRole ?? current.role ?? ''
    if (bioToTranslate.trim() || roleToTranslate.trim()) {
      try {
        const translations = await translateAgent(bioToTranslate, roleToTranslate)
        Object.assign(updateData, translations)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[me] translation failed, saving without translations. Error:', msg)
      }
    }
  }

  const agent = await db.agent.update({ where: { firebaseUid: decoded.uid }, data: updateData })

  return Response.json({ agent })
}
