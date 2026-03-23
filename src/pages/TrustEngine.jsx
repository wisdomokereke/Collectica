import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Search, Shield, CheckCircle, XCircle,
  ChevronRight, Users, Star, FileText, Clock,
  TrendingUp, TrendingDown, AlertTriangle, Filter
} from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

// ── Trust level from score ─────────────────────────────────
function trustLevel(score) {
  if (score >= 75) return 'trusted'
  if (score >= 45) return 'caution'
  return 'high_risk'
}

const LVL = {
  trusted:   { label: 'Verified Trusted',      color: 'text-green-500',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  emoji: '✅', bar: 'bg-green-500'  },
  caution:   { label: 'Proceed with Caution',  color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', emoji: '⚠️', bar: 'bg-orange-500' },
  high_risk: { label: 'High Risk',             color: 'text-red-500',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    emoji: '🚩', bar: 'bg-red-500'    },
}

// ── Score ring ─────────────────────────────────────────────
function ScoreRing({ score, level, size = 80 }) {
  const r = 34, circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = level === 'trusted' ? '#22c55e' : level === 'caution' ? '#f97316' : '#ef4444'
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#2e2e2e" strokeWidth="6"/>
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}/>
      </svg>
      <div className="absolute text-center">
        <p className="text-base font-extrabold" style={{ color }}>{score}</p>
      </div>
    </div>
  )
}

// ── Format join date ───────────────────────────────────────
function joinedAgo(dateStr) {
  if (!dateStr) return 'Recently'
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000 / 60 / 60 / 24)
  if (diff < 7)   return `${diff} day${diff !== 1 ? 's' : ''} ago`
  if (diff < 30)  return `${Math.floor(diff/7)} week${Math.floor(diff/7) !== 1 ? 's' : ''} ago`
  if (diff < 365) return `${Math.floor(diff/30)} month${Math.floor(diff/30) !== 1 ? 's' : ''} ago`
  return `${Math.floor(diff/365)} year${Math.floor(diff/365) !== 1 ? 's' : ''} ago`
}

