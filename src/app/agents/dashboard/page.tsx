'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, LogOut } from 'lucide-react'

export default function AgentDashboardPage() {
  const { user, role, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !['agent', 'admin', 'dev'].includes(role ?? ''))) {
      router.replace('/agents/login')
    }
  }, [user, role, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center">
        <div className="text-[var(--color-muted)] text-sm">Loading…</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="bg-[var(--color-navy-900)] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white transition-colors">
            <ArrowLeft size={15} />
            Public site
          </Link>
          <span className="text-blue-800">|</span>
          <div className="font-bold text-lg">Agent Portal</div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-200 hidden sm:block">{user.email} · {role}</span>
          <button
            onClick={() => signOut().then(() => router.push('/'))}
            className="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-[var(--color-navy-900)] mb-2">Dashboard</h1>
        <p className="text-[var(--color-muted)] mb-8">Agent portal is coming soon. Full features in Phase 3.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['My Listings', 'My Clients', 'Conversations'].map(label => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="text-[var(--color-muted)] text-sm mb-1">{label}</div>
              <div className="text-3xl font-bold text-[var(--color-navy-900)]">—</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
