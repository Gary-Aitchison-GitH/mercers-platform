'use client'

import { Phone, Mail, MapPin } from 'lucide-react'
import { Agent } from '@/lib/data/agents'
import { useLanguage } from './LanguageContext'

type Props = {
  agent: Agent
  onContact?: () => void
}

export default function AgentCard({ agent, onContact }: Props) {
  const { t, locale } = useLanguage()

  const role = locale === 'sn' ? agent.roleSn : locale === 'nd' ? agent.roleNd : agent.role
  const bio = locale === 'sn' ? agent.bioSn : locale === 'nd' ? agent.bioNd : agent.bio
  const initials = agent.name.split(' ').map(n => n[0]).slice(0, 2).join('')

  return (
    <div className="card-hover bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 flex flex-col">
      {/* Avatar */}
      <div className="h-56 flex items-center justify-center mercers-gradient relative overflow-hidden">
        {agent.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={agent.image} alt={agent.name} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center 35%' }} />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">{initials}</span>
          </div>
        )}
        {agent.regionalPresence[0] && (
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="text-xs font-semibold px-3 py-1 rounded-full text-white" style={{ background: 'rgba(201,165,76,0.85)' }}>
              {agent.regionalPresence[0]}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-lg">{agent.name}</h3>
        <p className="text-sm font-medium mb-3" style={{ color: '#C9A54C' }}>{role}</p>

        {bio && (
          <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">{bio}</p>
        )}

        {/* Specialties */}
        {agent.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {agent.specialties.map(s => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#eef4fd', color: '#1B3A6B' }}>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Contact details */}
        <div className="space-y-2 pt-3 border-t border-gray-100 mt-auto">
          {agent.phone && (
            <a href={`tel:${agent.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1B3A6B] transition-colors">
              <Phone size={14} style={{ color: '#C9A54C' }} />
              {agent.phone}
            </a>
          )}
          <a href={`mailto:${agent.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1B3A6B] transition-colors">
            <Mail size={14} style={{ color: '#C9A54C' }} />
            {agent.email}
          </a>
          {agent.regionalPresence.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin size={14} style={{ color: '#C9A54C' }} />
              <span>{agent.regionalPresence.join(' · ')}</span>
            </div>
          )}
        </div>

        {/* Direct contact button */}
        {onContact && (
          <button
            onClick={onContact}
            className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: '#1B3A6B' }}
          >
            Contact {agent.name.split(' ')[0]}
          </button>
        )}
      </div>
    </div>
  )
}
