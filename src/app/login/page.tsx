'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Navbar from '@/components/Navbar'
import PasswordInput from '@/components/PasswordInput'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      const tokenResult = await credential.user.getIdTokenResult()
      const role = tokenResult.claims.role as string | undefined

      // If this user is an agent/admin/dev, set the cookie and go to portal
      if (role && ['agent', 'admin', 'dev'].includes(role)) {
        const idToken = await credential.user.getIdToken()
        document.cookie = `fb-token=${idToken}; path=/; max-age=3600; SameSite=Strict`
        router.push('/agents/dashboard')
      } else {
        router.push('/')
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('Invalid email or password.')
      } else {
        setError('Sign in failed. Please try again.')
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
              <h1 className="text-2xl font-bold text-[var(--color-navy-900)]">Welcome back</h1>
              <p className="text-[var(--color-muted)] mt-2 text-sm">Sign in to your Mercers account</p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-600)] text-sm"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Link href="/forgot-password" className="text-xs text-[var(--color-navy-700)] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[var(--color-navy-900)] text-white font-semibold text-sm hover:bg-[var(--color-navy-800)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="text-center text-sm text-[var(--color-muted)] mt-6">
              {"Don't have an account? "}
              <Link href="/signup" className="text-[var(--color-navy-700)] font-medium hover:underline">
                Create one
              </Link>
            </p>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <Link href="/agents/login" className="text-xs text-[var(--color-muted)] hover:text-[var(--color-navy-700)]">
                Agent login →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
