'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Mountain, LogOut, LayoutDashboard } from 'lucide-react'
import { useLanguage } from './LanguageContext'
import { useAuth } from '@/lib/auth-context'
import { Locale } from '@/lib/translations'

const localeLabels: Record<Locale, string> = {
  en: 'EN',
  sn: 'SN',
  nd: 'ND',
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { t, locale, setLocale } = useLanguage()
  const { user, role, signOut } = useAuth()

  const isStaff = ['agent', 'admin', 'dev'].includes(role ?? '')

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/listings', label: t.nav.listings },
    { href: '/agents', label: t.nav.agents },
    { href: '/contact', label: t.nav.contact },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background: '#1B3A6B' }}>
              <Mountain size={20} color="white" />
            </div>
            <div>
              <span className="font-bold text-lg leading-none block" style={{ color: '#1B3A6B' }}>Mercers</span>
              <span className="text-xs leading-none" style={{ color: '#C9A54C' }}>Kensington</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-[#1B3A6B] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">

            {/* Language switcher */}
            <div className="hidden sm:flex items-center gap-1 border border-gray-200 rounded-full px-2 py-1">
              {(Object.keys(localeLabels) as Locale[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
                    locale === l ? 'text-white' : 'text-gray-500 hover:text-[#1B3A6B]'
                  }`}
                  style={locale === l ? { background: '#1B3A6B' } : {}}
                >
                  {localeLabels[l]}
                </button>
              ))}
            </div>

            {/* Auth — logged out */}
            {!user && (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-[#1B3A6B] transition-colors px-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: '#C9A54C' }}
                >
                  Get started
                </Link>
              </div>
            )}

            {/* Auth — logged in */}
            {user && (
              <div className="hidden md:flex items-center gap-2">
                {isStaff && (
                  <Link
                    href="/agents/dashboard"
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-[#1B3A6B] transition-colors"
                  >
                    <LayoutDashboard size={15} />
                    Portal
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-gray-700"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#1B3A6B] rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-3 mt-2 border-t border-gray-100 space-y-1">
              {user ? (
                <>
                  {isStaff && (
                    <Link
                      href="/agents/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <LayoutDashboard size={15} />
                      Agent Portal
                    </Link>
                  )}
                  <button
                    onClick={() => { signOut(); setOpen(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-lg"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-center text-white"
                    style={{ background: '#C9A54C' }}
                  >
                    Get started — it&apos;s free
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-center text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    Already have an account? Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
