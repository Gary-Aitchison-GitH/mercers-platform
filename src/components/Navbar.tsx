'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Mountain, LogOut, LayoutDashboard, MessageSquare } from 'lucide-react'
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
  const [unread, setUnread] = useState(0)

  const isStaff = ['agent', 'admin', 'dev'].includes(role ?? '')

  useEffect(() => {
    if (!user || !isStaff) return
    function fetchUnread() {
      user!.getIdToken().then(token =>
        fetch('/api/portal/threads/unread-count', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(d => { if (typeof d.count === 'number') setUnread(d.count) })
          .catch(() => {})
      )
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [user, isStaff]) // eslint-disable-line react-hooks/exhaustive-deps

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
          <div className="flex items-center gap-2">

            {/* Language switcher — always visible */}
            <div className="flex items-center gap-0.5 border border-gray-200 rounded-full px-1.5 py-1">
              {(Object.keys(localeLabels) as Locale[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded-full transition-colors ${
                    locale === l ? 'text-white' : 'text-gray-500 hover:text-[#1B3A6B]'
                  }`}
                  style={locale === l ? { background: '#1B3A6B' } : {}}
                >
                  {localeLabels[l]}
                </button>
              ))}
            </div>

            {/* Auth — logged out: Get started always visible, Sign in desktop only */}
            {!user && (
              <>
                <Link
                  href="/login"
                  className="hidden md:inline text-sm font-medium text-gray-600 hover:text-[#1B3A6B] transition-colors px-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                  style={{ background: '#C9A54C' }}
                >
                  Get started
                </Link>
              </>
            )}

            {/* Auth — logged in: desktop controls */}
            {user && (
              <div className="hidden md:flex items-center gap-2">
                {isStaff ? (
                  <Link
                    href="/agents/dashboard"
                    className="relative flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-[#1B3A6B] transition-colors"
                  >
                    <LayoutDashboard size={15} />
                    Portal
                    {unread > 0 && (
                      <span className="absolute -top-2.5 -right-4 min-w-[22px] h-[22px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1.5 shadow-sm">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </Link>
                ) : (
                  <Link
                    href="/portal/client"
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-[#1B3A6B] transition-colors"
                  >
                    <MessageSquare size={15} />
                    My Portal
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

            {/* Hamburger — nav links + signed-in controls on mobile */}
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
                  {isStaff ? (
                    <Link
                      href="/agents/dashboard"
                      onClick={() => setOpen(false)}
                      className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <LayoutDashboard size={15} />
                      Agent Portal
                      {unread > 0 && (
                        <span className="ml-auto min-w-[22px] h-[22px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1.5 shadow-sm">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <Link
                      href="/portal/client"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <MessageSquare size={15} />
                      My Portal
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
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-center text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
