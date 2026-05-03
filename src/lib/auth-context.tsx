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
          setUser(firebaseUser)
          setRole((token.claims.role as string) ?? null)
        } catch {
          if (thisGen !== gen) return
          setUser(null)
          setRole(null)
        }
        setLoading(false)
      } else {
        // Firebase emits null on initial load before reading from IndexedDB, and
        // during token refresh. Re-enable the loading guard immediately so the
        // dashboard guard (which redirects on loading=false + user=null) doesn't
        // fire prematurely. Wait 3s — if the real user callback arrives first,
        // the generation counter discards this branch entirely.
        setLoading(true)
        await new Promise(resolve => setTimeout(resolve, 3000))
        if (thisGen !== gen) return
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
