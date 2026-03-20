import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from './supabase'

export const ROLES = {
  FREELANCER: 'freelancer',
  CLIENT: 'client',
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]         = useState(null)
  const [user, setUser]               = useState(null)
  const [activeView, setActiveView]   = useState(null)
  const [loading, setLoading]         = useState(true)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      if (!isMounted.current) return
      if (error) throw error
      setUser(data)
      setActiveView(prev => prev || data.role)
    } catch (err) {
      console.error('fetchProfile error:', err)
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) await fetchProfile(session.user.id)
  }, [fetchProfile])

  useEffect(() => {
    // Get session once on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted.current) return
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted.current) return
      // Ignore unnecessary events that cause flickering
      if (event === 'TOKEN_REFRESHED') return
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setActiveView(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signUp = async ({ email, password, full_name, role, ...profileData }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, role } },
    })
    if (error) throw error

    if (data.user && Object.keys(profileData).length > 0) {
      await supabase
        .from('users')
        .update({ ...profileData, updated_at: new Date().toISOString() })
        .eq('id', data.user.id)
    }
    return data
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setActiveView(null)
  }

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

  const switchView = (view) => {
    if (Object.values(ROLES).includes(view)) setActiveView(view)
  }

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

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User'
  const profile = user

  const value = {
    session,
    user,
    profile,
    activeView,
    loading,
    displayName,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
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
