'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Shield } from 'lucide-react'
import PasswordInput from '@/components/PasswordInput'

export default function AgentLoginPage() {
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

      if (!role || !['agent', 'admin', 'dev'].includes(role)) {
        await auth.signOut()
        setError('This account does not have agent access.')
        setLoading(false)
        return
      }

      const idToken = await credential.user.getIdToken()
      document.cookie = `fb-token=${idToken}; path=/; max-age=3600; SameSite=Strict`

      router.push('/agents/dashboard')
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-navy-950)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[rgba(201,165,76,0.15)] mb-4">
            <Shield size={24} className="text-[var(--color-gold-500)]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Agent Portal</h1>
          <p className="text-blue-200 mt-1 text-sm">Mercers Kensington — Staff access only</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
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
              {loading ? 'Signing in…' : 'Sign in to portal'}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--color-muted)] mt-6">
            Access is by invitation only.{' '}
            <Link href="/" className="hover:underline">Return to site</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
