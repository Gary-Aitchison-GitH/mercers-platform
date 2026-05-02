'use client'

import { Users, ArrowRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import AgentCard from '@/components/AgentCard'
import { useLanguage } from '@/components/LanguageContext'
import { agents } from '@/lib/data/agents'
import Link from 'next/link'

export default function AgentsPage() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Header */}
      <section className="mercers-gradient py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-3">{t.agents.title}</h1>
          <p className="text-blue-200 max-w-2xl">{t.agents.subtitle}</p>
        </div>
      </section>

      {/* Collaboration banner */}
      <section className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: '#eef4fd' }}>
            <Users size={24} style={{ color: '#1B3A6B' }} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#1B3A6B' }}>{t.agents.collaboration}</h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">{t.agents.collaborationBody}</p>
          </div>
          <Link
            href="/contact"
            className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-opacity hover:opacity-80"
            style={{ color: '#C9A54C' }}
          >
            Talk to the team <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8" style={{ background: '#F9F8F5' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {agents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  )
}
