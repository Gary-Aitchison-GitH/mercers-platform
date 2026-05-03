'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, Shield, MapPin, TrendingUp, Users } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import ListingCard from '@/components/ListingCard'
import AgentCard from '@/components/AgentCard'
import IntakeWidget from '@/components/IntakeWidget'
import { useLanguage } from '@/components/LanguageContext'
import { getFeaturedListings } from '@/lib/data/listings'
import { agents } from '@/lib/data/agents'

export default function HomePage() {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const featured = getFeaturedListings()

  const stats = [
    { label: t.stats.activeListings, value: '9+', icon: MapPin },
    { label: t.stats.yearsExperience, value: '20+', icon: TrendingUp },
    { label: t.stats.agentsNationwide, value: '4', icon: Users },
    { label: t.stats.councilMember, value: 'EACZ', icon: Shield },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="mercers-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 70% 50%, #C9A54C 0%, transparent 60%)',
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: 'rgba(201,165,76,0.2)', color: '#C9A54C', border: '1px solid rgba(201,165,76,0.4)' }}>
              <Shield size={12} />
              {t.hero.councilBadge}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {t.hero.tagline}
            </h1>
            <p className="text-lg text-blue-100 mb-10 max-w-xl leading-relaxed">
              {t.hero.subtitle}
            </p>

            {/* Search bar */}
            <div className="flex gap-3 max-w-2xl">
              <div className="flex-1 flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-lg">
                <Search size={18} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t.hero.searchPlaceholder}
                  className="flex-1 text-sm text-gray-700 outline-none bg-transparent placeholder-gray-400"
                />
              </div>
              <Link
                href={`/listings${search ? `?q=${encodeURIComponent(search)}` : ''}`}
                className="px-6 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 flex items-center gap-2 whitespace-nowrap"
                style={{ background: '#C9A54C' }}
              >
                {t.hero.searchBtn}
              </Link>
            </div>

            <button
              onClick={() => document.getElementById('chat-trigger')?.click()}
              className="mt-5 text-sm text-blue-200 hover:text-white transition-colors flex items-center gap-2"
            >
              <span>✦</span> {t.hero.talkToAgent}
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#eef4fd' }}>
                  <Icon size={18} style={{ color: '#1B3A6B' }} />
                </div>
                <div>
                  <p className="font-bold text-xl" style={{ color: '#1B3A6B' }}>{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Find Your Agent — AI Intake */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ background: '#eef4fd', color: '#1B3A6B' }}>
                <Users size={12} />
                {t.hero.agentMatchingLabel}
              </div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: '#1B3A6B' }}>
                {t.hero.agentMatchingTitle}
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                {t.hero.agentMatchingBody}
              </p>
              <p className="text-sm text-gray-400">
                {t.hero.agentMatchingNote}
              </p>
            </div>
            <div>
              <IntakeWidget />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: '#F9F8F5' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#1B3A6B' }}>{t.listings.title}</h2>
              <p className="text-gray-500 text-sm">{t.listings.subtitle}</p>
            </div>
            <Link
              href="/listings"
              className="hidden sm:flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: '#C9A54C' }}
            >
              {t.listings.allListings}
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: '#C9A54C' }}
            >
              {t.listings.allListings} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* About strip */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-5" style={{ color: '#1B3A6B' }}>{t.about.title}</h2>
              <p className="text-gray-600 leading-relaxed mb-6">{t.about.body}</p>
              <div className="flex gap-8">
                <div>
                  <p className="font-bold text-2xl" style={{ color: '#C9A54C' }}>EACZ</p>
                  <p className="text-sm text-gray-500">{t.about.council}</p>
                </div>
                <div>
                  <p className="font-bold text-2xl" style={{ color: '#C9A54C' }}>{t.about.coverage}</p>
                  <p className="text-sm text-gray-500">{t.about.coverageDetail}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-8 mercers-gradient text-white">
              <h3 className="text-xl font-bold mb-4">{t.agents.collaboration}</h3>
              <p className="text-sm text-blue-100 leading-relaxed mb-5">{t.agents.collaborationBody}</p>
              <div className="space-y-3 text-sm text-blue-100">
                <div className="flex items-start gap-3">
                  <MapPin size={14} className="mt-0.5 shrink-0" style={{ color: '#C9A54C' }} />
                  <div>
                    <p className="font-semibold text-white">{t.agents.headOffice}</p>
                    <p>19 Kay Gardens, Kensington, Harare</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users size={14} className="mt-0.5 shrink-0" style={{ color: '#C9A54C' }} />
                  <div>
                    <p className="font-semibold text-white">{t.agents.nationwide}</p>
                    <p>{t.agents.locations}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agents preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: '#F9F8F5' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#1B3A6B' }}>{t.agents.title}</h2>
            <p className="text-gray-500">{t.agents.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {agents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 mercers-gradient">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">{t.contact.title}</h2>
          <p className="text-blue-100 mb-8">{t.hero.subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-3 rounded-xl font-semibold transition-opacity hover:opacity-90 text-center"
              style={{ background: '#C9A54C', color: 'white' }}
            >
              {t.contact.title}
            </Link>
            <Link
              href="/listings"
              className="px-8 py-3 rounded-xl font-semibold border-2 border-white/30 hover:bg-white/10 transition-colors text-center"
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
