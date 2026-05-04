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
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let gen = 0
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      const thisGen = ++gen
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdTokenResult()
          if (thisGen !== gen) return
          const resolvedRole = (token.claims.role as string) ?? null
          if (resolvedRole) localStorage.setItem(ROLE_KEY, resolvedRole)
          localStorage.removeItem(SIGNOUT_KEY)
          setUser(firebaseUser)
          setRole(resolvedRole)
        } catch {
          if (thisGen !== gen) return
          setUser(null)
          setRole(null)
        }
        setLoading(false)
      } else {
        setLoading(true)

        // If the user explicitly signed out, resolve immediately.
        const explicitSignOut = typeof window !== 'undefined' && localStorage.getItem(SIGNOUT_KEY) === '1'
        if (explicitSignOut) {
          localStorage.removeItem(SIGNOUT_KEY)
          localStorage.removeItem(ROLE_KEY)
          setUser(null)
          setRole(null)
          setLoading(false)
          return
        }

        // Otherwise Firebase is restoring the session from IndexedDB —
        // wait indefinitely (checking every 250ms) until the real user callback
        // fires. There is no timeout: a logged-in user must never be kicked
        // just because Firebase was slow. A 60s safety valve handles the
        // extreme edge case of a truly dead session with no explicit sign-out.
        const SAFETY_MS = 60_000
        const started = Date.now()
        while (Date.now() - started < SAFETY_MS) {
          await new Promise(resolve => setTimeout(resolve, 250))
          if (thisGen !== gen) return // real user callback fired — abort this branch
        }

        // 60 s elapsed with no user — treat as genuine session loss
        localStorage.removeItem(ROLE_KEY)
        setUser(null)
        setRole(null)
        setLoading(false)
      }
    })
    return unsub
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