// ── Detail modal ───────────────────────────────────────────
function ProfileModal({ profile, onClose, isDark, c, isFreelancer, user }) {
  const [contracts, setContracts]     = useState([])
  const [trustEvents, setTrustEvents] = useState([])
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [activeTab, setActiveTab]     = useState('overview')

  const level = trustLevel(profile.trust_score)
  const lvl   = LVL[level]

  useEffect(() => {
    const fetch = async () => {
      const field = profile.role === 'freelancer' ? 'freelancer_id' : 'client_id'
      const otherField = profile.role === 'freelancer' ? 'client_id' : 'freelancer_id'

      // Get their contracts
      const { data: cts } = await supabase
        .from('contracts')
        .select(`*, ${otherField === 'client_id' ? 'client:users!contracts_client_id_fkey(full_name)' : 'freelancer:users!contracts_freelancer_id_fkey(full_name)'}`)
        .eq(field, profile.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (cts) setContracts(cts)

      // Trust events from their profile
      if (profile.trust_events && Array.isArray(profile.trust_events)) {
        setTrustEvents(profile.trust_events.slice().reverse().slice(0, 8))
      }

      setLoadingDetail(false)
    }
    fetch()
  }, [profile.id])

  const completed = contracts.filter(c => c.status === 'completed').length
  const active    = contracts.filter(c => c.status === 'active').length
  const disputed  = contracts.filter(c => c.status === 'disputed').length
  const initials  = profile.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '?'

  const CT_STATUS = {
    active:             { label: 'Active',    color: 'text-green-500'  },
    completed:          { label: 'Completed', color: 'text-[#888]'     },
    disputed:           { label: 'Disputed',  color: 'text-red-500'    },
    pending_signatures: { label: 'Pending',   color: 'text-orange-500' },
    draft:              { label: 'Draft',     color: 'text-blue-400'   },
    cancelled:          { label: 'Cancelled', color: 'text-[#555]'     },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"/>
      <div
        className={`relative w-full max-w-lg ${c.card} border ${c.border} rounded-2xl overflow-hidden max-h-[92vh] flex flex-col`}
        onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${c.border} flex-shrink-0`}>
          <p className={`font-bold ${c.text}`}>Trust Profile</p>
          <button onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bgMid} ${c.light}`}>
            <XCircle size={15}/>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-6 space-y-5">

            {/* Identity */}
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center font-extrabold text-2xl text-green-500 flex-shrink-0`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-lg font-extrabold ${c.text}`}>{profile.full_name}</p>
                  {profile.trust_score >= 75 && (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle size={10}/> Verified
                    </span>
                  )}
                </div>
                <p className={`text-sm ${c.light}`}>
                  {profile.role === 'freelancer'
                    ? (profile.skills?.join(', ') || 'Freelancer')
                    : (profile.company_name || 'Client')}
                  {profile.location && ` · ${profile.location}`}
                </p>
                <p className={`text-xs ${c.muted} mt-0.5`}>
                  Joined {joinedAgo(profile.created_at)}
                </p>
              </div>
            </div>

            {/* Score banner */}
            <div className={`flex items-center gap-4 px-4 py-4 rounded-2xl border ${lvl.border} ${lvl.bg}`}>
              <ScoreRing score={profile.trust_score} level={level} size={64}/>
              <div className="flex-1">
                <p className={`text-xs ${c.muted} mb-1`}>Trust Score</p>
                <p className={`font-extrabold ${lvl.color}`}>{lvl.emoji} {lvl.label}</p>
                <div className={`mt-2 h-1.5 rounded-full ${isDark ? 'bg-[#2e2e2e]' : 'bg-[#e0e0e0]'}`}>
                  <div className={`h-1.5 rounded-full ${lvl.bar} transition-all duration-700`}
                    style={{ width: `${profile.trust_score}%` }}/>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className={`flex gap-4 border-b ${c.border}`}>
              {['overview', 'contracts', 'history'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`pb-2.5 text-xs font-bold capitalize transition-all
                    ${activeTab === tab
                      ? isDark ? 'text-white border-b-2 border-white' : 'text-[#0a0a0a] border-b-2 border-[#0a0a0a]'
                      : `${c.muted} hover:${c.light}`}`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Completed', value: completed, color: 'text-green-500' },
                    { label: 'Active',    value: active,    color: 'text-blue-400'  },
                    { label: 'Disputed',  value: disputed,  color: disputed > 0 ? 'text-red-500' : c.text },
                  ].map(s => (
                    <div key={s.label} className={`${c.bgMid} border ${c.border} rounded-xl p-3 text-center`}>
                      <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                      <p className={`text-xs ${c.muted} mt-0.5`}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {profile.bio && (
                  <div className={`${c.bgMid} border ${c.border} rounded-xl p-4`}>
                    <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Bio</p>
                    <p className={`text-sm ${c.light} leading-relaxed`}>{profile.bio}</p>
                  </div>
                )}

                {profile.role === 'freelancer' && profile.skills?.length > 0 && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map(s => (
                        <span key={s} className={`text-xs px-2.5 py-1 rounded-full border ${c.border} ${c.light} font-medium`}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.portfolio_url && (
                  <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-green-500 font-semibold hover:underline">
                    🔗 View Portfolio
                  </a>
                )}
              </div>
            )}

            {/* Contracts tab */}
            {activeTab === 'contracts' && (
              <div className="space-y-2">
                {loadingDetail ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"/>
                  </div>
                ) : contracts.length > 0 ? contracts.map(ct => {
                  const s = CT_STATUS[ct.status] || CT_STATUS.draft
                  return (
                    <div key={ct.id} className={`${c.bgMid} border ${c.border} rounded-xl p-3 flex items-center gap-3`}>
                      <FileText size={14} className={c.muted}/>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${c.text}`}>{ct.title}</p>
                        <p className={`text-xs ${c.muted}`}>
                          {new Date(ct.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs font-bold ${c.text}`}>₦{ct.total_value?.toLocaleString()}</p>
                        <span className={`text-xs font-bold ${s.color}`}>{s.label}</span>
                      </div>
                    </div>
                  )
                }) : (
                  <div className="py-10 text-center">
                    <p className={`text-sm ${c.muted}`}>No contracts on record yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Trust history tab */}
            {activeTab === 'history' && (
              <div className="space-y-2">
                {trustEvents.length > 0 ? trustEvents.map((ev, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${c.border} ${c.bgMid}`}>
                    <span className="text-base flex-shrink-0">
                      {ev.type === 'increase' ? '📈' : '📉'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${c.text} capitalize`}>
                        {ev.reason?.replace(/_/g, ' ')}
                      </p>
                      <p className={`text-xs ${c.muted} mt-0.5`}>
                        {ev.date ? new Date(ev.date).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-extrabold flex-shrink-0 ${ev.type === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                      {ev.type === 'increase' ? '+' : '-'}{ev.points}
                    </span>
                  </div>
                )) : (
                  <div className="py-10 text-center">
                    <p className={`text-sm ${c.muted}`}>No trust events recorded yet</p>
                    <p className={`text-xs ${c.muted} mt-1`}>Events appear after contracts are completed</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {level === 'trusted' ? (
                isFreelancer ? (
                  <button
                    onClick={async () => {
                      // Find if a direct chat already exists with this user
                      const { data: existing } = await supabase
                        .from('chats')
                        .select('id, job_id')
                        .eq('client_id', profile.id)
                        .eq('freelancer_id', user.id)
                        .limit(1)
                        .single()

                      if (existing) {
                        onClose()
                        window.location.href = `/messages?chat=${existing.id}`
                        return
                      }

                      // Create a direct chat without a job
                      const { data: chat } = await supabase
                        .from('chats')
                        .insert({
                          client_id:     profile.id,
                          freelancer_id: user.id,
                          job_id:        null,
                        })
                        .select()
                        .single()

                      if (chat) {
                        await supabase.from('messages').insert({
                          chat_id:   chat.id,
                          sender_id: null,
                          content:   `👋 Hi! I'm Colle. You've connected directly. Discuss your project needs and when ready, type "Colle draft contract" to formalise your agreement.`,
                          type:      'colle',
                        })
                        onClose()
                        window.location.href = `/messages?chat=${chat.id}`
                      }
                    }}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm text-center transition-all
                      ${isDark ? 'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]' : 'bg-[#0a0a0a] text-white hover:bg-[#222]'}`}>
                    💬 Start a Conversation
                  </button>
                ) : (
                  <Link to="/contracts/new"
                    className={`flex-1 py-3 rounded-xl font-bold text-sm text-center transition-all
                      ${isDark ? 'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]' : 'bg-[#0a0a0a] text-white hover:bg-[#222]'}`}>
                    📄 Post a Job
                  </Link>
                )
              ) : (
                <div className={`flex-1 py-3 rounded-xl font-bold text-sm text-center cursor-not-allowed
                  ${level === 'high_risk'
                    ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                    : 'bg-orange-500/10 text-orange-500 border border-orange-500/30'}`}>
                  {level === 'high_risk' ? '🚫 High Risk — Proceed with Extreme Care' : '⚠️ Use Milestone Protection'}
                </div>
              )}
              <button onClick={onClose}
                className={`px-5 py-3 rounded-xl border font-semibold text-sm ${c.border} ${c.light}`}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
export default function TrustEngine() {
  const { theme, toggle } = useTheme()
  const { user, isFreelancer } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const [profiles, setProfiles] = useState([])
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')

  const targetRole = isFreelancer ? 'client' : 'freelancer'
  const roleLabel  = isFreelancer ? 'Clients' : 'Freelancers'

  const c = {
    bg:     isDark ? 'bg-[#0a0a0a]'     : 'bg-[#f8f8f8]',
    card:   isDark ? 'bg-[#111]'        : 'bg-white',
    bgMid:  isDark ? 'bg-[#1a1a1a]'     : 'bg-[#f0f0f0]',
    border: isDark ? 'border-[#2e2e2e]' : 'border-[#e0e0e0]',
    text:   isDark ? 'text-white'       : 'text-[#0a0a0a]',
    muted:  isDark ? 'text-[#555]'      : 'text-[#aaa]',
    light:  isDark ? 'text-[#888]'      : 'text-[#666]',
    divider:isDark ? 'bg-[#2e2e2e]'     : 'bg-[#e0e0e0]',
    input:  isDark
      ? 'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e] focus:border-white'
      : 'bg-white text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0] focus:border-[#0a0a0a]',
  }

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchProfiles()
  }, [user, isFreelancer])

  const fetchProfiles = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', targetRole)
      .neq('id', user.id)
      .order('trust_score', { ascending: false })

    if (!error && data) setProfiles(data)
    setLoading(false)
  }

  const filtered = profiles.filter(p => {
    const name     = p.full_name?.toLowerCase() || ''
    const skills   = p.skills?.join(' ').toLowerCase() || ''
    const company  = p.company_name?.toLowerCase() || ''
    const loc      = p.location?.toLowerCase() || ''
    const matchQ   = !query ||
      name.includes(query.toLowerCase()) ||
      skills.includes(query.toLowerCase()) ||
      company.includes(query.toLowerCase()) ||
      loc.includes(query.toLowerCase())
    const level    = trustLevel(p.trust_score)
    const matchF   = filter === 'all' || level === filter
    return matchQ && matchF
  })

  // Stats
  const trustedCount   = profiles.filter(p => trustLevel(p.trust_score) === 'trusted').length
  const cautionCount   = profiles.filter(p => trustLevel(p.trust_score) === 'caution').length
  const highRiskCount  = profiles.filter(p => trustLevel(p.trust_score) === 'high_risk').length
  const avgScore       = profiles.length > 0
    ? Math.round(profiles.reduce((s, p) => s + (p.trust_score || 0), 0) / profiles.length)
    : 0

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${c.bg}`}>

      {/* Header */}
      <header className={`sticky top-0 z-20 flex items-center justify-between px-6 md:px-10 py-4 border-b ${c.border} ${c.card}`}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={`flex items-center gap-2 text-sm font-semibold ${c.light}`}>
            <ArrowLeft size={15}/> Dashboard
          </Link>
          <div className={`w-px h-4 ${c.divider}`}/>
          <div className="flex items-center gap-2">
            <Shield size={15} className={c.muted}/>
            <span className={`text-sm font-bold ${c.text}`}>Trust Engine</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${c.border} text-xs font-bold ${c.muted}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
            AI Active
          </div>
          <button onClick={toggle}
            className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm
              ${isDark ? 'border-[#2e2e2e] bg-[#1a1a1a]' : 'border-[#e0e0e0] bg-[#f0f0f0]'}`}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-10 py-10 max-w-5xl mx-auto w-full">

        {/* Title */}
        <div className="mb-8">
          <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Platform Overview</p>
          <h1 className={`text-4xl font-extrabold tracking-tight ${c.text}`}>Trust Engine</h1>
          <p className={`text-sm ${c.light} mt-2`}>
            All <strong>{roleLabel}</strong> on Collectica. Every score is calculated from real contract history.
          </p>
        </div>

        {/* Platform stats */}
        {!loading && profiles.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: `Total ${roleLabel}`, value: profiles.length,  color: c.text        },
              { label: 'Trusted',            value: trustedCount,      color: 'text-green-500'  },
              { label: 'Caution',            value: cautionCount,      color: 'text-orange-500' },
              { label: 'Avg Score',          value: `${avgScore}/100`, color: 'text-green-500'  },
            ].map(s => (
              <div key={s.label} className={`${c.card} border ${c.border} rounded-2xl p-4`}>
                <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>{s.label}</p>
                <p className={`text-2xl font-extrabold tracking-tight ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search + filter */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 ${c.muted}`}/>
            <input type="text"
              placeholder={`Search ${roleLabel.toLowerCase()} by name, skill, location...`}
              value={query} onChange={e => setQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${c.input}`}/>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all',       label: 'All'       },
              { key: 'trusted',   label: '✅ Trusted' },
              { key: 'caution',   label: '⚠️ Caution' },
              { key: 'high_risk', label: '🚩 Risk'    },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all
                  ${filter === f.key
                    ? isDark ? 'bg-white text-[#0a0a0a] border-white' : 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                    : `${c.border} ${c.muted}`}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <p className={`text-xs ${c.muted} mb-4`}>
            Showing {filtered.length} of {profiles.length} {roleLabel.toLowerCase()}
            {query && ` matching "${query}"`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className={`${c.card} border ${c.border} rounded-2xl p-5`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl ${c.bgMid} animate-pulse`}/>
                  <div className="flex-1 space-y-2">
                    <div className={`h-3 w-28 rounded ${c.bgMid} animate-pulse`}/>
                    <div className={`h-2 w-20 rounded ${c.bgMid} animate-pulse`}/>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${c.bgMid} animate-pulse`}/>
                </div>
                <div className={`h-8 rounded-xl ${c.bgMid} animate-pulse`}/>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => {
              const level   = trustLevel(p.trust_score)
              const lvl     = LVL[level]
              const initials = p.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '?'
              const subtitle = p.role === 'freelancer'
                ? (p.skills?.slice(0,2).join(', ') || 'Freelancer')
                : (p.company_name || 'Client')

              return (
                <button key={p.id} onClick={() => setSelected(p)}
                  className={`${c.card} border ${c.border} rounded-2xl p-5 text-left transition-all hover:scale-[1.02]
                    ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-[#f8f8f8]'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center font-extrabold text-base text-green-500 flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-bold truncate ${c.text}`}>{p.full_name}</p>
                        {level === 'trusted' && <CheckCircle size={11} className="text-green-500 flex-shrink-0"/>}
                      </div>
                      <p className={`text-xs ${c.muted} truncate`}>
                        {subtitle}{p.location ? ` · ${p.location}` : ''}
                      </p>
                    </div>
                    <ScoreRing score={p.trust_score} level={level} size={50}/>
                  </div>

                  {/* Trust badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${lvl.border} ${lvl.bg}`}>
                    <span className="text-sm">{lvl.emoji}</span>
                    <span className={`text-xs font-bold ${lvl.color} flex-1`}>{lvl.label}</span>
                    <ChevronRight size={12} className={lvl.color}/>
                  </div>

                  {/* Join date */}
                  <p className={`text-xs mt-3 ${c.muted}`}>
                    Joined {joinedAgo(p.created_at)}
                  </p>
                </button>
              )
            })}
          </div>
        ) : (
          <div className={`${c.card} border ${c.border} rounded-2xl p-16 text-center`}>
            <Users size={32} className={`mx-auto mb-3 ${c.muted}`}/>
            <p className={`font-bold ${c.text}`}>
              {profiles.length === 0
                ? `No ${roleLabel.toLowerCase()} on Collectica yet`
                : `No ${roleLabel.toLowerCase()} match your search`}
            </p>
            <p className={`text-sm ${c.light} mt-1`}>
              {profiles.length === 0
                ? 'Invite others to join and their profiles will appear here.'
                : 'Try a different name, skill or location'}
            </p>
          </div>
        )}
      </main>

      {/* Profile modal */}
      {selected && (
        <ProfileModal
          profile={selected}
          onClose={() => setSelected(null)}
          user={user}
          isDark={isDark}
          c={c}
          isFreelancer={isFreelancer}
        />
      )}
    </div>
  )
}
