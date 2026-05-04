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
  // Seed from cache immediately — navbar shows correctly while Firebase initializes
  const [role, setRole] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    if (localStorage.getItem(SIGNOUT_KEY) === '1') return null
    return localStorage.getItem(ROLE_KEY)
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If Firebase fires null before the real user (happens during SDK init from persistence),
    // we wait up to 3s for the real callback before concluding the session is gone.
    // This replaces the previous 60s polling loop.
    let restoreTimer: ReturnType<typeof setTimeout> | null = null

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Any new callback cancels a pending restore timer
      if (restoreTimer) { clearTimeout(restoreTimer); restoreTimer = null }

      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdTokenResult()
          const resolvedRole = (token.claims.role as string) ?? null
          if (resolvedRole) localStorage.setItem(ROLE_KEY, resolvedRole)
          else localStorage.removeItem(ROLE_KEY)
          localStorage.removeItem(SIGNOUT_KEY)
          setUser(firebaseUser)
          setRole(resolvedRole)
        } catch {
          setUser(null)
          setRole(null)
          localStorage.removeItem(ROLE_KEY)
        }
        setLoading(false)
      } else {
        // Explicit sign-out — resolve immediately, no waiting
        if (typeof window !== 'undefined' && localStorage.getItem(SIGNOUT_KEY) === '1') {
          localStorage.removeItem(SIGNOUT_KEY)
          localStorage.removeItem(ROLE_KEY)
          setUser(null)
          setRole(null)
          setLoading(false)
          return
        }

        // Not explicit sign-out. Two cases:
        // A) No cached role → user was never logged in here, resolve immediately
        // B) Cached role exists → user was recently logged in; Firebase may still be
        //    restoring the session. Give it 3s before concluding the session is gone.
        const hasCachedSession = typeof window !== 'undefined' && !!localStorage.getItem(ROLE_KEY)

        if (!hasCachedSession) {
          setUser(null)
          setRole(null)
          setLoading(false)
          return
        }

        // Case B: wait briefly for Firebase to fire the real user callback
        restoreTimer = setTimeout(() => {
          // Still no user after 3s — session is genuinely gone
          localStorage.removeItem(ROLE_KEY)
          setUser(null)
          setRole(null)
          setLoading(false)
        }, 3000)
      }
    })

    return () => {
      unsub()
      if (restoreTimer) clearTimeout(restoreTimer)
    }
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
