export type PropertyType = 'residential' | 'commercial' | 'industrial' | 'agricultural'
export type ListingType = 'sale' | 'rent'

export interface Listing {
  id: string
  title: string
  titleSn: string
  titleNd: string
  location: string
  area: string
  type: PropertyType
  listingType: ListingType
  price: number
  currency: 'USD' | 'ZWL'
  priceDisplay: string
  size: string
  description: string
  descriptionSn: string
  descriptionNd: string
  images: string[]
  featured: boolean
  agent: string
}

export const listings: Listing[] = []

export const getFeaturedListings = () => listings.filter(l => l.featured)
export const getListingsByType = (type: PropertyType) => listings.filter(l => l.type === type)
export const getListingsByArea = (area: string) => listings.filter(l => l.area.toLowerCase() === area.toLowerCase())
