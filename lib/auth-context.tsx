'use client'
// lib/auth-context.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Provides the current Firebase user to all child components via React context.
// Wrap your root layout with <AuthProvider> and consume with useAuth().
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from './firebase'

interface AuthContextValue {
  user:          User | null
  loading:       boolean
  signInGoogle:  () => Promise<void>
  signOutUser:   () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user:         null,
  loading:      true,
  signInGoogle:  async () => {},
  signOutUser:   async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const signInGoogle = async () => {
    await signInWithPopup(auth, googleProvider)
  }

  const signOutUser = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
