'use client'

import Link from 'next/link'
import { Mountain, MapPin, Phone, Mail } from 'lucide-react'
import { useLanguage } from './LanguageContext'

const SocialIcon = ({ platform }: { platform: 'facebook' | 'instagram' | 'linkedin' | 'x' }) => {
  const paths: Record<string, string> = {
    facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
    instagram: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01M21 6.5A5.5 5.5 0 0 0 15.5 1h-7A5.5 5.5 0 0 0 3 6.5v11A5.5 5.5 0 0 0 8.5 23h7a5.5 5.5 0 0 0 5.5-5.5z',
    linkedin: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      {platform === 'x' ? (
        <path d={paths.x} stroke="none" fill="currentColor" />
      ) : (
        <path d={paths[platform]} />
      )}
    </svg>
  )
}

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer style={{ background: '#0d1f3c' }} className="text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: '#1B3A6B' }}>
                <Mountain size={22} color="#C9A54C" />
              </div>
              <div>
                <span className="font-bold text-xl block text-white">Mercers</span>
                <span className="text-xs" style={{ color: '#C9A54C' }}>Zimbabwe</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">{t.footer.tagline}</p>
            <p className="text-xs text-gray-500">{t.footer.council}</p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{t.footer.quickLinks}</h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: t.nav.home },
                { href: '/listings', label: t.nav.listings },
                { href: '/agents', label: t.nav.agents },
                { href: '/contact', label: t.nav.contact },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Offices */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{t.footer.contactUs}</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0" style={{ color: '#C9A54C' }} />
                <span>19 Kay Gardens, Kensington, Harare</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-gray-500">
                <span style={{ color: '#C9A54C' }}>✦</span>
                <span>Agents nationwide — Harare, Marondera, Victoria Falls &amp; more</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} style={{ color: '#C9A54C' }} />
                <a href="mailto:info@mercers.co.zw" className="hover:text-white transition-colors">info@mercers.co.zw</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} style={{ color: '#C9A54C' }} />
                <a href="tel:+2634000000" className="hover:text-white transition-colors">+263 4 000 0000</a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{t.footer.follow}</h4>
            <div className="flex gap-3">
              {(['facebook', 'instagram', 'linkedin', 'x'] as const).map(platform => (
                <a
                  key={platform}
                  href="#"
                  aria-label={platform}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <SocialIcon platform={platform} />
                </a>
              ))}
            </div>
            <div className="mt-6 p-3 rounded-lg" style={{ background: 'rgba(201,165,76,0.15)', border: '1px solid rgba(201,165,76,0.3)' }}>
              <p className="text-xs text-gray-400">Registered Member</p>
              <p className="text-xs text-white font-medium mt-0.5">Estate Agents Council of Zimbabwe</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 text-center text-xs text-gray-500">
          {t.footer.rights}
        </div>
      </div>
    </footer>
  )
}
