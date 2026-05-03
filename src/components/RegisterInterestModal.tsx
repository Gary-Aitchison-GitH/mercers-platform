'use client'

import { useState } from 'react'
import { X, CheckCircle, Loader2, Heart } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import type { Listing } from '@/lib/data/listings'

type Props = {
  listing: Listing & { id: string }
  onClose: () => void
}

export default function RegisterInterestModal({ listing, onClose }: Props) {
  const { user, role, loading: authLoading } = useAuth()
  const isPublicUser = !authLoading && (!user || role === 'user')
  const isAgent = !authLoading && !!user && ['agent', 'admin', 'dev'].includes(role ?? '')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      let body: Record<string, string>

      if (user && role === 'user') {
        const idToken = await user.getIdToken()
        body = { idToken }
      } else {
        if (!name.trim() || !email.trim()) {
          setError('Please enter your name and email.')
          setSubmitting(false)
          return
        }
        body = { name: name.trim(), email: email.trim(), phone: phone.trim() }
      }

      const res = await fetch(`/api/listings/${listing.id}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Something went wrong')
      }

      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Register Interest</h2>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{listing.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          {done ? (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <CheckCircle size={44} className="text-green-500" />
              <h3 className="font-bold text-gray-900 text-lg">Interest Registered</h3>
              <p className="text-sm text-gray-500">
                Your assigned agent has been notified and will be in touch shortly.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: '#1B3A6B' }}
              >
                Close
              </button>
            </div>
          ) : isAgent ? (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-500">You&apos;re signed in as an agent. This feature is for buyers and sellers.</p>
              <button
                onClick={onClose}
                className="mt-4 text-sm font-medium"
                style={{ color: '#1B3A6B' }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {user && role === 'user' ? (
                <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <p className="font-medium">{user.displayName ?? user.email}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{user.email}</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Full name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="Your full name"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone number <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+263 77 000 0000"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
                    />
                  </div>
                </>
              )}

              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
                <span className="font-medium text-gray-700">{listing.priceDisplay}</span> · {listing.location}
              </div>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || authLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#1B3A6B' }}
              >
                {submitting
                  ? <Loader2 size={15} className="animate-spin" />
                  : <Heart size={15} />
                }
                {submitting ? 'Registering…' : 'Register Interest'}
              </button>

              {!user && (
                <p className="text-center text-xs text-gray-400">
                  Already have an account?{' '}
                  <a href="/login" className="font-medium" style={{ color: '#1B3A6B' }}>Sign in</a>
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
