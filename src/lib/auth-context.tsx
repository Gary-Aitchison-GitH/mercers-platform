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
        // Firebase emits null on initial load before restoring session from IndexedDB,
        // and again during token refresh. Keep loading=true so route guards don't fire.
        // The generation counter discards this branch if the real user callback arrives first.
        // Grace period: 5s hard wait + localStorage "last known role" as a secondary guard.
        setLoading(true)
        const lastRole = typeof window !== 'undefined' ? localStorage.getItem(ROLE_KEY) : null
        const grace = lastRole ? 5000 : 2000
        await new Promise(resolve => setTimeout(resolve, grace))
        if (thisGen !== gen) return
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
