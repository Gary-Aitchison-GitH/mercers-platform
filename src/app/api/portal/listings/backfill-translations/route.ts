import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { getDb } from '@/lib/db'
import { translateListing } from '@/lib/translate'

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    if (!['admin', 'dev'].includes(decoded.role as string)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const listings = await db.listing.findMany({
    where: { descriptionSn: null },
    select: { id: true, title: true, description: true },
  })

  const results = { success: 0, failed: 0 }

  for (const listing of listings) {
    try {
      const translations = await translateListing(listing.title, listing.description)
      await db.listing.update({ where: { id: listing.id }, data: translations })
      results.success++
    } catch {
      results.failed++
    }
  }

  return Response.json({ ...results, total: listings.length })
}
