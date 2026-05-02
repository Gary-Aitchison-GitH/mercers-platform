import { listings } from '@/lib/data/listings'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = await getDb()
  if (db) {
    const dbListings = await db.listing.findMany({
      where: { status: 'AVAILABLE' },
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
    })
    if (dbListings.length > 0) return Response.json({ listings: dbListings })
  }
  return Response.json({ listings })
}
