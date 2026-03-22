import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Wallet, Plus, ArrowDownLeft, ArrowUpRight,
  Shield, Clock, CheckCircle, Lock, FileText, ChevronRight, X
} from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function Escrow() {
  const { theme } = useTheme()
  const { user, profile, refreshProfile, isFreelancer } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const [transactions, setTransactions]   = useState([])
  const [contracts, setContracts]         = useState([])  // contracts that need funding
  const [loading, setLoading]             = useState(true)
  const [amount, setAmount]               = useState('')
  const [topping, setTopping]             = useState(false)
  const [topSuccess, setTopSuccess]       = useState(false)
  const [error, setError]                 = useState('')
  const [fundingContract, setFundingContract] = useState(null) // contract being funded
  const [fundAmount, setFundAmount]       = useState('')
  const [funding, setFunding]             = useState(false)
  const [fundSuccess, setFundSuccess]     = useState(false)

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
    loadAll()

    const ch = supabase.channel('wallet-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'transactions', filter: `user_id=eq.${user.id}`
      }, () => { loadAll(); refreshProfile() })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user])

  const loadAll = async () => {
    await Promise.all([fetchTransactions(), fetchUnderfundedContracts()])
    setLoading(false)
  }

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setTransactions(data)
  }

  const fetchUnderfundedContracts = async () => {
    if (isFreelancer) return // only clients fund escrow
    const { data } = await supabase
      .from('contracts')
      .select(`
        *,
        freelancer:users!contracts_freelancer_id_fkey(full_name)
      `)
      .eq('client_id', user.id)
      .eq('escrow_funded', false)
      .in('status', ['pending_signatures', 'active', 'draft'])
      .order('created_at', { ascending: false })
    if (data) setContracts(data)
  }

  // ── Wallet top-up ─────────────────────────────────────────
  const handleTopUp = async () => {
    setError('')
    const parsed = parseFloat(amount.replace(/,/g, ''))
    if (!parsed || parsed <= 0) { setError('Enter a valid amount'); return }
    if (parsed > 10000000) { setError('Maximum top-up is ₦10,000,000'); return }
    setTopping(true)
    try {
      const newBalance = (profile?.wallet_balance || 0) + parsed
      const { error: updateErr } = await supabase
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id)
      if (updateErr) throw updateErr
      await supabase.from('transactions').insert({
        user_id: user.id, type: 'deposit', amount: parsed,
        balance_after: newBalance,
        description: `Wallet top-up — ₦${parsed.toLocaleString()}`,
        status: 'completed',
      })
      await refreshProfile()
      await fetchTransactions()
      setAmount(''); setTopSuccess(true)
      setTimeout(() => setTopSuccess(false), 3000)
    } catch (err) {
      setError('Top-up failed. Please try again.')
    } finally { setTopping(false) }
  }

  // ── Fund a specific contract ──────────────────────────────
  const handleFundContract = async () => {
    if (!fundingContract) return
    setError('')
    const parsed = parseFloat(fundAmount.replace(/,/g, ''))
    const required = fundingContract.total_value

    if (!parsed || parsed < required) {
      setError(`You must fund the full contract value: ₦${required?.toLocaleString()}`)
      return
    }
    if (parsed > (profile?.wallet_balance || 0)) {
      setError('Insufficient wallet balance. Please top up first.')
      return
    }

    setFunding(true)
    try {
      const newBalance = (profile?.wallet_balance || 0) - parsed

      // Deduct from wallet
      await supabase.from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id)

      // Mark contract as funded
      await supabase.from('contracts')
        .update({
          escrow_funded:    true,
          escrow_funded_at: new Date().toISOString(),
          status:           'active',
        })
        .eq('id', fundingContract.id)

      // Log escrow lock transaction
      await supabase.from('transactions').insert({
        user_id:     user.id,
        type:        'escrow_lock',
        amount:      parsed,
        balance_after: newBalance,
        contract_id: fundingContract.id,
        description: `Escrow funded — ${fundingContract.title}`,
        status:      'completed',
      })

      // Notify in the chat
      const { data: chat } = await supabase
        .from('chats')
        .select('id')
        .eq('contract_id', fundingContract.id)
        .single()

      if (chat) {
        await supabase.from('messages').insert({
          chat_id:   chat.id,
          sender_id: null,
          content:   `💰 Escrow funded! ₦${parsed.toLocaleString()} is now held securely in the contract account. ${fundingContract.freelancer?.full_name || 'Freelancer'}, you can now begin work. Payment will be released milestone by milestone as you deliver.`,
          type:      'colle',
        })
      }

      await refreshProfile()
      await loadAll()
      setFundSuccess(true)
      setFundingContract(null)
      setFundAmount('')
      setTimeout(() => setFundSuccess(false), 4000)
    } catch (err) {
      setError('Failed to fund contract. Please try again.')
    } finally { setFunding(false) }
  }

  const txIcon = t => ({
    deposit:        '💳',
    escrow_lock:    '🔒',
    escrow_release: '💸',
    withdrawal:     '🏦',
    refund:         '↩️',
  }[t] || '📋')

  const txColor = t =>
    t === 'deposit' || t === 'escrow_release' ? 'text-green-500' : 'text-red-400'
  const txSign  = t =>
    t === 'deposit' || t === 'escrow_release' ? '+' : '-'

  const PRESETS = [10000, 50000, 100000, 500000]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${c.bg}`}>

      {/* Header */}
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

        {/* Fund Contract section — clients only */}
        {!isFreelancer && contracts.length > 0 && (
          <div className={`${c.card} border-2 border-orange-500/30 rounded-2xl overflow-hidden`}>
            <div className="flex items-center gap-2 px-6 py-4 bg-orange-500/5 border-b border-orange-500/20">
              <Lock size={14} className="text-orange-500"/>
              <p className={`text-sm font-bold ${c.text}`}>Contracts Awaiting Escrow Funding</p>
              <span className="ml-auto text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">
                {contracts.length}
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: isDark ? '#2e2e2e' : '#e0e0e0' }}>
              {contracts.map(ct => (
                <div key={ct.id} className="flex items-center gap-4 px-6 py-4">
                  <div className={`w-10 h-10 rounded-xl ${c.bgMid} border ${c.border} flex items-center justify-center flex-shrink-0`}>
                    <FileText size={15} className={c.muted}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${c.text}`}>{ct.title}</p>
                    <p className={`text-xs ${c.muted}`}>
                      with {ct.freelancer?.full_name || 'Freelancer'} · ₦{ct.total_value?.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => { setFundingContract(ct); setFundAmount(ct.total_value?.toString() || '') }}
                    className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all flex items-center gap-1.5">
                    <Lock size={11}/> Fund Escrow
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fund contract modal */}
        {fundingContract && (
          <div className={`${c.card} border-2 border-green-500/30 rounded-2xl overflow-hidden`}>
            <div className="flex items-center justify-between px-6 py-4 bg-green-500/5 border-b border-green-500/20">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-green-500"/>
                <p className={`text-sm font-bold ${c.text}`}>Fund Escrow</p>
              </div>
              <button onClick={() => { setFundingContract(null); setFundAmount(''); setError('') }}
                className={c.muted}><X size={15}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className={`p-4 rounded-xl ${c.bgMid} border ${c.border} space-y-2`}>
                <p className={`text-sm font-bold ${c.text}`}>{fundingContract.title}</p>
                <p className={`text-xs ${c.muted}`}>Freelancer: {fundingContract.freelancer?.full_name}</p>
                <p className="text-lg font-extrabold text-green-500">
                  ₦{fundingContract.total_value?.toLocaleString()} required
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                <Shield size={13} className="text-green-500 mt-0.5 flex-shrink-0"/>
                <p className={`text-xs ${c.light} leading-relaxed`}>
                  This money moves from your wallet to the secure contract escrow account.
                  The freelancer cannot touch it until you approve each milestone.
                  If the contract is cancelled, unused funds return to your wallet.
                </p>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>
              )}

              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>
                  Amount to Fund
                </label>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${c.muted}`}>₦</span>
                  <input type="text" inputMode="numeric"
                    value={parseFloat(fundAmount || 0).toLocaleString()}
                    readOnly
                    className={`w-full pl-8 pr-4 py-3.5 rounded-xl border text-sm font-bold outline-none opacity-80 ${c.input}`}/>
                </div>
                <p className={`text-xs mt-1 ${c.muted}`}>
                  Your wallet: ₦{(profile?.wallet_balance || 0).toLocaleString()} available
                </p>
              </div>

              <button onClick={handleFundContract} disabled={funding}
                className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${c.btn}`}>
                {funding
                  ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> Funding Escrow...</>
                  : <><Lock size={15}/> Fund Contract Escrow — ₦{fundingContract.total_value?.toLocaleString()}</>}
              </button>
            </div>
          </div>
        )}

        {fundSuccess && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-green-500/10 border border-green-500/20">
            <CheckCircle size={18} className="text-green-500 flex-shrink-0"/>
            <div>
              <p className="text-sm font-bold text-green-500">Escrow funded successfully!</p>
              <p className={`text-xs ${c.light} mt-0.5`}>
                The freelancer has been notified and can now begin work.
              </p>
            </div>
          </div>
        )}

        {/* Wallet top-up */}
        <div className={`${c.card} border ${c.border} rounded-2xl p-6 space-y-5`}>
          <div>
            <p className={`text-sm font-bold ${c.text} mb-1`}>Add funds to wallet</p>
            <p className={`text-xs ${c.light}`}>Top up your wallet balance — funds reflect instantly.</p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map(p => (
              <button key={p} onClick={() => setAmount(p.toLocaleString())}
                className={`py-2 rounded-xl text-xs font-bold border transition-all
                  ${amount === p.toLocaleString()
                    ? 'border-green-500 bg-green-500/10 text-green-500'
                    : `${c.border} ${c.light}`}`}>
                ₦{p >= 1000 ? `${p/1000}k` : p}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${c.muted}`}>₦</span>
            <input type="text" inputMode="numeric" placeholder="Custom amount"
              value={amount}
              onChange={e => {
                const raw = e.target.value.replace(/[^0-9]/g, '')
                setAmount(raw ? parseInt(raw).toLocaleString() : '')
              }}
              className={`w-full pl-8 pr-4 py-3.5 rounded-xl border text-sm font-bold outline-none transition-all ${c.input}`}/>
          </div>

          {error && !fundingContract && <p className="text-xs text-red-400">{error}</p>}

          {topSuccess && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle size={14} className="text-green-500"/>
              <p className="text-xs font-bold text-green-500">Funds added successfully!</p>
            </div>
          )}

          <button onClick={handleTopUp} disabled={!amount || topping}
            className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${c.btn}`}>
            {topping
              ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> Adding...</>
              : <><Plus size={15}/> Add Funds</>}
          </button>

          <p className={`text-xs ${c.muted} text-center`}>
            🔒 Simulated wallet — no real money involved
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
                      <p className={`text-xs ${c.muted} mt-0.5`}>
                        bal: ₦{tx.balance_after?.toLocaleString()}
                      </p>
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
