'use client'

import { useEffect, useState } from 'react'
import { Users, ArrowRight, Loader2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import AgentCard from '@/components/AgentCard'
import ContactAgentModal from '@/components/ContactAgentModal'
import { useLanguage } from '@/components/LanguageContext'
import type { Agent } from '@/lib/data/agents'
import Link from 'next/link'

type DbAgent = {
  id: string
  name: string
  role: string
  roleSn: string | null
  roleNd: string | null
  email: string
  phone: string
  bio: string
  bioSn: string | null
  bioNd: string | null
  specialties: string[]
  regionalPresence: string[]
  image: string | null
}

function normalizeAgent(a: DbAgent): Agent {
  const role = a.role || 'Property Consultant'
  const bio = a.bio || ''
  return {
    id: a.id,
    name: a.name,
    role,
    roleSn: a.roleSn || role,
    roleNd: a.roleNd || role,
    email: a.email,
    phone: a.phone || '',
    bio,
    bioSn: a.bioSn || bio,
    bioNd: a.bioNd || bio,
    specialties: a.specialties || [],
    regionalPresence: a.regionalPresence || [],
    image: a.image || '',
  }
}

export default function AgentsPage() {
  const { t } = useLanguage()
  const [agents, setAgents] = useState<Agent[]>([])
  const [rawAgents, setRawAgents] = useState<DbAgent[]>([])
  const [fetching, setFetching] = useState(true)
  const [contactAgent, setContactAgent] = useState<DbAgent | null>(null)

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(d => {
        const raw: DbAgent[] = d.agents ?? []
        setRawAgents(raw)
        setAgents(raw.map(normalizeAgent))
      })
      .finally(() => setFetching(false))
  }, [])

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
          {fetching ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="animate-spin text-gray-400" size={28} />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <Users size={40} className="mx-auto mb-4 opacity-30" />
              <p>Our team profiles are coming soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {agents.map((agent, i) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onContact={() => setContactAgent(rawAgents[i])}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <ChatWidget />

      {contactAgent && (
        <ContactAgentModal
          agent={contactAgent}
          onClose={() => setContactAgent(null)}
        />
      )}
    </div>
  )
}
