import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Wallet, Plus, ArrowDownLeft, ArrowUpRight, Shield, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function Escrow() {
  const { theme } = useTheme()
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)
  const [amount, setAmount]             = useState('')
  const [topping, setTopping]           = useState(false)
  const [success, setSuccess]           = useState(false)
  const [error, setError]               = useState('')

  const c = {
    bg:     isDark ? 'bg-[#0a0a0a]'     : 'bg-[#f8f8f8]',
    card:   isDark ? 'bg-[#111]'        : 'bg-white',
    bgMid:  isDark ? 'bg-[#1a1a1a]'     : 'bg-[#f0f0f0]',
    border: isDark ? 'border-[#2e2e2e]' : 'border-[#e0e0e0]',
    text:   isDark ? 'text-white'       : 'text-[#0a0a0a]',
    muted:  isDark ? 'text-[#555]'      : 'text-[#aaa]',
    light:  isDark ? 'text-[#888]'      : 'text-[#666]',
    input:  isDark
      ? 'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e] focus:border-white'
      : 'bg-white text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0] focus:border-[#0a0a0a]',
    btn:    isDark ? 'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]' : 'bg-[#0a0a0a] text-white hover:bg-[#222]',
  }

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchTransactions()

    const ch = supabase.channel('wallet-' + user.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        () => { fetchTransactions(); refreshProfile() })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user])

  const fetchTransactions = async () => {
    if (!user) return
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setTransactions(data)
    setLoading(false)
  }

  const handleTopUp = async () => {
    setError('')
    const parsed = parseFloat(amount.replace(/,/g, ''))
    if (!parsed || parsed <= 0) { setError('Enter a valid amount'); return }
    if (parsed > 10000000) { setError('Maximum top-up is ₦10,000,000'); return }

    setTopping(true)
    try {
      const newBalance = (profile?.wallet_balance || 0) + parsed

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id)
      if (updateError) throw updateError

      // Log transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'deposit',
        amount: parsed,
        balance_after: newBalance,
        description: `Wallet top-up — ₦${parsed.toLocaleString()}`,
        status: 'completed',
      })

      await refreshProfile()
      await fetchTransactions()
      setAmount('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setTopping(false)
    }
  }

  const txIcon = t => ({ deposit: '💳', escrow_lock: '🔒', escrow_release: '💸', withdrawal: '🏦', refund: '↩️' }[t] || '📋')
  const txColor = t => t === 'deposit' || t === 'escrow_release' ? 'text-green-500' : 'text-red-400'
  const txSign  = t => t === 'deposit' || t === 'escrow_release' ? '+' : '-'

  const PRESETS = [10000, 50000, 100000, 500000]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${c.bg}`}>
      <header className={`sticky top-0 z-20 flex items-center justify-between px-6 md:px-10 py-4 border-b ${c.border} ${c.card}`}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={`flex items-center gap-2 text-sm font-semibold ${c.light}`}>
            <ArrowLeft size={15}/> Dashboard
          </Link>
          <div className={`w-px h-4 ${isDark ? 'bg-[#2e2e2e]' : 'bg-[#e0e0e0]'}`}/>
          <div className="flex items-center gap-2">
            <Wallet size={15} className={c.muted}/>
            <span className={`text-sm font-bold ${c.text}`}>Wallet & Escrow</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-10 space-y-6">

        {/* Balance card */}
        <div className="rounded-2xl bg-[#0a0a0a] p-8 border border-[#2e2e2e]">
          <p className="text-xs font-bold uppercase tracking-widest text-green-500 mb-2">Available Balance</p>
          <p className="text-5xl font-extrabold text-white tracking-tight">
            ₦{(profile?.wallet_balance || 0).toLocaleString()}
          </p>
          <p className="text-[#555] text-sm mt-2">{profile?.full_name || 'Your wallet'} · Collectica</p>
        </div>

        {/* Top-up card */}
        <div className={`${c.card} border ${c.border} rounded-2xl p-6 space-y-5`}>
          <div>
            <p className={`text-sm font-bold ${c.text} mb-1`}>Add funds to wallet</p>
            <p className={`text-xs ${c.light}`}>Type any amount and tap Add Funds — it reflects instantly.</p>
          </div>

          {/* Preset amounts */}
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map(p => (
              <button key={p} onClick={() => setAmount(p.toLocaleString())}
                className={`py-2 rounded-xl text-xs font-bold border transition-all
                  ${amount === p.toLocaleString()
                    ? 'border-green-500 bg-green-500/10 text-green-500'
                    : `${c.border} ${c.light} ${isDark ? 'hover:border-[#555]' : 'hover:border-[#999]'}`}`}>
                ₦{p >= 1000 ? `${p/1000}k` : p}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${c.muted}`}>₦</span>
            <input
              type="text" inputMode="numeric"
              placeholder="Custom amount"
              value={amount}
              onChange={e => {
                const raw = e.target.value.replace(/[^0-9]/g, '')
                setAmount(raw ? parseInt(raw).toLocaleString() : '')
              }}
              className={`w-full pl-8 pr-4 py-3.5 rounded-xl border text-sm font-bold outline-none transition-all ${c.input}`}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          {success && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle size={14} className="text-green-500"/>
              <p className="text-xs font-bold text-green-500">Funds added successfully!</p>
            </div>
          )}

          <button onClick={handleTopUp} disabled={!amount || topping}
            className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${c.btn}`}>
            {topping
              ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> Adding funds...</>
              : <><Plus size={15}/> Add Funds</>}
          </button>

          <p className={`text-xs ${c.muted} text-center`}>
            🔒 This is a simulated wallet — no real money involved
          </p>
        </div>

        {/* Transaction history */}
        <div className={`${c.card} border ${c.border} rounded-2xl overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${c.border}`}>
            <p className={`text-sm font-bold ${c.text}`}>Transaction History</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : transactions.length > 0 ? (
            <div className="divide-y" style={{ borderColor: isDark ? '#2e2e2e' : '#e0e0e0' }}>
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-6 py-4">
                  <span className="text-xl flex-shrink-0">{txIcon(tx.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${c.text} truncate`}>{tx.description || tx.type}</p>
                    <p className={`text-xs ${c.muted} mt-0.5`}>{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${txColor(tx.type)}`}>
                      {txSign(tx.type)}₦{tx.amount?.toLocaleString()}
                    </p>
                    {tx.balance_after != null && (
                      <p className={`text-xs ${c.muted} mt-0.5`}>bal: ₦{tx.balance_after?.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="text-3xl mb-3">💳</div>
              <p className={`text-sm font-bold ${c.text}`}>No transactions yet</p>
              <p className={`text-xs ${c.muted} mt-1`}>Top up your wallet to get started</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
