import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, FileText, Clock, CheckCircle,
  ChevronRight, Shield, MessageSquare, Bot, Lock
} from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const STATUS = {
  active:             { label: 'Active',              color: 'text-green-500',  bg: 'bg-green-500/10',  dot: 'bg-green-500'  },
  pending_signatures: { label: 'Awaiting Signatures', color: 'text-orange-500', bg: 'bg-orange-500/10', dot: 'bg-orange-500' },
  draft:              { label: 'Draft',               color: 'text-blue-400',   bg: 'bg-blue-400/10',   dot: 'bg-blue-400'   },
  completed:          { label: 'Completed',           color: 'text-[#888]',     bg: 'bg-white/5',       dot: 'bg-[#555]'     },
  disputed:           { label: 'Disputed',            color: 'text-red-500',    bg: 'bg-red-500/10',    dot: 'bg-red-500'    },
  cancelled:          { label: 'Cancelled',           color: 'text-[#555]',     bg: 'bg-white/5',       dot: 'bg-[#444]'     },
}

const TABS = [
  { key: 'all',               label: 'All'        },
  { key: 'active',            label: 'Active'     },
  { key: 'pending_signatures',label: 'Pending'    },
  { key: 'completed',         label: 'Completed'  },
  { key: 'disputed',          label: 'Disputed'   },
]

