import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mountain, Menu, X } from 'lucide-react'
import { useLanguage } from './LanguageContext'

const LOCALES = ['en', 'sn', 'nd']

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { t, locale, setLocale } = useLanguage()

  const links = [
    { to: '/',        label: t.nav.home },
    { to: '/listings', label: t.nav.listings },
    { to: '/agents',   label: t.nav.agents },
    { to: '/contact',  label: t.nav.contact },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded flex items-center justify-center bg-navy-800">
            <Mountain size={20} color="white" />
          </div>
          <div>
            <span className="font-bold text-lg leading-none block text-navy-800">Mercers</span>
            <span className="text-xs leading-none text-gold-500">Kensington</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-gray-700 hover:text-navy-800 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-gray-200 rounded-full px-2 py-1">
            {LOCALES.map(l => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${locale === l ? 'bg-navy-800 text-white' : 'text-gray-500 hover:text-navy-800'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <Link to="/contact" className="hidden md:inline-flex px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 transition-colors">
            {t.nav.contact}
          </Link>
          <button className="md:hidden p-2 text-gray-700" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 py-3 px-4 space-y-1">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-navy-50 hover:text-navy-800 rounded-lg">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
