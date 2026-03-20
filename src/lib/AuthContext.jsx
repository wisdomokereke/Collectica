import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

export const ROLES = {
  FREELANCER: 'freelancer',
  CLIENT: 'client',
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]       = useState(undefined)
  const [user, setUser]             = useState(null)
  const [activeView, setActiveView] = useState(null)
  const [loading, setLoading]       = useState(true)

  // ── Fetch profile from public.users ─────────────────────
  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      setUser(data)
      setActiveView(prev => prev || data.role) // keep existing view if already set
    } catch (err) {
      console.error('fetchProfile error:', err)
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Expose refreshProfile so pages can re-fetch ──────────
  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) await fetchProfile(session.user.id)
  }, [session, fetchProfile])

  // ── Bootstrap session on mount ───────────────────────────
  useEffect(() => {
    // Safety timeout — if Supabase takes more than 5s, stop loading anyway
    const timeout = setTimeout(() => setLoading(false), 5000)

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      clearTimeout(timeout)
      if (error) { setLoading(false); return }
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    }).catch(() => {
      clearTimeout(timeout)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) await fetchProfile(session.user.id)
        else { setUser(null); setActiveView(null); setLoading(false) }
      }
    )
    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [fetchProfile])

  // ── Sign up ──────────────────────────────────────────────
  const signUp = async ({ email, password, full_name, role, ...profileData }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, role } },
    })
    if (error) throw error

    // Update extra profile fields (trigger already created base row)
    if (data.user && Object.keys(profileData).length > 0) {
      await supabase
        .from('users')
        .update({ ...profileData, updated_at: new Date().toISOString() })
        .eq('id', data.user.id)
    }
    return data
  }

  // ── Sign in ──────────────────────────────────────────────
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  // ── Sign out ─────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setActiveView(null)
  }

  // ── Update profile ───────────────────────────────────────
  const updateProfile = async (updates) => {
    if (!user) return
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    setUser(data)
    return data
  }

  // ── Switch view (client ↔ freelancer toggle) ─────────────
  const switchView = (view) => {
    if (Object.values(ROLES).includes(view)) setActiveView(view)
  }

  // ── Simulated wallet deposit ─────────────────────────────
  const depositToWallet = async (amount) => {
    if (!user) return
    const newBalance = (user.wallet_balance || 0) + amount
    await updateProfile({ wallet_balance: newBalance })
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'deposit',
      amount,
      balance_after: newBalance,
      description: 'Wallet top-up',
      status: 'completed',
    })
    return newBalance
  }

  // ── Derived helpers ──────────────────────────────────────
  // displayName: the user's real name from the DB
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User'
  // profile: alias for user (some pages use this name)
  const profile = user

  const value = {
    session,
    user,
    profile,           // alias — same object, some pages destructure as `profile`
    activeView,
    loading,
    displayName,       // user's real full name as a string
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,    // re-fetch user row from DB
    switchView,
    depositToWallet,
    isAuthenticated: !!session,
    isFreelancer: activeView === ROLES.FREELANCER,
    isClient: activeView === ROLES.CLIENT,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