export default function Contracts() {
  const { theme, toggle } = useTheme()
  const { user, isFreelancer } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const [tab, setTab]             = useState('all')
  const [contracts, setContracts] = useState([])
  const [loading, setLoading]     = useState(true)

  const c = {
    bg:      isDark ? 'bg-[#0a0a0a]'     : 'bg-[#f8f8f8]',
    card:    isDark ? 'bg-[#111]'        : 'bg-white',
    bgMid:   isDark ? 'bg-[#1a1a1a]'     : 'bg-[#f0f0f0]',
    border:  isDark ? 'border-[#2e2e2e]' : 'border-[#e0e0e0]',
    text:    isDark ? 'text-white'       : 'text-[#0a0a0a]',
    muted:   isDark ? 'text-[#555]'      : 'text-[#aaa]',
    light:   isDark ? 'text-[#888]'      : 'text-[#666]',
    btn:     isDark ? 'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]' : 'bg-[#0a0a0a] text-white hover:bg-[#222]',
    btnGhost:isDark ? 'border-[#2e2e2e] text-[#888] hover:text-white' : 'border-[#e0e0e0] text-[#666] hover:text-[#0a0a0a]',
    divider: isDark ? 'bg-[#2e2e2e]'     : 'bg-[#e0e0e0]',
    tab:     isDark ? 'text-[#555] hover:text-white' : 'text-[#aaa] hover:text-[#0a0a0a]',
    tabAct:  isDark ? 'text-white border-b-2 border-white' : 'text-[#0a0a0a] border-b-2 border-[#0a0a0a]',
  }

  useEffect(() => {
    if (!user) return
    fetchContracts()

    const channel = supabase
      .channel('contracts-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, fetchContracts)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, isFreelancer])

  const fetchContracts = async () => {
    if (!user) return
    const field = isFreelancer ? 'freelancer_id' : 'client_id'

    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        client:users!contracts_client_id_fkey(full_name),
        freelancer:users!contracts_freelancer_id_fkey(full_name),
        milestones(id, status),
        chat:chats(id)
      `)
      .eq(field, user.id)
      .order('created_at', { ascending: false })

    if (!error && data) setContracts(data)
    setLoading(false)
  }

  const filtered = tab === 'all'
    ? contracts
    : contracts.filter(c => c.status === tab)

  const counts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all'
      ? contracts.length
      : contracts.filter(c => c.status === t.key).length
    return acc
  }, {})

  return (
    <div className={`min-h-screen flex flex-col ${c.bg}`}>

      {/* Header */}
      <header className={`sticky top-0 z-20 flex items-center justify-between px-6 md:px-10 py-4 border-b ${c.border} ${c.card}`}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={`flex items-center gap-2 text-sm font-semibold ${c.light}`}>
            <ArrowLeft size={15}/> Dashboard
          </Link>
          <div className={`w-px h-4 ${c.divider}`}/>
          <div className="flex items-center gap-2">
            <FileText size={15} className={c.muted}/>
            <span className={`text-sm font-bold ${c.text}`}>Contracts</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggle}
            className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm
              ${isDark ? 'border-[#2e2e2e] bg-[#1a1a1a]' : 'border-[#e0e0e0] bg-[#f0f0f0]'}`}>
            {isDark ? '☀️' : '🌙'}
          </button>
          {/* Clients post jobs. Freelancers find jobs. */}
          {!isFreelancer ? (
            <Link to="/contracts/new"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${c.btn}`}>
              <Plus size={14}/> Post a Job
            </Link>
          ) : (
            <Link to="/jobs"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${c.btn}`}>
              <FileText size={14}/> Browse Jobs
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 md:px-10 py-10 max-w-4xl mx-auto w-full">

        {/* Title + how contracts work banner */}
        <div className="mb-8">
          <h1 className={`text-4xl font-extrabold tracking-tight ${c.text}`}>Contracts</h1>
          <p className={`text-sm ${c.light} mt-1`}>
            {isFreelancer
              ? 'Contracts are created by Colle AI inside your chats. Apply for a job to get started.'
              : 'Contracts are drafted by Colle AI inside your chat with a freelancer. Post a job to begin.'}
          </p>
        </div>

        {/* How it works — shown when no contracts yet */}
        {!loading && contracts.length === 0 && (
          <div className={`${c.card} border ${c.border} rounded-2xl p-6 mb-8`}>
            <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-4`}>How Contracts Work on Collectica</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(isFreelancer ? [
                { step: '1', icon: '🔔', title: 'Get notified', desc: 'A client posts a job. You see it on your dashboard.' },
                { step: '2', icon: '💬', title: 'Chat opens', desc: 'You tap Apply. A chat opens between you and the client with Colle present.' },
                { step: '3', icon: '🤖', title: 'Colle drafts', desc: 'After discussing scope, say "Colle draft contract" — Colle turns your conversation into a real contract.' },
                { step: '4', icon: '✍️', title: 'Sign & get paid', desc: 'Both parties sign inside chat. Client funds escrow. You get paid per milestone.' },
              ] : [
                { step: '1', icon: '📋', title: 'Post a job', desc: 'Describe what you need. Set a budget range. Upload a brief if you have one.' },
                { step: '2', icon: '💬', title: 'Freelancer applies', desc: 'A freelancer taps Apply. A chat opens between you both with Colle ready.' },
                { step: '3', icon: '🤖', title: 'Colle drafts', desc: 'Discuss scope in chat. Say "Colle draft contract" and Colle generates it from your conversation.' },
                { step: '4', icon: '🔒', title: 'Sign & fund', desc: 'Both sign inside chat. You fund the escrow from your wallet. Freelancer gets paid per milestone.' },
              ]).map(s => (
                <div key={s.step} className={`${c.bgMid} border ${c.border} rounded-xl p-4`}>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <p className={`text-xs font-bold ${c.text} mb-1`}>{s.title}</p>
                  <p className={`text-xs ${c.muted} leading-relaxed`}>{s.desc}</p>
                </div>
              ))}
            </div>
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

        {/* Contract list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className={`${c.card} border ${c.border} rounded-2xl p-5 flex items-center gap-4`}>
                <div className={`w-12 h-12 rounded-xl ${c.bgMid} animate-pulse`}/>
                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-40 rounded ${c.bgMid} animate-pulse`}/>
                  <div className={`h-3 w-24 rounded ${c.bgMid} animate-pulse`}/>
                  <div className={`h-1.5 w-full rounded ${c.bgMid} animate-pulse`}/>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(ct => {
              const s           = STATUS[ct.status] || STATUS.draft
              const party       = isFreelancer ? ct.client : ct.freelancer
              const partyName   = party?.full_name || 'Unknown'
              const initials    = partyName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
              const total       = ct.milestones?.length || 0
              const done        = ct.milestones?.filter(m => m.status === 'approved' || m.status === 'paid').length || 0
              const progress    = total > 0 ? Math.round((done / total) * 100) : 0
              const chatLink    = ct.chat?.id
                ? `/messages?contract=${ct.id}`
                : `/messages`

              return (
                <Link key={ct.id} to={chatLink}
                  className={`${c.card} border ${c.border} rounded-2xl p-5 flex items-center gap-4 transition-all
                    ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-[#f8f8f8]'} hover:scale-[1.005] block`}>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center font-extrabold text-sm text-green-500 flex-shrink-0`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${c.text}`}>{partyName}</p>
                          <p className={`text-xs ${c.muted} truncate`}>
                            {ct.title}
                            {total > 0 && ` · ${total} milestone${total > 1 ? 's' : ''}`}
                            {ct.created_at && ` · ${new Date(ct.created_at).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {ct.escrow_funded && (
                            <span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                              <Lock size={9}/> Funded
                            </span>
                          )}
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}>
                            {s.label}
                          </span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      {total > 0 && (
                        <>
                          <div className={`mt-3 h-1.5 rounded-full ${c.bgMid}`}>
                            <div className="h-1.5 rounded-full bg-green-500 transition-all" style={{ width: `${progress}%` }}/>
                          </div>
                          <p className={`text-xs mt-1 ${c.muted}`}>{progress}% complete · {done}/{total} milestones</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-base font-extrabold ${c.text}`}>
                      ₦{ct.total_value?.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <MessageSquare size={11} className={c.muted}/>
                      <span className={`text-xs ${c.muted}`}>Open chat</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className={`${c.card} border ${c.border} rounded-2xl p-16 text-center`}>
            <div className="text-4xl mb-4">📋</div>
            <p className={`font-bold text-lg ${c.text} mb-2`}>No contracts yet</p>
            <p className={`text-sm ${c.light} mb-6 max-w-sm mx-auto`}>
              {isFreelancer
                ? 'Apply for a job on your dashboard. Once you and a client agree on scope, Colle will generate a contract inside your chat.'
                : 'Post a job to connect with freelancers. Colle will help you draft a contract from your conversation.'}
            </p>
            <Link to={isFreelancer ? '/jobs' : '/contracts/new'}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${c.btn}`}>
              <Plus size={14}/>
              {isFreelancer ? 'Browse Jobs' : 'Post a Job'}
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
