'use client'

import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import ListingCard from '@/components/ListingCard'
import { useLanguage } from '@/components/LanguageContext'
import type { Listing, PropertyType, ListingType } from '@/lib/data/listings'

type Filter = PropertyType | 'all'

export default function ListingsPage() {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [listingType, setListingType] = useState<ListingType | 'all'>('all')
  const [listings, setListings] = useState<Listing[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(d => setListings(d.listings ?? []))
      .finally(() => setFetching(false))
  }, [])

  const filterOptions: { key: Filter; label: string }[] = [
    { key: 'all', label: t.listings.filters.all },
    { key: 'residential', label: t.listings.filters.residential },
    { key: 'commercial', label: t.listings.filters.commercial },
    { key: 'industrial', label: t.listings.filters.industrial },
    { key: 'agricultural', label: t.listings.filters.agricultural },
  ]

  const filtered = listings.filter(l => {
    const matchType = filter === 'all' || l.type === filter
    const matchListing = listingType === 'all' || l.listingType === listingType
    const matchSearch =
      !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.location.toLowerCase().includes(search.toLowerCase()) ||
      l.area.toLowerCase().includes(search.toLowerCase())
    return matchType && matchListing && matchSearch
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Header */}
      <section className="mercers-gradient py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-3">{t.listings.title}</h1>
          <p className="text-blue-200 mb-8">{t.listings.subtitle}</p>

          {/* Search */}
          <div className="flex gap-3 max-w-2xl">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-xl px-4 py-3">
              <Search size={18} className="text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.hero.searchPlaceholder}
                className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400 bg-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4 overflow-x-auto">
          <SlidersHorizontal size={16} className="text-gray-400 shrink-0" />

          <div className="flex gap-2 shrink-0">
            {filterOptions.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === key ? 'text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
                style={filter === key ? { background: '#1B3A6B' } : {}}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-gray-200 shrink-0" />

          <div className="flex gap-2 shrink-0">
            {[
              { key: 'all' as const, label: t.listings.allType },
              { key: 'sale' as const, label: t.listings.forSale },
              { key: 'rent' as const, label: t.listings.forRent },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setListingType(key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  listingType === key ? 'text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
                style={listingType === key ? { background: '#C9A54C' } : {}}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8" style={{ background: '#F9F8F5' }}>
        <div className="max-w-7xl mx-auto">
          {fetching ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="animate-spin text-gray-400" size={28} />
            </div>
          ) : (
          <>
          <p className="text-sm text-gray-500 mb-6">{filtered.length} {filtered.length === 1 ? t.listings.foundSingular : t.listings.found}</p>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="text-gray-400 text-lg">{t.listings.noFound}</p>
              <button onClick={() => { setSearch(''); setFilter('all'); setListingType('all') }} className="mt-4 text-sm font-medium" style={{ color: '#1B3A6B' }}>
                {t.listings.clearFilters}
              </button>
            </div>
          )}
          </>
          )}
        </div>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  )
}
