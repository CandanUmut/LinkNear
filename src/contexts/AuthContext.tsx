/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  reloadProfile: () => Promise<void>
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
    // eslint-disable-next-line no-console
    console.error('Failed to bootstrap profile row:', error)
  } finally {
    bootstrappingProfileIds.delete(user.id)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  // Remember which user's profile we already loaded, so navigating between
  // authed pages doesn't trigger a refetch (fixes spinner flicker).
  const loadedForUserId = useRef<string | null>(null)

  const fetchProfile = useCallback(async (uid: string): Promise<void> => {
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle()

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load profile:', error.message)
        setProfile(null)
      } else {
        setProfile(data as Profile | null)
      }
      loadedForUserId.current = uid
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const reloadProfile = useCallback(async () => {
    if (user?.id) {
      loadedForUserId.current = null // force refresh
      await fetchProfile(user.id)
    }
  }, [user?.id, fetchProfile])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (session?.user) {
        // Deferred so we don't hold the auth listener lock longer than needed.
        window.setTimeout(() => {
          void ensureProfileRow(session.user)
        }, 0)
      } else {
        setProfile(null)
        loadedForUserId.current = null
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load profile exactly once per signed-in user. Downstream reads come
  // straight from context instead of hitting the DB on every navigation.
  useEffect(() => {
    if (!user) return
    if (loadedForUserId.current === user.id) return
    void fetchProfile(user.id)
  }, [user, fetchProfile])

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
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        profileLoading,
        signInWithEmail,
        signOut,
        reloadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
