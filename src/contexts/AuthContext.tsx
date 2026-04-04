/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const bootstrappedProfileIds = new Set<string>()
const bootstrappingProfileIds = new Set<string>()

async function ensureProfileRow(user: User): Promise<void> {
  if (bootstrappedProfileIds.has(user.id) || bootstrappingProfileIds.has(user.id)) return

  bootstrappingProfileIds.add(user.id)

  try {
    const { data: existing, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (error) throw error

    if (!existing) {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || null,
      })

      if (insertError) throw insertError
    }

    bootstrappedProfileIds.add(user.id)
  } catch (error) {
    console.error('Failed to bootstrap profile row:', error)
  } finally {
    bootstrappingProfileIds.delete(user.id)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        if (session?.user) {
          // Supabase runs auth state listeners under its session lock.
          // Defer profile bootstrap so we do not deadlock or hold the lock long enough
          // for another request to steal it.
          window.setTimeout(() => {
            void ensureProfileRow(session.user)
          }, 0)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/',
      },
    })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
