'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from './firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  role: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  role: null,
})

const ROLE_KEY = 'mp_last_role'
const SIGNOUT_KEY = 'mp_signed_out'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // Seed role from cache immediately so the navbar renders correctly while Firebase initializes
  const [role, setRole] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    if (localStorage.getItem(SIGNOUT_KEY) === '1') return null
    return localStorage.getItem(ROLE_KEY)
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let initialized = false

    async function resolveUser(firebaseUser: User | null) {
      if (!mounted) return
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdTokenResult()
          const resolvedRole = (token.claims.role as string) ?? null
          if (resolvedRole) localStorage.setItem(ROLE_KEY, resolvedRole)
          else localStorage.removeItem(ROLE_KEY)
          localStorage.removeItem(SIGNOUT_KEY)
          if (mounted) { setUser(firebaseUser); setRole(resolvedRole) }
        } catch {
          localStorage.removeItem(ROLE_KEY)
          if (mounted) { setUser(null); setRole(null) }
        }
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(ROLE_KEY)
          localStorage.removeItem(SIGNOUT_KEY)
        }
        if (mounted) { setUser(null); setRole(null) }
      }
    }

    // auth.authStateReady() resolves once Firebase has read from IndexedDB and
    // determined the definitive initial auth state. Unlike onAuthStateChanged it
    // does NOT fire null-then-user, so there is no race condition or timer needed.
    // This fixes the post-deploy lockout that plagued the timer-based approach.
    auth.authStateReady()
      .then(async () => {
        await resolveUser(auth.currentUser)
        if (mounted) { initialized = true; setLoading(false) }
      })
      .catch(() => {
        // Firebase failed to initialize entirely — treat as logged out
        if (mounted) { initialized = true; setUser(null); setRole(null); setLoading(false) }
      })

    // After initial load, listen for subsequent sign-in / sign-out events
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!initialized) return // initial state is handled by authStateReady above
      await resolveUser(firebaseUser)
    })

    return () => { mounted = false; unsub() }
  }, [])

  const signOut = async () => {
    localStorage.setItem(SIGNOUT_KEY, '1')
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, role }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
