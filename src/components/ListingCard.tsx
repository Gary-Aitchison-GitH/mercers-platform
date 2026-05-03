'use client'

import { MapPin, ArrowRight, Home, Building2, Warehouse, Leaf } from 'lucide-react'
import { Listing } from '@/lib/data/listings'
import { useLanguage } from './LanguageContext'
import Link from 'next/link'

const typeIcons = {
  residential: Home,
  commercial: Building2,
  industrial: Warehouse,
  agricultural: Leaf,
}

const typeBg: Record<string, string> = {
  residential: '#1B3A6B',
  commercial: '#2a5aa8',
  industrial: '#224a8a',
  agricultural: '#1a5c3a',
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const { t, locale } = useLanguage()
  const Icon = typeIcons[listing.type]

  const title = locale === 'sn' ? listing.titleSn : locale === 'nd' ? listing.titleNd : listing.title
  const description = locale === 'sn' ? listing.descriptionSn : locale === 'nd' ? listing.descriptionNd : listing.description
  const filterLabel = t.listings.filters[listing.type]

  return (
    <div className="card-hover bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 flex flex-col">
      {/* Image */}
      <div className="relative h-52 flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${typeBg[listing.type]}22 0%, ${typeBg[listing.type]}44 100%)` }}>
        {listing.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.images[0]} alt={listing.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: typeBg[listing.type] }}>
            <Icon size={28} color="white" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: typeBg[listing.type] }}>
            {filterLabel}
          </span>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ background: listing.listingType === 'sale' ? '#C9A54C' : '#1B3A6B' }}
          >
            {listing.listingType === 'sale' ? t.listings.forSale : t.listings.forRent}
          </span>
        </div>
        {listing.featured && (
          <div className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#C9A54C', color: 'white' }}>
            ★ Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <MapPin size={12} />
          <span>{listing.location}</span>
          <span className="text-gray-300">·</span>
          <span>{listing.size}</span>
        </div>
        <h3 className="font-bold text-gray-900 mb-2 leading-snug line-clamp-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4 flex-1">{description}</p>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <span className="font-bold text-lg" style={{ color: '#1B3A6B' }}>{listing.priceDisplay}</span>
          <Link
            href={`/listings/${listing.id}`}
            className="flex items-center gap-1 text-sm font-semibold hover:gap-2 transition-all"
            style={{ color: '#C9A54C' }}
          >
            {t.listings.viewMore}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
