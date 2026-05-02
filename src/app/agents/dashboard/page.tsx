'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AgentDashboardPage() {
  const { user, role, loading } = useAuth()
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
        <div className="font-bold text-lg">Mercers — Agent Portal</div>
        <div className="text-sm text-blue-200">{user.email} · {role}</div>
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
