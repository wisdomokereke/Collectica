import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Shield, Wallet,
  LogOut, MessageSquare, TrendingUp, Clock,
  CheckCircle, Plus, Bell, Menu, Briefcase,
  Star, ArrowUpRight, User
} from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth, ROLES } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

// ── Navigation items ───────────────────────────────────────
const NAV = [
  { icon: <LayoutDashboard size={17}/>, label: 'Overview',     path: '/dashboard' },
  { icon: <Briefcase size={17}/>,       label: 'Jobs',         path: '/jobs' },
  { icon: <FileText size={17}/>,        label: 'Contracts',    path: '/contracts' },
  { icon: <Wallet size={17}/>,          label: 'Escrow',       path: '/escrow' },
  { icon: <MessageSquare size={17}/>,   label: 'Messages',     path: '/messages' },
  { icon: <Shield size={17}/>,          label: 'Trust Engine', path: '/trust' },
]

// ── Timezone-aware greeting ────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5  && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Good night'
}

// ── Typewriter animation ───────────────────────────────────
function useTypewriter(texts, typingSpeed = 45, deletingSpeed = 25, pauseMs = 2500) {
  const [display, setDisplay] = useState('')
  const [idx, setIdx]         = useState(0)
  const [typing, setTyping]   = useState(true)
  const timer = useRef(null)

  useEffect(() => {
    const target = texts[idx]
    if (typing) {
      if (display.length < target.length) {
        timer.current = setTimeout(() => setDisplay(target.slice(0, display.length + 1)), typingSpeed)
      } else {
        timer.current = setTimeout(() => setTyping(false), pauseMs)
      }
    } else {
      if (display.length > 0) {
        timer.current = setTimeout(() => setDisplay(d => d.slice(0, -1)), deletingSpeed)
      } else {
        setIdx(i => (i + 1) % texts.length)
        setTyping(true)
      }
    }
    return () => clearTimeout(timer.current)
  }, [display, typing, idx, texts])

  return display
}

