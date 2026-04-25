import { Phone, Mail, MapPin } from 'lucide-react'
import { useLanguage } from './LanguageContext'

export default function AgentCard({ agent }) {
  const { t, locale } = useLanguage()
  const role = locale === 'sn' ? agent.roleSn : locale === 'nd' ? agent.roleNd : agent.role
  const bio  = locale === 'sn' ? agent.bioSn  : locale === 'nd' ? agent.bioNd  : agent.bio
  const branchLabel = agent.branch === 'harare' ? t.agents.harare : t.agents.marondera

  return (
    <div className="card-hover bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100">
      <div className="h-36 mercers-gradient flex items-center justify-center relative">
        <div className="w-18 h-18 w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-3xl font-bold text-white">
            {agent.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </span>
        </div>
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <span className="text-xs font-semibold px-3 py-1 rounded-full text-white" style={{ background: 'rgba(201,165,76,0.85)' }}>{branchLabel}</span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-lg">{agent.name}</h3>
        <p className="text-sm font-medium text-gold-500 mb-3">{role}</p>
        <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">{bio}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {agent.specialties.map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full font-medium bg-navy-50 text-navy-800">{s}</span>
          ))}
        </div>
        <div className="space-y-2 pt-3 border-t border-gray-100">
          <a href={`tel:${agent.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-navy-800 transition-colors"><Phone size={14} className="text-gold-500" />{agent.phone}</a>
          <a href={`mailto:${agent.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-navy-800 transition-colors"><Mail size={14} className="text-gold-500" />{agent.email}</a>
          <div className="flex items-center gap-2 text-sm text-gray-500"><MapPin size={14} className="text-gold-500" />{branchLabel}</div>
        </div>
      </div>
    </div>
  )
}
