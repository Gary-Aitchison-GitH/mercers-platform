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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Generation counter: if a newer callback fires before an older one completes,
    // the older one's result is discarded. Prevents stale callbacks overwriting state.
    let gen = 0
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      const thisGen = ++gen
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdTokenResult()
          if (thisGen !== gen) return
          const resolvedRole = (token.claims.role as string) ?? null
          if (resolvedRole) localStorage.setItem(ROLE_KEY, resolvedRole)
          setUser(firebaseUser)
          setRole(resolvedRole)
        } catch {
          if (thisGen !== gen) return
          setUser(null)
          setRole(null)
        }
        setLoading(false)
      } else {
        // Firebase emits null on initial load before restoring session from IndexedDB.
        // Poll every 250ms so we exit as soon as the real user arrives, up to a max wait.
        // Max is 10s for returning users (localStorage key present), 3s for fresh sessions.
        setLoading(true)
        const lastRole = typeof window !== 'undefined' ? localStorage.getItem(ROLE_KEY) : null
        const maxWait = lastRole ? 10000 : 3000
        const started = Date.now()
        while (Date.now() - started < maxWait) {
          await new Promise(resolve => setTimeout(resolve, 250))
          if (thisGen !== gen) return
        }
        localStorage.removeItem(ROLE_KEY)
        setUser(null)
        setRole(null)
        setLoading(false)
      }
    })
    return unsub
  }, [])

  const signOut = () => firebaseSignOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, signOut, role }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
