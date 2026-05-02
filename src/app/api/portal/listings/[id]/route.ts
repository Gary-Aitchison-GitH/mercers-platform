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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const { id } = await params
  const existing = await db.listing.findUnique({ where: { id }, include: { agent: true } })
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  const isAdmin = ['admin', 'dev'].includes(decoded.role as string)
  if (!isAdmin && existing.agent.firebaseUid !== decoded.uid) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { title, location, area, type, listingType, price, currency, priceDisplay, size, description, images, status, featured } = body

  const listing = await db.listing.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(location !== undefined && { location }),
      ...(area !== undefined && { area }),
      ...(type !== undefined && { type }),
      ...(listingType !== undefined && { listingType }),
      ...(price !== undefined && { price: parseFloat(String(price)) }),
      ...(currency !== undefined && { currency }),
      ...(priceDisplay !== undefined && { priceDisplay }),
      ...(size !== undefined && { size }),
      ...(description !== undefined && { description }),
      ...(images !== undefined && { images }),
      ...(status !== undefined && { status }),
      ...(featured !== undefined && { featured }),
    },
    include: { agent: { select: { id: true, name: true, email: true } } },
  })

  return Response.json({ listing })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const { id } = await params
  const existing = await db.listing.findUnique({ where: { id }, include: { agent: true } })
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  const isAdmin = ['admin', 'dev'].includes(decoded.role as string)
  if (!isAdmin && existing.agent.firebaseUid !== decoded.uid) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.listing.delete({ where: { id } })
  return Response.json({ success: true })
}
