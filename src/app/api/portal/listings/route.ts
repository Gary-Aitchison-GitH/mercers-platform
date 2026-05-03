import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'
import { translateListing } from '@/lib/translate'

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

  const scope = new URL(req.url).searchParams.get('scope')
  const showAll = scope === 'all'

  let where = {}

  if (!showAll) {
    const agent = await db.agent.findUnique({ where: { firebaseUid: decoded.uid } })
    if (!agent) return Response.json({ listings: [] })
    where = { agentId: agent.id }
  }

  const listings = await db.listing.findMany({
    where,
    include: { agent: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ listings })
}

export async function POST(req: NextRequest) {
  const decoded = await verifyStaff(req)
  if (!decoded) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const isAdmin = ['admin', 'dev'].includes(decoded.role as string)
  const body = await req.json()
  const { title, location, area, type, listingType, price, currency, priceDisplay, size, description, images, agentId } = body

  let targetAgentId: string

  if (isAdmin && agentId) {
    targetAgentId = agentId
  } else {
    const agent = await db.agent.findUnique({ where: { firebaseUid: decoded.uid } })
    if (!agent) return Response.json({ error: 'Agent record not found for this account' }, { status: 404 })
    targetAgentId = agent.id
  }

  const translations = await translateListing(title, description).catch(() => null)

  const listing = await db.listing.create({
    data: {
      title,
      location,
      area: area || location,
      type,
      listingType,
      price: parseFloat(String(price)),
      currency: currency || 'USD',
      priceDisplay: priceDisplay || `${currency || 'USD'} ${price}`,
      size: size || '',
      description,
      ...(translations ?? {}),
      images: images || [],
      agentId: targetAgentId,
    },
    include: { agent: { select: { id: true, name: true, email: true } } },
  })

  return Response.json({ listing }, { status: 201 })
}
