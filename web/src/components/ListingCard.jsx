import { Link } from 'react-router-dom'
import { MapPin, ArrowRight, Home, Building2, Warehouse, Leaf } from 'lucide-react'
import { useLanguage } from './LanguageContext'

const icons = { residential: Home, commercial: Building2, industrial: Warehouse, agricultural: Leaf }
const colors = { residential: '#1B3A6B', commercial: '#2a5aa8', industrial: '#224a8a', agricultural: '#1a5c3a' }

export default function ListingCard({ listing }) {
  const { t, locale } = useLanguage()
  const Icon = icons[listing.type]
  const color = colors[listing.type]
  const title = locale === 'sn' ? listing.titleSn : locale === 'nd' ? listing.titleNd : listing.title
  const desc = locale === 'sn' ? listing.descriptionSn : locale === 'nd' ? listing.descriptionNd : listing.description

  return (
    <div className="card-hover bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 flex flex-col">
      <div className="relative h-48 flex items-center justify-center" style={{ background: `${color}18` }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: color }}>
          <Icon size={26} color="white" />
        </div>
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white capitalize" style={{ background: color }}>{t.listings.filters[listing.type]}</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: listing.listingType === 'sale' ? '#C9A54C' : '#1B3A6B' }}>
            {listing.listingType === 'sale' ? t.listings.forSale : t.listings.forRent}
          </span>
        </div>
        {listing.featured && (
          <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-gold-500 text-white">★ Featured</span>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <MapPin size={12} /><span>{listing.location}</span>
          <span className="text-gray-300">·</span><span>{listing.size}</span>
        </div>
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 leading-snug">{title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{desc}</p>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="font-bold text-lg text-navy-800">{listing.priceDisplay}</span>
          <Link to={`/listings/${listing.id}`} className="flex items-center gap-1 text-sm font-semibold text-gold-500 hover:gap-2 transition-all">
            {t.listings.viewMore} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
