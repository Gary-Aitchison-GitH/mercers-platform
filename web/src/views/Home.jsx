import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin, TrendingUp, Users, Shield, Search, ArrowRight
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ListingCard from '../components/ListingCard'
import AgentCard from '../components/AgentCard'
import ChatWidget from '../components/ChatWidget'
import { useLanguage } from '../components/LanguageContext'
import { listings, agents } from '../services/data'

const STATS = [
  { icon: MapPin,     value: '9+',      label: 'Active Listings' },
  { icon: TrendingUp, value: '20+',     label: 'Years Experience' },
  { icon: Users,      value: '4',       label: 'Agents' },
  { icon: Shield,     value: 'EACZ',    label: 'Council Member' },
]

export default function Home() {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const featured = listings.filter(l => l.featured).slice(0, 3)

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      {/* ── Hero ── */}
      <section className="mercers-gradient relative overflow-hidden py-20 px-4">
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 75% 25%, rgba(201,165,76,0.12) 0%, transparent 55%),' +
              'radial-gradient(ellipse at 25% 75%, rgba(201,165,76,0.07) 0%, transparent 45%)',
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
            {t.hero.tagline}
          </h1>
          <p className="text-blue-100 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            {t.hero.subtitle}
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-xl shadow-lg px-4 py-3">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.hero.searchPlaceholder}
                className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none"
              />
            </div>
            <Link
              to={`/listings${search ? `?q=${encodeURIComponent(search)}` : ''}`}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white text-center transition-opacity hover:opacity-90"
              style={{ background: '#C9A54C' }}
            >
              {t.hero.searchBtn}
            </Link>
          </div>

          <div className="mt-6">
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 text-sm text-blue-200 hover:text-white transition-colors underline underline-offset-4"
            >
              {t.hero.talkToAgent} <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-white border-b border-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-navy-50 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-navy-800" />
              </div>
              <div>
                <p className="text-xl font-bold text-navy-800 leading-none">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Listings ── */}
      <section className="bg-surface py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-gold-500 mb-1">Properties</p>
              <h2 className="text-3xl font-bold text-navy-800">{t.listings.title}</h2>
            </div>
            <Link
              to="/listings"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-gold-500 transition-colors"
            >
              {t.listings.allListings} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/listings"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-gold-500 transition-colors"
            >
              {t.listings.allListings} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── About strip ── */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-gold-500 mb-2">About Us</p>
            <h2 className="text-3xl font-bold text-navy-800 mb-4">{t.about.title}</h2>
            <p className="text-gray-600 leading-relaxed mb-8">{t.about.body}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-4 border border-navy-100 bg-navy-50">
                <Shield size={20} className="text-navy-800 mb-2" />
                <p className="font-bold text-navy-800 text-sm">{t.about.council}</p>
                <p className="text-xs text-gray-500 mt-0.5">Est. Agents Council of Zimbabwe</p>
              </div>
              <div className="rounded-xl p-4 border border-gold-100 bg-gold-50">
                <MapPin size={20} className="text-gold-500 mb-2" />
                <p className="font-bold text-navy-800 text-sm">{t.about.branches}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.about.branchesDetail}</p>
              </div>
            </div>
          </div>

          {/* Right: office card */}
          <div className="mercers-gradient rounded-2xl p-7 text-white">
            <p className="text-xs font-semibold tracking-widest uppercase text-gold-400 mb-5">Our Offices</p>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={15} color="#C9A54C" />
                </div>
                <div>
                  <p className="font-bold text-sm">Harare — Head Office</p>
                  <p className="text-blue-200 text-sm mt-0.5">19 Kay Gardens, Kensington, Harare</p>
                  <p className="text-blue-300 text-xs mt-1">+263 4 000 0000</p>
                </div>
              </div>
              <div className="border-t border-white/10" />
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={15} color="#C9A54C" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm">Marondera — New Branch</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#C9A54C' }}>NEW</span>
                  </div>
                  <p className="text-blue-200 text-sm">Marondera, Mashonaland East</p>
                  <p className="text-blue-300 text-xs mt-1">+263 79 000 0000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Agents ── */}
      <section className="bg-surface py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-gold-500 mb-1">Our Team</p>
            <h2 className="text-3xl font-bold text-navy-800">{t.agents.title}</h2>
            <p className="text-gray-500 mt-2">{t.agents.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {agents.map(a => <AgentCard key={a.id} agent={a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mercers-gradient py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-gold-400 mb-3">Get Started</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Find Your Property?
          </h2>
          <p className="text-blue-200 mb-8 text-lg">
            Contact our team today or browse all available listings across Zimbabwe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="px-8 py-3.5 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#C9A54C' }}
            >
              {t.nav.contact}
            </Link>
            <Link
              to="/listings"
              className="px-8 py-3.5 rounded-xl font-semibold text-white border border-white/25 hover:bg-white/10 transition-colors"
            >
              {t.listings.allListings}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <ChatWidget />
    </div>
  )
}
