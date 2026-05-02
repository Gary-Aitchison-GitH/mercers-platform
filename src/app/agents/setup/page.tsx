'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Shield, CheckCircle, AlertCircle } from 'lucide-react'
import PasswordInput from '@/components/PasswordInput'

function SetupForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'verifying' | 'ready' | 'done' | 'error'>('verifying')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) { setStatus('error'); setError('Invalid or missing invite link.'); return }
    fetch(`/api/auth/setup?token=${encodeURIComponent(token)}`)
      .then(async res => {
        const data = await res.json()
        if (!res.ok) { setStatus('error'); setError(data.error ?? 'Invalid invite link.') }
        else { setEmail(data.email); if (data.name) setName(data.name); setStatus('ready') }
      })
      .catch(() => { setStatus('error'); setError('Could not verify invite link.') })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, name: name.trim(), phone: phone.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Setup failed. Please try again.'); return }

      // Sign in with the newly set password
      const credential = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await credential.user.getIdToken()
      document.cookie = `fb-token=${idToken}; path=/; max-age=3600; SameSite=Strict`
      setStatus('done')
      setTimeout(() => router.push('/agents/dashboard'), 1500)
    } catch {
      setError('Could not sign in after setup. Please go to the login page and sign in manually.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-navy-950)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[rgba(201,165,76,0.15)] mb-4">
            <Shield size={24} className="text-[var(--color-gold-500)]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mercers Kensington</h1>
          <p className="text-blue-200 mt-1 text-sm">Set up your agent account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {status === 'verifying' && (
            <p className="text-center text-[var(--color-muted)] text-sm py-4">Verifying your invite…</p>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-red-700">{error}</p>
                <a href="/agents/login" className="text-xs text-[var(--color-navy-700)] hover:underline mt-2 block">Go to login →</a>
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle size={36} className="text-green-500" />
              <p className="text-sm font-medium text-gray-800">Account activated — taking you to the portal…</p>
            </div>
          )}

          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-sm text-gray-700 mb-1">You&apos;ve been invited to join Mercers Kensington. Fill in your details and create a password to activate your account.</p>
                <p className="text-xs text-[var(--color-muted)] mt-1">Account: <strong>{email}</strong></p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-600)] text-sm"
                  placeholder="Dawn Brown"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-600)] text-sm"
                  placeholder="+263 77 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Create a password *</label>
                <PasswordInput value={password} onChange={setPassword} required autoComplete="new-password" placeholder="At least 8 characters" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password *</label>
                <PasswordInput value={confirm} onChange={setConfirm} required autoComplete="new-password" placeholder="Repeat password" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[var(--color-navy-900)] text-white font-semibold text-sm hover:bg-[var(--color-navy-800)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Activating account…' : 'Activate my account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SetupPage() {
  return (
    <Suspense>
      <SetupForm />
    </Suspense>
  )
}
