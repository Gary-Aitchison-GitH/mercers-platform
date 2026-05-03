import { getDb } from '@/lib/db'
import type { PropertyType, ListingType, Listing } from '@/lib/data/listings'

function normalizeDbListing(l: {
  id: string; title: string; location: string; area: string
  type: string; listingType: string; price: number; currency: string
  priceDisplay: string; size: string; description: string; images: string[]
  featured: boolean; agent: { name: string } | null
}): Listing {
  return {
    id: l.id,
    title: l.title,
    titleSn: l.title,
    titleNd: l.title,
    location: l.location,
    area: l.area,
    type: l.type.toLowerCase() as PropertyType,
    listingType: (l.listingType === 'SALE' ? 'sale' : 'rent') as ListingType,
    price: l.price,
    currency: (l.currency || 'USD') as 'USD' | 'ZWL',
    priceDisplay: l.priceDisplay,
    size: l.size,
    description: l.description,
    descriptionSn: l.description,
    descriptionNd: l.description,
    images: l.images,
    featured: l.featured,
    agent: l.agent?.name ?? '',
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const featuredOnly = searchParams.get('featured') === 'true'

  const db = await getDb()
  if (db) {
    const where = { status: 'AVAILABLE' as const, ...(featuredOnly ? { featured: true } : {}) }
    const dbListings = await db.listing.findMany({
      where,
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
    })
    if (dbListings.length > 0) {
      return Response.json({ listings: dbListings.map(normalizeDbListing) })
    }
  }
  return Response.json({ listings: [] })
}
