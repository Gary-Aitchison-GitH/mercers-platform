'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Navbar from '@/components/Navbar'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [clientType, setClientType] = useState<'BUYER' | 'SELLER' | 'BOTH'>('BUYER')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(credential.user, { displayName: name })
      const idToken = await credential.user.getIdToken()

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, clientType, idToken }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Registration failed')
      }

      router.push('/')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.')
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.')
      } else {
        setError((err as Error).message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-surface)]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[var(--color-navy-900)]">Create your account</h1>
              <p className="text-[var(--color-muted)] mt-2 text-sm">Join Mercers Kensington today</p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-600)] text-sm"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-600)] text-sm"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-600)] text-sm"
                  placeholder="Min. 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BUYER', 'SELLER', 'BOTH'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setClientType(type)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                        clientType === type
                          ? 'bg-[var(--color-navy-900)] text-white border-[var(--color-navy-900)]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[var(--color-navy-600)]'
                      }`}
                    >
                      {type === 'BOTH' ? 'Both' : type.charAt(0) + type.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[var(--color-navy-900)] text-white font-semibold text-sm hover:bg-[var(--color-navy-800)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="text-center text-sm text-[var(--color-muted)] mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-[var(--color-navy-700)] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
