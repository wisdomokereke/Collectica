import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, Clock, RotateCcw,
  Shield, X, ChevronRight, FileText, Wallet, Bot
} from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const STATUS_CFG = {
  pending:            { label: 'Pending',     color: 'text-[#888]',     bg: 'bg-white/5',        border: 'border-white/10'       },
  in_progress:        { label: 'In Progress', color: 'text-blue-400',   bg: 'bg-blue-400/10',    border: 'border-blue-400/20'    },
  submitted:          { label: 'Submitted',   color: 'text-orange-500', bg: 'bg-orange-500/10',  border: 'border-orange-500/20'  },
  revision_requested: { label: 'Revision',    color: 'text-red-400',    bg: 'bg-red-400/10',     border: 'border-red-400/20'     },
  approved:           { label: 'Approved',    color: 'text-green-500',  bg: 'bg-green-500/10',   border: 'border-green-500/20'   },
  paid:               { label: 'Paid ✓',      color: 'text-green-500',  bg: 'bg-green-500/10',   border: 'border-green-500/20'   },
}

export default function Milestones() {
  const { theme, toggle } = useTheme()
  const { user, isFreelancer, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const [milestones, setMilestones] = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [tab, setTab]               = useState('all')
  const [approving, setApproving]   = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [revisionNote, setRevisionNote] = useState('')
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  const c = {
    bg:      isDark ? 'bg-[#0a0a0a]'     : 'bg-[#f8f8f8]',
    card:    isDark ? 'bg-[#111]'        : 'bg-white',
    bgMid:   isDark ? 'bg-[#1a1a1a]'     : 'bg-[#f0f0f0]',
    border:  isDark ? 'border-[#2e2e2e]' : 'border-[#e0e0e0]',
    text:    isDark ? 'text-white'       : 'text-[#0a0a0a]',
    muted:   isDark ? 'text-[#555]'      : 'text-[#aaa]',
    light:   isDark ? 'text-[#888]'      : 'text-[#666]',
    input:   isDark
      ? 'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e] focus:border-white'
      : 'bg-white text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0] focus:border-[#0a0a0a]',
    btn:     isDark ? 'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]' : 'bg-[#0a0a0a] text-white hover:bg-[#222]',
    divider: isDark ? 'bg-[#2e2e2e]'     : 'bg-[#e0e0e0]',
    tab:     isDark ? 'text-[#555] hover:text-white' : 'text-[#aaa] hover:text-[#0a0a0a]',
    tabAct:  isDark ? 'text-white border-b-2 border-white' : 'text-[#0a0a0a] border-b-2 border-[#0a0a0a]',
  }

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchMilestones()

    // Real-time updates
    const ch = supabase.channel('milestones-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, fetchMilestones)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user, isFreelancer])

  const fetchMilestones = async () => {
    if (!user) return
    const field = isFreelancer ? 'freelancer_id' : 'client_id'

    // Get milestones via their contracts
    const { data, error } = await supabase
      .from('milestones')
      .select(`
        *,
        contract:contracts!inner(
          id, title, client_id, freelancer_id, escrow_funded,
          client:users!contracts_client_id_fkey(full_name),
          freelancer:users!contracts_freelancer_id_fkey(full_name),
          chat:chats(id)
        )
      `)
      .eq(`contract.${field}`, user.id)
      .order('created_at', { ascending: false })

    if (!error && data) setMilestones(data)
    setLoading(false)
  }

  // ── Approve milestone + release payment ─────────────────
  const handleApprove = async () => {
    if (!selected) return
    setError(''); setApproving(true)
    try {
      const amount = selected.amount
      const contractId = selected.contract_id
      const freelancerId = selected.contract?.freelancer_id

      if (!selected.contract?.escrow_funded) {
        setError('Escrow is not funded yet. Please fund the contract first.')
        return
      }

      // 1. Mark milestone as approved + paid
      const { error: msErr } = await supabase
        .from('milestones')
        .update({
          status:      'paid',
          approved_at: new Date().toISOString(),
          paid_at:     new Date().toISOString(),
        })
        .eq('id', selected.id)
      if (msErr) throw msErr

      // 2. Add amount to freelancer's wallet
      const { data: freelancer } = await supabase
        .from('users')
        .select('wallet_balance, full_name')
        .eq('id', freelancerId)
        .single()

      const newFreelancerBalance = (freelancer?.wallet_balance || 0) + amount

      await supabase.from('users')
        .update({ wallet_balance: newFreelancerBalance })
        .eq('id', freelancerId)

      // 3. Log transaction for freelancer
      await supabase.from('transactions').insert({
        user_id:      freelancerId,
        type:         'escrow_release',
        amount,
        balance_after: newFreelancerBalance,
        contract_id:  contractId,
        milestone_id: selected.id,
        description:  `Milestone payment — ${selected.title} (${selected.contract?.title})`,
        status:       'completed',
      })

      // 4. Check if all milestones are paid — if so complete contract
      const { data: remaining } = await supabase
        .from('milestones')
        .select('id, status')
        .eq('contract_id', contractId)
        .not('status', 'in', '(paid,approved)')

      if (!remaining || remaining.length === 0) {
        await supabase.from('contracts')
          .update({ status: 'completed' })
          .eq('id', contractId)
      }

      // 5. Notify in chat
      const chatId = selected.contract?.chat?.[0]?.id ||
                     selected.contract?.chat?.id
      if (chatId) {
        await supabase.from('messages').insert({
          chat_id:   chatId,
          sender_id: null,
          content:   `💸 Milestone "${selected.title}" approved! ₦${amount?.toLocaleString()} has been released to ${freelancer?.full_name || 'the freelancer'}'s wallet.`,
          type:      'colle',
        })
      }

      // 6. Update trust scores
      await supabase.rpc('increase_trust_score', {
        target_user_id: freelancerId,
        reason:         'milestone_on_time',
        points:         2,
      }).catch(() => {}) // non-blocking

      setSuccess(`₦${amount?.toLocaleString()} released to freelancer!`)
      setTimeout(() => setSuccess(''), 4000)
      setSelected(null)
      await fetchMilestones()
      await refreshProfile()
    } catch (err) {
      setError(err.message || 'Approval failed. Please try again.')
    } finally {
      setApproving(false)
    }
  }

  // ── Request revision ──────────────────────────────────────
  const handleRequestRevision = async () => {
    if (!selected || !revisionNote.trim()) return
    setRequesting(true)
    try {
      const revisionsUsed = (selected.revisions_used || 0) + 1
      const maxRevisions  = selected.max_revisions || 2

      if (revisionsUsed > maxRevisions) {
        setError(`Max revisions (${maxRevisions}) exceeded. You must approve or dispute.`)
        setRequesting(false)
        return
      }

      await supabase.from('milestones').update({
        status:         'revision_requested',
        revisions_used: revisionsUsed,
      }).eq('id', selected.id)

      // Notify in chat
      const chatId = selected.contract?.chat?.[0]?.id ||
                     selected.contract?.chat?.id
      if (chatId) {
        await supabase.from('messages').insert({
          chat_id:   chatId,
          sender_id: user.id,
          content:   `🔄 Revision requested for milestone "${selected.title}":\n\n${revisionNote}`,
          type:      'text',
        })
      }

      setRevisionNote('')
      setSelected(null)
      await fetchMilestones()
    } catch (err) {
      setError('Failed to request revision.')
    } finally {
      setRequesting(false)
    }
  }

  const TABS = [
    { key: 'all',                label: 'All'         },
    { key: 'submitted',          label: 'Submitted'   },
    { key: 'revision_requested', label: 'Revision'    },
    { key: 'paid',               label: 'Paid'        },
    { key: 'pending',            label: 'Pending'     },
  ]

  const filtered = tab === 'all' ? milestones : milestones.filter(m => m.status === tab)
  const counts   = TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all' ? milestones.length : milestones.filter(m => m.status === t.key).length
    return acc
  }, {})

  const totalPaid    = milestones.filter(m => m.status === 'paid').reduce((s, m) => s + (m.amount || 0), 0)
  const totalPending = milestones.filter(m => m.status === 'submitted').reduce((s, m) => s + (m.amount || 0), 0)

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${c.bg}`}>

      <header className={`sticky top-0 z-20 flex items-center justify-between px-6 md:px-10 py-4 border-b ${c.border} ${c.card}`}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={`flex items-center gap-2 text-sm font-semibold ${c.light}`}>
            <ArrowLeft size={15}/> Dashboard
          </Link>
          <div className={`w-px h-4 ${c.divider}`}/>
          <div className="flex items-center gap-2">
            <Shield size={15} className={c.muted}/>
            <span className={`text-sm font-bold ${c.text}`}>Milestones</span>
          </div>
        </div>
        <button onClick={toggle}
          className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm
            ${isDark ? 'border-[#2e2e2e] bg-[#1a1a1a]' : 'border-[#e0e0e0] bg-[#f0f0f0]'}`}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </header>

      <main className="flex-1 px-4 md:px-10 py-10 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className={`text-4xl font-extrabold tracking-tight ${c.text}`}>Milestones</h1>
          <p className={`text-sm ${c.light} mt-1`}>
            {isFreelancer
              ? 'Track your milestone submissions. Payment is released automatically when approved.'
              : 'Review submitted work. Approve to release payment to the freelancer instantly.'}
          </p>
        </div>

        {/* Success banner */}
        {success && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-green-500/10 border border-green-500/20 mb-6">
            <CheckCircle size={16} className="text-green-500"/>
            <p className="text-sm font-bold text-green-500">{success}</p>
          </div>
        )}

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Milestones', value: milestones.length,                                        color: c.text        },
              { label: 'Submitted',        value: milestones.filter(m => m.status === 'submitted').length,  color: 'text-orange-500' },
              { label: 'Paid Out',         value: `₦${totalPaid.toLocaleString()}`,                        color: 'text-green-500'  },
              { label: 'Pending Release',  value: `₦${totalPending.toLocaleString()}`,                     color: 'text-orange-500' },
            ].map(s => (
              <div key={s.label} className={`${c.card} border ${c.border} rounded-2xl p-4`}>
                <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>{s.label}</p>
                <p className={`text-xl font-extrabold tracking-tight ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className={`flex gap-5 border-b ${c.border} mb-6 overflow-x-auto`}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5
                ${tab === t.key ? c.tabAct : c.tab}`}>
              {t.label}
              {counts[t.key] > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                  ${tab === t.key
                    ? isDark ? 'bg-white text-[#0a0a0a]' : 'bg-[#0a0a0a] text-white'
                    : isDark ? 'bg-[#2e2e2e] text-[#888]' : 'bg-[#e0e0e0] text-[#666]'}`}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className={`${c.card} border ${c.border} rounded-2xl p-5 flex items-center gap-4`}>
                <div className={`w-12 h-12 rounded-xl ${c.bgMid} animate-pulse`}/>
                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-48 rounded ${c.bgMid} animate-pulse`}/>
                  <div className={`h-3 w-32 rounded ${c.bgMid} animate-pulse`}/>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(m => {
              const s = STATUS_CFG[m.status] || STATUS_CFG.pending
              const party = isFreelancer ? m.contract?.client : m.contract?.freelancer
              return (
                <button key={m.id} onClick={() => { setSelected(m); setError(''); setRevisionNote('') }}
                  className={`${c.card} border ${c.border} rounded-2xl p-5 w-full text-left transition-all
                    ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-[#f8f8f8]'} hover:scale-[1.005]`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${c.bgMid} border ${c.border} flex items-center justify-center flex-shrink-0`}>
                      <FileText size={15} className={c.muted}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-sm font-bold ${c.text}`}>{m.title}</p>
                          <p className={`text-xs ${c.muted} mt-0.5`}>
                            {m.contract?.title} · {party?.full_name || 'Unknown'}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${s.bg} ${s.color}`}>
                          {s.label}
                        </span>
                      </div>
                      {m.description && (
                        <p className={`text-xs ${c.light} mt-2 line-clamp-1`}>{m.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm font-extrabold text-green-500">
                          ₦{m.amount?.toLocaleString()}
                        </span>
                        {m.deadline && (
                          <span className={`text-xs ${c.muted}`}>
                            Due {new Date(m.deadline).toLocaleDateString()}
                          </span>
                        )}
                        {m.max_revisions > 0 && (
                          <span className={`text-xs ${c.muted}`}>
                            {m.revisions_used || 0}/{m.max_revisions} revisions
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={15} className={`${c.muted} flex-shrink-0 mt-1`}/>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className={`${c.card} border ${c.border} rounded-2xl p-16 text-center`}>
            <div className="text-4xl mb-3">📋</div>
            <p className={`font-bold ${c.text}`}>No milestones yet</p>
            <p className={`text-sm ${c.light} mt-1`}>
              Milestones are created by Colle when a contract is signed in chat.
            </p>
          </div>
        )}
      </main>

      {/* Detail modal */}
      {selected && (() => {
        const s = STATUS_CFG[selected.status] || STATUS_CFG.pending
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"/>
            <div className={`relative w-full max-w-md ${c.card} border ${c.border} rounded-2xl overflow-hidden max-h-[90vh] flex flex-col`}
              onClick={e => e.stopPropagation()}>

              <div className={`flex items-center justify-between px-6 py-4 border-b ${c.border} flex-shrink-0`}>
                <p className={`font-bold ${c.text}`}>Milestone Detail</p>
                <button onClick={() => setSelected(null)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bgMid} ${c.light}`}>
                  <X size={15}/>
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto">
                {/* Status */}
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${s.border} ${s.bg} ${s.color}`}>
                  {s.label}
                </span>

                {/* Details */}
                <div className={`${c.bgMid} border ${c.border} rounded-xl p-4 space-y-3`}>
                  <p className={`text-sm font-bold ${c.text}`}>{selected.title}</p>
                  {selected.description && (
                    <p className={`text-xs ${c.light} leading-relaxed`}>{selected.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${c.muted}`}>Contract</span>
                    <span className={`text-xs font-bold ${c.text}`}>{selected.contract?.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${c.muted}`}>Payment</span>
                    <span className="text-sm font-extrabold text-green-500">₦{selected.amount?.toLocaleString()}</span>
                  </div>
                  {selected.deadline && (
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${c.muted}`}>Deadline</span>
                      <span className={`text-xs font-bold ${c.text}`}>{new Date(selected.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${c.muted}`}>Revisions</span>
                    <span className={`text-xs font-bold ${c.text}`}>{selected.revisions_used || 0}/{selected.max_revisions || 2} used</span>
                  </div>
                </div>

                {/* Escrow warning */}
                {!selected.contract?.escrow_funded && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
                    <Wallet size={13} className="text-orange-500 mt-0.5 flex-shrink-0"/>
                    <p className="text-xs text-orange-400 font-medium">
                      Escrow not funded yet. Client must fund the contract before payments can be released.
                    </p>
                  </div>
                )}

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>
                )}

                {/* Client actions — approve or request revision */}
                {!isFreelancer && selected.status === 'submitted' && (
                  <div className="space-y-3">
                    <button onClick={handleApprove} disabled={approving}
                      className="w-full py-3.5 rounded-xl font-bold text-sm bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {approving
                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Releasing payment...</>
                        : <><CheckCircle size={15}/> Approve & Release ₦{selected.amount?.toLocaleString()}</>}
                    </button>

                    {/* Revision request */}
                    <div className="space-y-2">
                      <textarea
                        placeholder="Explain what needs to be revised..."
                        value={revisionNote}
                        onChange={e => setRevisionNote(e.target.value)}
                        rows={2}
                        className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none resize-none transition-all ${c.input}`}/>
                      <button onClick={handleRequestRevision} disabled={requesting || !revisionNote.trim()}
                        className={`w-full py-3 rounded-xl border font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40
                          border-red-500/30 text-red-400 hover:bg-red-500/10`}>
                        {requesting
                          ? <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/> Sending...</>
                          : <><RotateCcw size={14}/> Request Revision ({(selected.max_revisions || 2) - (selected.revisions_used || 0)} left)</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* Freelancer view */}
                {isFreelancer && selected.status === 'submitted' && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                    <Bot size={13} className="text-green-500 mt-0.5 flex-shrink-0"/>
                    <p className="text-xs text-green-500 font-medium">
                      Work submitted. Waiting for client approval. Payment releases automatically once approved.
                    </p>
                  </div>
                )}

                {/* Already paid */}
                {selected.status === 'paid' && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                    <CheckCircle size={13} className="text-green-500"/>
                    <p className="text-xs text-green-500 font-bold">
                      Payment of ₦{selected.amount?.toLocaleString()} has been released.
                    </p>
                  </div>
                )}

                <button onClick={() => setSelected(null)}
                  className={`w-full py-2.5 rounded-xl border text-sm font-semibold transition-all ${isDark ? 'border-[#2e2e2e] text-[#888]' : 'border-[#e0e0e0] text-[#666]'}`}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
