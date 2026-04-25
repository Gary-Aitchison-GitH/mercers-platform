import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ListingCard from '../components/ListingCard'
import ChatWidget from '../components/ChatWidget'
import { useLanguage } from '../components/LanguageContext'
import { listings } from '../services/data'

const TYPES = ['all', 'residential', 'commercial', 'industrial', 'agricultural']
const LISTING_TYPES = [
  { key: 'all',  label: 'All' },
  { key: 'sale', label: 'For Sale' },
  { key: 'rent', label: 'For Rent' },
]

export default function Listings() {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [listingTypeFilter, setListingTypeFilter] = useState('all')

  const filtered = useMemo(() => {
    return listings.filter(l => {
      const matchType = typeFilter === 'all' || l.type === typeFilter
      const matchListingType = listingTypeFilter === 'all' || l.listingType === listingTypeFilter
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.area.toLowerCase().includes(q) ||
        l.priceDisplay.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q)
      return matchType && matchListingType && matchSearch
    })
  }, [search, typeFilter, listingTypeFilter])

  const typeLabel = (key) => {
    if (key === 'all') return t.listings.filters?.all || 'All'
    return t.listings.filters?.[key] || key.charAt(0).toUpperCase() + key.slice(1)
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      {/* ── Header ── */}
      <section className="mercers-gradient py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-gold-400 mb-2">Properties</p>
          <h1 className="text-4xl font-bold text-white mb-6">{t.listings.title}</h1>
          <div className="flex items-center gap-3 bg-white rounded-xl shadow-lg px-4 py-3 max-w-xl mx-auto">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.hero.searchPlaceholder}
              className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none"
            />
          </div>
        </div>
      </section>

      {/* ── Filter bar (sticky) ── */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 items-center">
          {/* Type filters */}
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map(key => (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize"
                style={
                  typeFilter === key
                    ? { background: '#1B3A6B', color: 'white' }
                    : { background: '#f3f4f6', color: '#374151' }
                }
              >
                {typeLabel(key)}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />

          {/* Listing type filters */}
          <div className="flex flex-wrap gap-1.5">
            {LISTING_TYPES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setListingTypeFilter(key)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors"
                style={
                  listingTypeFilter === key
                    ? { background: '#1B3A6B', color: 'white' }
                    : { background: '#f3f4f6', color: '#374151' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          <span className="ml-auto text-xs text-gray-400 font-medium">
            {filtered.length} {filtered.length === 1 ? 'listing' : 'listings'}
          </span>
        </div>
      </div>

      {/* ── Grid ── */}
      <main className="flex-1 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="text-gray-400 text-lg font-medium">No listings match your filters.</p>
              <button
                onClick={() => { setSearch(''); setTypeFilter('all'); setListingTypeFilter('all') }}
                className="mt-4 text-sm font-semibold text-navy-800 hover:text-gold-500 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  )
}
