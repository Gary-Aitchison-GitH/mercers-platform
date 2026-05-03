'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Home, Building2, Warehouse, Leaf, ArrowLeft, User, Tag, Ruler, Heart, Loader2, AlertCircle, ChevronLeft, ChevronRight, X, Expand } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import RegisterInterestModal from '@/components/RegisterInterestModal'
import { useLanguage } from '@/components/LanguageContext'
import type { Listing } from '@/lib/data/listings'

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

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t, locale } = useLanguage()
  const [listing, setListing] = useState<Listing | null>(null)
  const [fetching, setFetching] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [showInterest, setShowInterest] = useState(false)

  const prevImage = useCallback((images: string[]) => setActiveImage(i => (i - 1 + images.length) % images.length), [])
  const nextImage = useCallback((images: string[]) => setActiveImage(i => (i + 1) % images.length), [])

  useEffect(() => {
    if (!listing || listing.images.length <= 1) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prevImage(listing!.images)
      if (e.key === 'ArrowRight') nextImage(listing!.images)
      if (e.key === 'Escape') setLightbox(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [listing, prevImage, nextImage])

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then(d => { if (d) setListing(d.listing) })
      .finally(() => setFetching(false))
  }, [id])

  if (fetching) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
        <Footer />
      </div>
    )
  }

  if (notFound || !listing) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24 px-4">
          <AlertCircle size={40} className="text-gray-300" />
          <p className="text-gray-500 text-lg">This listing is no longer available.</p>
          <Link href="/listings" className="text-sm font-semibold" style={{ color: '#1B3A6B' }}>
            ← Back to all listings
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  const Icon = typeIcons[listing.type] ?? Home
  const accentColor = typeBg[listing.type] ?? '#1B3A6B'
  const title = locale === 'sn' ? listing.titleSn : locale === 'nd' ? listing.titleNd : listing.title
  const description = locale === 'sn' ? listing.descriptionSn : locale === 'nd' ? listing.descriptionNd : listing.description
  const filterLabel = t.listings.filters[listing.type]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero image */}
      <div style={{ background: '#F9F8F5' }} className="px-4 sm:px-6 lg:px-8 pt-6 pb-0">
        <div className="max-w-5xl mx-auto">
          <div className="relative w-full rounded-2xl overflow-hidden bg-gray-100" style={{ height: '420px' }}>
            {listing.images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.images[activeImage]}
                alt={listing.title}
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => setLightbox(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}55)` }}>
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: accentColor }}>
                  <Icon size={36} color="white" />
                </div>
              </div>
            )}

            {/* Overlay badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ background: accentColor }}>
                {filterLabel}
              </span>
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full text-white"
                style={{ background: listing.listingType === 'sale' ? '#C9A54C' : '#1B3A6B' }}
              >
                {listing.listingType === 'sale' ? t.listings.forSale : t.listings.forRent}
              </span>
              {listing.featured && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ background: '#C9A54C' }}>
                  ★ Featured
                </span>
              )}
            </div>

            {/* Back button */}
            <button
              onClick={() => router.back()}
              className="absolute top-4 right-4 flex items-center gap-1.5 text-sm font-semibold bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow hover:bg-white transition-colors"
              style={{ color: '#1B3A6B' }}
            >
              <ArrowLeft size={14} />
              Back
            </button>

            {/* Prev / Next arrows */}
            {listing.images.length > 1 && (
              <>
                <button
                  onClick={() => prevImage(listing.images)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => nextImage(listing.images)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                  aria-label="Next photo"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {listing.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`rounded-full transition-all ${i === activeImage ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setLightbox(true)}
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                  aria-label="View fullscreen"
                >
                  <Expand size={14} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {listing.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-3">
              {listing.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImage ? 'border-[#C9A54C]' : 'border-transparent'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8" style={{ background: '#F9F8F5' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <MapPin size={14} />
                <span>{listing.location}</span>
                {listing.area && listing.area !== listing.location && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span>{listing.area}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">{title}</h1>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: Tag, label: 'Type', value: filterLabel },
                { icon: Ruler, label: 'Size', value: listing.size },
                { icon: User, label: 'Agent', value: listing.agent || 'Mercers' },
              ].map(({ icon: StatIcon, label, value }) => (
                <div key={label} className="bg-white rounded-xl p-4 flex items-start gap-3 border border-gray-100">
                  <StatIcon size={16} className="mt-0.5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-3">{t.listingDetail.aboutProperty}</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
            </div>
          </div>

          {/* Right: price + enquire */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 border border-gray-100 sticky top-20">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
                {listing.listingType === 'sale' ? t.listingDetail.askingPrice : t.listingDetail.rentalPrice}
              </p>
              <p className="text-3xl font-bold mb-4" style={{ color: '#1B3A6B' }}>{listing.priceDisplay}</p>

              <button
                onClick={() => setShowInterest(true)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: '#1B3A6B' }}
              >
                <Heart size={15} />
                {t.listingDetail.registerInterest}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                {t.listingDetail.chatPrompt}
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium">{t.listingDetail.listedBy}</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: accentColor }}>
                  {(listing.agent || 'M').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{listing.agent || 'Mercers Kensington'}</p>
                  <p className="text-xs text-gray-400">Mercers Kensington</p>
                </div>
              </div>
            </div>

            <Link
              href="/listings"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={14} />
              All listings
            </Link>
          </div>
        </div>
      </main>

      <Footer />
      <ChatWidget />

      {showInterest && listing && (
        <RegisterInterestModal
          listing={listing}
          onClose={() => setShowInterest(false)}
        />
      )}

      {/* Lightbox */}
      {lightbox && listing && listing.images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={listing.images[activeImage]}
            alt={listing.title}
            className="max-h-[90vh] max-w-[90vw] object-contain select-none"
            onClick={e => e.stopPropagation()}
          />

          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={20} />
          </button>

          {listing.images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prevImage(listing.images) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); nextImage(listing.images) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight size={24} />
              </button>
              <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                {activeImage + 1} / {listing.images.length}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