// ══════════════════════════════════════════════════════════
export default function Dashboard() {
  const { theme, toggle } = useTheme()
  const { user, profile, activeView, switchView, signOut, displayName, isFreelancer } = useAuth()
  const navigate  = useNavigate()
  const isDark    = theme === 'dark'

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [contracts, setContracts]     = useState([])
  const [activity, setActivity]       = useState([])
  const [stats, setStats]             = useState(null)
  const [loadingData, setLoadingData] = useState(true)

  // ── Typewriter texts per role ──────────────────────────
  const TEXTS = isFreelancer ? [
    "Here's your freelance overview",
    'Draft contracts from just your chats',
    'Trust Engine protects your reputation',
    'Smart escrow holds every payment safely',
    'Milestone protection keeps clients honest',
    'File deliverables directly in chat',
    'Colle AI is your legal partner',
  ] : [
    "Here's your client overview",
    'Hire with confidence — escrow protects you',
    'AI drafts contracts from your conversations',
    'Know every freelancer before you hire',
    'Set milestone reviews — no surprises',
    'Release payments with one tap',
    'Real-time visibility into every contract',
  ]

  const animText = useTypewriter(TEXTS)

  // ── Load dashboard data ────────────────────────────────
  useEffect(() => {
    if (!user) { navigate('/login'); return }
    loadData()

    // Real-time: refresh when new transactions come in
    const channel = supabase
      .channel('dashboard-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'transactions',
        filter: `user_id=eq.${user.id}`
      }, loadData)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  const loadData = async () => {
    if (!user) return
    setLoadingData(true)
    try {
      await Promise.all([fetchContracts(), fetchActivity(), fetchStats()])
    } finally {
      setLoadingData(false)
    }
  }

  const fetchContracts = async () => {
    const field = isFreelancer ? 'freelancer_id' : 'client_id'
    const { data } = await supabase
      .from('contracts')
      .select(`*, client:users!contracts_client_id_fkey(full_name), freelancer:users!contracts_freelancer_id_fkey(full_name)`)
      .eq(field, user.id)
      .in('status', ['active', 'pending_signatures', 'draft'])
      .order('created_at', { ascending: false })
      .limit(4)
    if (data) setContracts(data)
  }

  const fetchActivity = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setActivity(data)
  }

  const fetchStats = async () => {
    const field = isFreelancer ? 'freelancer_id' : 'client_id'

    // Total contracts
    const { count: totalContracts } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq(field, user.id)

    // Active contracts
    const { count: activeContracts } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq(field, user.id)
      .eq('status', 'active')

    // Pending milestones
    const { count: pendingMilestones } = await supabase
      .from('milestones')
      .select('*, contract:contracts!inner(*)', { count: 'exact', head: true })
      .eq(`contract.${field}`, user.id)
      .eq('status', 'submitted')

    setStats({
      wallet: profile?.wallet_balance || 0,
      totalContracts: totalContracts || 0,
      activeContracts: activeContracts || 0,
      pendingMilestones: pendingMilestones || 0,
      trustScore: profile?.trust_score || 70,
    })
  }

  if (!user) return null

  // ── Theme colors ──────────────────────────────────────
  const c = {
    bg:      isDark ? 'bg-[#0a0a0a]'     : 'bg-[#f8f8f8]',
    sidebar: isDark ? 'bg-[#111]'        : 'bg-white',
    card:    isDark ? 'bg-[#111]'        : 'bg-white',
    bgMid:   isDark ? 'bg-[#1a1a1a]'     : 'bg-[#f0f0f0]',
    border:  isDark ? 'border-[#2e2e2e]' : 'border-[#e0e0e0]',
    text:    isDark ? 'text-white'       : 'text-[#0a0a0a]',
    muted:   isDark ? 'text-[#555]'      : 'text-[#aaa]',
    light:   isDark ? 'text-[#888]'      : 'text-[#666]',
    navItem: isDark
      ? 'text-[#555] hover:bg-[#1a1a1a] hover:text-white'
      : 'text-[#aaa] hover:bg-[#f0f0f0] hover:text-[#0a0a0a]',
    navAct:  isDark ? 'bg-[#1a1a1a] text-white' : 'bg-[#f0f0f0] text-[#0a0a0a]',
    btn:     isDark ? 'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]' : 'bg-[#0a0a0a] text-white hover:bg-[#222]',
    divider: isDark ? 'bg-[#2e2e2e]'     : 'bg-[#e0e0e0]',
  }

  const STATUS_COLORS = {
    active:             'text-green-500 bg-green-500/10',
    pending_signatures: 'text-orange-500 bg-orange-500/10',
    draft:              'text-blue-400 bg-blue-400/10',
    completed:          'text-[#888] bg-white/5',
  }

  const txIcon = (type) => ({
    deposit:        '💳',
    escrow_lock:    '🔒',
    escrow_release: '💸',
    withdrawal:     '🏦',
    refund:         '↩️',
  }[type] || '📋')

  // ── Sidebar ────────────────────────────────────────────
  const Sidebar = () => (
    <aside className={`flex flex-col h-full ${c.sidebar} border-r ${c.border}`}>

      {/* Logo + theme toggle */}
      <div className={`flex items-center justify-between px-5 py-5 border-b ${c.border}`}>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0a0a0a] flex items-center justify-center">
            <Shield size={13} className="text-green-500"/>
          </div>
          <span className={`text-sm font-extrabold tracking-tight ${c.text}`}>Collectica</span>
        </Link>
        <button onClick={toggle}
          className={`w-7 h-7 rounded-full ${c.bgMid} flex items-center justify-center text-sm`}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Role toggle */}
      <div className={`px-4 py-3 border-b ${c.border}`}>
        <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>View as</p>
        <div className={`flex rounded-xl p-1 ${c.bgMid}`}>
          {[ROLES.FREELANCER, ROLES.CLIENT].map(r => (
            <button key={r} onClick={() => switchView(r)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all capitalize
                ${activeView === r
                  ? isDark ? 'bg-white text-[#0a0a0a]' : 'bg-[#0a0a0a] text-white'
                  : c.muted}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* User card */}
      <div className={`px-4 py-4 border-b ${c.border}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center font-extrabold text-sm text-green-500`}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate ${c.text}`}>{displayName}</p>
            <p className={`text-xs ${c.muted} capitalize`}>{activeView}</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between mb-1">
            <span className={`text-xs ${c.muted}`}>Trust Score</span>
            <span className="text-xs font-bold text-green-500">{profile?.trust_score || 70}/100</span>
          </div>
          <div className={`h-1.5 rounded-full ${c.bgMid}`}>
            <div className="h-1.5 rounded-full bg-green-500 transition-all duration-700"
              style={{ width: `${profile?.trust_score || 70}%` }}/>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(item => (
          <Link key={item.label} to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${item.path === '/dashboard' ? c.navAct : c.navItem}`}>
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Wallet balance in sidebar */}
      <div className={`mx-3 mb-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20`}>
        <p className={`text-xs font-bold uppercase tracking-widest text-green-500 mb-1`}>Wallet</p>
        <p className="text-xl font-extrabold text-green-500">
          ₦{(profile?.wallet_balance || 0).toLocaleString()}
        </p>
        <Link to="/escrow"
          className="text-xs text-green-500/70 hover:text-green-500 font-semibold mt-1 inline-flex items-center gap-1">
          Manage <ArrowUpRight size={10}/>
        </Link>
      </div>

      {/* Logout */}
      <div className={`p-4 border-t ${c.border}`}>
        <button
          onClick={async () => { await signOut(); navigate('/login') }}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${c.navItem}`}>
          <LogOut size={17}/> Log out
        </button>
      </div>
    </aside>
  )

  return (
    <div className={`h-screen flex overflow-hidden transition-colors duration-300 ${c.bg}`}>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 flex-shrink-0 flex-col h-full">
        <Sidebar/>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}/>
          <div className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col">
            <Sidebar/>
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className={`flex items-center justify-between px-6 py-4 border-b ${c.border} ${c.card} flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-lg ${c.bgMid}`}>
              <Menu size={18} className={c.text}/>
            </button>
            <div>
              <h1 className={`text-lg font-extrabold tracking-tight ${c.text}`}>
                {getGreeting()}, {displayName.split(' ')[0]} 👋
              </h1>
              <p className={`text-xs ${c.light} h-4 flex items-center gap-1`}>
                <span>{animText}</span>
                <span className="animate-pulse text-green-500 font-bold">|</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/contracts/new"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${c.btn}`}>
              <Plus size={14}/> New Contract
            </Link>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* ── Stats grid ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Wallet Balance',
                value: `₦${(stats?.wallet || 0).toLocaleString()}`,
                sub: 'Available funds',
                icon: <Wallet size={15}/>,
                color: 'text-green-500',
              },
              {
                label: 'Active Contracts',
                value: stats?.activeContracts ?? '—',
                sub: `${stats?.totalContracts ?? 0} total`,
                icon: <FileText size={15}/>,
                color: c.text,
              },
              {
                label: isFreelancer ? 'Pending Approvals' : 'Awaiting Review',
                value: stats?.pendingMilestones ?? '—',
                sub: 'Milestones submitted',
                icon: <Clock size={15}/>,
                color: stats?.pendingMilestones > 0 ? 'text-orange-500' : c.text,
              },
              {
                label: 'Trust Score',
                value: `${stats?.trustScore ?? 70}/100`,
                sub: 'Your reputation',
                icon: <Shield size={15}/>,
                color: 'text-green-500',
              },
            ].map(stat => (
              <div key={stat.label} className={`${c.card} border ${c.border} rounded-2xl p-5`}>
                <div className={`flex items-center gap-2 mb-3 ${c.muted}`}>
                  {stat.icon}
                  <span className="text-xs font-bold uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className={`text-2xl font-extrabold tracking-tight ${stat.color}`}>
                  {loadingData ? <span className={`inline-block w-16 h-6 rounded ${c.bgMid} animate-pulse`}/> : stat.value}
                </p>
                <p className={`text-xs mt-1 ${c.muted}`}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Active contracts ── */}
          <div className={`${c.card} border ${c.border} rounded-2xl overflow-hidden`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${c.border}`}>
              <p className={`text-sm font-bold ${c.text}`}>Active Contracts</p>
              <Link to="/contracts" className="text-xs font-bold text-green-500 hover:underline">
                View all
              </Link>
            </div>

            {loadingData ? (
              <div className="divide-y" style={{ borderColor: isDark ? '#2e2e2e' : '#e0e0e0' }}>
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className={`w-10 h-10 rounded-xl ${c.bgMid} animate-pulse`}/>
                    <div className="flex-1 space-y-2">
                      <div className={`h-3 w-32 rounded ${c.bgMid} animate-pulse`}/>
                      <div className={`h-2 w-20 rounded ${c.bgMid} animate-pulse`}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : contracts.length > 0 ? (
              <div className="divide-y" style={{ borderColor: isDark ? '#2e2e2e' : '#e0e0e0' }}>
                {contracts.map((ct) => {
                  const party = isFreelancer ? ct.client : ct.freelancer
                  const partyName = party?.full_name || 'Unknown'
                  const initials = partyName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
                  return (
                    <div key={ct.id}
                      className={`flex items-center gap-4 px-6 py-4 ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-[#f8f8f8]'} transition-colors`}>
                      <div className={`w-10 h-10 rounded-xl ${c.bgMid} border ${c.border} flex items-center justify-center font-bold text-xs ${c.text}`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${c.text}`}>{partyName}</p>
                        <p className={`text-xs ${c.muted} truncate`}>{ct.title}</p>
                        <div className={`mt-2 h-1 rounded-full ${c.bgMid}`}>
                          <div className="h-1 rounded-full bg-green-500" style={{ width: '40%' }}/>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-extrabold ${c.text}`}>
                          ₦{ct.total_value?.toLocaleString()}
                        </p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[ct.status] || STATUS_COLORS.draft}`}>
                          {ct.status?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="text-3xl mb-3">📋</div>
                <p className={`text-sm font-bold ${c.text}`}>No active contracts yet</p>
                <p className={`text-xs ${c.muted} mt-1 mb-4`}>
                  {isFreelancer ? 'Browse jobs and apply to get started.' : 'Post a job or create a contract to get started.'}
                </p>
                <Link to={isFreelancer ? '/jobs' : '/contracts/new'}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${c.btn}`}>
                  <Plus size={13}/> {isFreelancer ? 'Browse Jobs' : 'New Contract'}
                </Link>
              </div>
            )}
          </div>

          {/* ── Recent Activity ── */}
          <div className={`${c.card} border ${c.border} rounded-2xl overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${c.border}`}>
              <p className={`text-sm font-bold ${c.text}`}>Recent Activity</p>
            </div>
            <div className="divide-y" style={{ borderColor: isDark ? '#2e2e2e' : '#e0e0e0' }}>
              {activity.length > 0 ? activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-6 py-3">
                  <span className="text-lg flex-shrink-0">{txIcon(a.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${c.text}`}>{a.description || a.type}</p>
                    <p className={`text-xs ${c.muted} mt-0.5`}>
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className={`text-sm font-bold flex-shrink-0 ${a.type === 'deposit' || a.type === 'escrow_release' ? 'text-green-500' : c.text}`}>
                    {a.type === 'deposit' || a.type === 'escrow_release' ? '+' : '-'}₦{a.amount?.toLocaleString()}
                  </p>
                </div>
              )) : (
                // Default state for new users
                [
                  { e: '🎉', t: `Welcome to Collectica, ${displayName.split(' ')[0]}!`, time: 'Just now' },
                  { e: '🛡️', t: 'Your signing key is ready — start a contract anytime', time: 'Just now' },
                  { e: '💰', t: 'Add funds to your wallet to begin your first deal', time: 'Just now' },
                  { e: '🤖', t: 'Colle AI is active and ready to draft your first contract', time: 'Just now' },
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-6 py-3">
                    <span className="text-lg">{a.e}</span>
                    <div>
                      <p className={`text-xs font-medium ${c.text}`}>{a.t}</p>
                      <p className={`text-xs ${c.muted} mt-0.5`}>{a.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
