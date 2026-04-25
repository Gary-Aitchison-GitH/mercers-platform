import { Link } from 'react-router-dom'
import { Mountain, MapPin, Phone, Mail } from 'lucide-react'
import { useLanguage } from './LanguageContext'

const SocialIcon = ({ platform }) => {
  const paths = {
    facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
    instagram: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01M21 6.5A5.5 5.5 0 0 0 15.5 1h-7A5.5 5.5 0 0 0 3 6.5v11A5.5 5.5 0 0 0 8.5 23h7a5.5 5.5 0 0 0 5.5-5.5z',
    linkedin: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={platform === 'x' ? 'none' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
      <path d={paths[platform]} fill={platform === 'x' ? 'currentColor' : 'none'} />
    </svg>
  )
}

export default function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="bg-navy-950 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded bg-navy-800 flex items-center justify-center">
                <Mountain size={22} color="#C9A54C" />
              </div>
              <div>
                <span className="font-bold text-xl block">Mercers</span>
                <span className="text-xs text-gold-500">Kensington</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-3">{t.footer.tagline}</p>
            <p className="text-xs text-gray-500">{t.footer.council}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">{t.footer.quickLinks}</h4>
            <ul className="space-y-2">
              {[['/', t.nav.home],['/listings', t.nav.listings],['/agents', t.nav.agents],['/contact', t.nav.contact]].map(([to, label]) => (
                <li key={to}><Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">{t.footer.contactUs}</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0 text-gold-500" /><span>19 Kay Gardens, Kensington, Harare</span></li>
              <li className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0 text-gold-500" /><span>Marondera, Mashonaland East</span></li>
              <li className="flex items-center gap-2"><Mail size={14} className="text-gold-500" /><a href="mailto:info@mercers.co.zw" className="hover:text-white transition-colors">info@mercers.co.zw</a></li>
              <li className="flex items-center gap-2"><Phone size={14} className="text-gold-500" /><a href="tel:+2634000000" className="hover:text-white transition-colors">+263 4 000 0000</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">{t.footer.follow}</h4>
            <div className="flex gap-3 mb-6">
              {['facebook','instagram','linkedin','x'].map(p => (
                <a key={p} href="#" aria-label={p} className="w-9 h-9 rounded-lg bg-white/8 flex items-center justify-center text-gray-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <SocialIcon platform={p} />
                </a>
              ))}
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(201,165,76,0.15)', border: '1px solid rgba(201,165,76,0.3)' }}>
              <p className="text-xs text-gray-400">PropertyBook Member</p>
              <p className="text-xs text-white font-medium mt-0.5">Estate Agents Council of Zimbabwe</p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-12 pt-6 text-center text-xs text-gray-500">{t.footer.rights}</div>
      </div>
    </footer>
  )
}
