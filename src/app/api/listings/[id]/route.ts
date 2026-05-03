import { getDb } from '@/lib/db'
import type { PropertyType, ListingType, Listing } from '@/lib/data/listings'

function normalizeDbListing(l: {
  id: string; title: string; titleSn?: string | null; titleNd?: string | null
  location: string; area: string; type: string; listingType: string
  price: number; currency: string; priceDisplay: string; size: string
  description: string; descriptionSn?: string | null; descriptionNd?: string | null
  images: string[]; featured: boolean; agent: { name: string } | null
}): Listing {
  return {
    id: l.id,
    title: l.title,
    titleSn: l.titleSn || l.title,
    titleNd: l.titleNd || l.title,
    location: l.location,
    area: l.area,
    type: l.type.toLowerCase() as PropertyType,
    listingType: (l.listingType === 'SALE' ? 'sale' : 'rent') as ListingType,
    price: l.price,
    currency: (l.currency || 'USD') as 'USD' | 'ZWL',
    priceDisplay: l.priceDisplay,
    size: l.size,
    description: l.description,
    descriptionSn: l.descriptionSn || l.description,
    descriptionNd: l.descriptionNd || l.description,
    images: l.images,
    featured: l.featured,
    agent: l.agent?.name ?? '',
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = await getDb()
  if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

  const listing = await db.listing.findUnique({
    where: { id, status: 'AVAILABLE' },
    include: { agent: true },
  })

  if (!listing) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json({ listing: normalizeDbListing(listing) })
}
