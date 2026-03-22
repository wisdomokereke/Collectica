import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Shield, Wallet, LogOut,
  MessageSquare, TrendingUp, Clock, CheckCircle, Plus,
  Menu, Briefcase, User, ArrowUpRight, Star, Search,
  MapPin, DollarSign, Calendar, ChevronRight, Bell, Send
} from 'lucide-react'

// ── Apply button — creates chat then navigates to messages ──
function ApplyButton({ job, userId, navigate, c, isDark }) {
  const [applying, setApplying] = useState(false)
  const [applied, setApplied]   = useState(false)

  const handleApply = async () => {
    setApplying(true)
    try {
      // Check if already applied
      const { data: existing } = await supabase
        .from('job_applications')
        .select('id, chat_id')
        .eq('job_id', job.id)
        .eq('freelancer_id', userId)
        .single()

      if (existing) {
        // Already applied — go straight to chat
        navigate(`/messages?job=${job.id}`)
        return
      }

      // Create chat between freelancer and client
      const { data: chat, error: chatErr } = await supabase
        .from('chats')
        .insert({
          job_id:        job.id,
          client_id:     job.client_id,
          freelancer_id: userId,
        })
        .select()
        .single()

      if (chatErr) throw chatErr

      // Record application
      await supabase.from('job_applications').insert({
        job_id:       job.id,
        freelancer_id: userId,
        chat_id:      chat.id,
        status:       'pending',
      })

      // Send opening system message from Colle
      await supabase.from('messages').insert({
        chat_id:   chat.id,
        sender_id: null,
        content:   `👋 A freelancer has applied for "${job.title}". Both parties are now connected. Type Colle at any time for AI contract assistance.`,
        type:      'system',
      })

      setApplied(true)
      navigate(`/messages?job=${job.id}`)
    } catch (err) {
      console.error('Apply error:', err)
    } finally {
      setApplying(false)
    }
  }

  return (
    <button onClick={handleApply} disabled={applying || applied}
      className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60
        flex items-center gap-1.5
        ${isDark ? 'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]' : 'bg-[#0a0a0a] text-white hover:bg-[#222]'}`}>
      {applying
        ? <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/> Applying...</>
        : applied ? '✓ Applied'
        : <><Send size={11}/> Apply</>}
    </button>
  )
}
import { useTheme } from '../lib/ThemeContext'
import { useAuth, ROLES } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const NAV_FREELANCER = [
  { icon: <Briefcase size={17}/>,     label: 'Find Jobs',    path: '/jobs' },
  { icon: <FileText size={17}/>,      label: 'Contracts',   path: '/contracts' },
  { icon: <Wallet size={17}/>,        label: 'Wallet',      path: '/escrow' },
  { icon: <MessageSquare size={17}/>, label: 'Messages',    path: '/messages' },
  { icon: <Shield size={17}/>,        label: 'Trust Engine',path: '/trust' },
]

const NAV_CLIENT = [
  { icon: <LayoutDashboard size={17}/>, label: 'Dashboard',   path: '/dashboard' },
  { icon: <FileText size={17}/>,        label: 'Contracts',   path: '/contracts' },
  { icon: <Wallet size={17}/>,          label: 'Wallet',      path: '/escrow' },
  { icon: <MessageSquare size={17}/>,   label: 'Messages',    path: '/messages' },
  { icon: <Shield size={17}/>,          label: 'Trust Engine',path: '/trust' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 21) return 'Good evening'
  return 'Good night'
}

function useTypewriter(texts, speed = 45, deleteSpeed = 25, pause = 2500) {
  const [display, setDisplay] = useState('')
  const [idx, setIdx]         = useState(0)
  const [typing, setTyping]   = useState(true)
  const timer = useRef(null)
  useEffect(() => {
    const target = texts[idx]
    if (typing) {
      if (display.length < target.length)
        timer.current = setTimeout(() => setDisplay(target.slice(0, display.length + 1)), speed)
      else
        timer.current = setTimeout(() => setTyping(false), pause)
    } else {
      if (display.length > 0)
        timer.current = setTimeout(() => setDisplay(d => d.slice(0, -1)), deleteSpeed)
      else { setIdx(i => (i + 1) % texts.length); setTyping(true) }
    }
    return () => clearTimeout(timer.current)
  }, [display, typing, idx, texts])
  return display
}

// ── Trust score colour ─────────────────────────────────────
function trustColor(score) {
  if (score >= 80) return 'text-green-500'
  if (score >= 50) return 'text-orange-500'
  return 'text-red-500'
}

export default function Dashboard() {
  const { theme, toggle } = useTheme()
  const { user, profile, activeView, switchView, signOut, displayName, isFreelancer } = useAuth()
  const navigate  = useNavigate()
  const isDark    = theme === 'dark'

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [contracts, setContracts]     = useState([])
  const [activity, setActivity]       = useState([])
  const [jobs, setJobs]               = useState([])
  const [postedJobs, setPostedJobs]   = useState([])
  const [stats, setStats]             = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [jobSearch, setJobSearch]     = useState('')

  const TEXTS = isFreelancer ? [
    "Here's your freelance overview",
    'Browse jobs and apply today',
    'Trust Engine protects your reputation',
    'Smart escrow holds every payment safely',
    'Colle AI is your legal partner',
    'File deliverables directly in chat',
  ] : [
    "Here's your client overview",
    'Create a contract and hire today',
    'Escrow protects every payment you make',
    'AI drafts contracts from your conversations',
    'Set milestones — pay only for delivered work',
    'Trust Engine — know every freelancer before you hire',
  ]
  const animText = useTypewriter(TEXTS)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    loadAll()
    const ch = supabase.channel('dash-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, loadAll)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user, activeView])

  const loadAll = async () => {
    if (!user) return
    setLoadingData(true)
    await Promise.all([fetchContracts(), fetchActivity(), fetchStats(), isFreelancer ? fetchJobs() : fetchPostedJobs()])
    setLoadingData(false)
  }

  const fetchContracts = async () => {
    const field = isFreelancer ? 'freelancer_id' : 'client_id'
    const { data } = await supabase
      .from('contracts')
      .select(`*, client:users!contracts_client_id_fkey(full_name), freelancer:users!contracts_freelancer_id_fkey(full_name)`)
      .eq(field, user.id)
      .in('status', ['active', 'pending_signatures', 'draft'])
      .order('created_at', { ascending: false })
      .limit(3)
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
    const [{ count: total }, { count: active }, { count: pending }] = await Promise.all([
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq(field, user.id),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq(field, user.id).eq('status', 'active'),
      supabase.from('milestones').select('*, contract:contracts!inner(*)', { count: 'exact', head: true })
        .eq(`contract.${field}`, user.id).eq('status', 'submitted'),
    ])
    setStats({
      wallet: profile?.wallet_balance ?? 0,
      total: total ?? 0,
      active: active ?? 0,
      pending: pending ?? 0,
      trust: profile?.trust_score ?? 100,
    })
  }

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*, client:users!jobs_client_id_fkey(full_name, trust_score)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setJobs(data)
  }

  const fetchPostedJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*, job_applications(id)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setPostedJobs(data)
  }

  if (!user) return null

  const c = {
    bg:      isDark ? 'bg-[#0a0a0a]'     : 'bg-[#f8f8f8]',
    sidebar: isDark ? 'bg-[#111]'        : 'bg-white',
    card:    isDark ? 'bg-[#111]'        : 'bg-white',
    bgMid:   isDark ? 'bg-[#1a1a1a]'     : 'bg-[#f0f0f0]',
    border:  isDark ? 'border-[#2e2e2e]' : 'border-[#e0e0e0]',
    text:    isDark ? 'text-white'       : 'text-[#0a0a0a]',
    muted:   isDark ? 'text-[#555]'      : 'text-[#aaa]',
    light:   isDark ? 'text-[#888]'      : 'text-[#666]',
    navItem: isDark ? 'text-[#555] hover:bg-[#1a1a1a] hover:text-white' : 'text-[#aaa] hover:bg-[#f0f0f0] hover:text-[#0a0a0a]',
    navAct:  isDark ? 'bg-[#1a1a1a] text-white' : 'bg-[#f0f0f0] text-[#0a0a0a]',
    btn:     isDark ? 'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]' : 'bg-[#0a0a0a] text-white hover:bg-[#222]',
    input:   isDark ? 'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e] focus:border-white'
                    : 'bg-white text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0] focus:border-[#0a0a0a]',
  }

  const STATUS = {
    active:             'text-green-500 bg-green-500/10',
    pending_signatures: 'text-orange-500 bg-orange-500/10',
    draft:              'text-blue-400 bg-blue-400/10',
    completed:          'text-[#888] bg-white/5',
  }

  const txIcon = t => ({ deposit:'💳', escrow_lock:'🔒', escrow_release:'💸', withdrawal:'🏦', refund:'↩️' }[t] || '📋')

  const filteredJobs = jobs.filter(j =>
    !jobSearch || j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.category.toLowerCase().includes(jobSearch.toLowerCase())
  )

  const NAV = isFreelancer ? NAV_FREELANCER : NAV_CLIENT
  const currentPath = isFreelancer ? '/jobs' : '/dashboard'

  // ── Sidebar ───────────────────────────────────────────────
  const Sidebar = () => (
    <aside className={`flex flex-col h-full ${c.sidebar} border-r ${c.border}`}>
      <div className={`flex items-center justify-between px-5 py-5 border-b ${c.border}`}>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0a0a0a] flex items-center justify-center">
            <Shield size={13} className="text-green-500"/>
          </div>
          <span className={`text-sm font-extrabold tracking-tight ${c.text}`}>Collectica</span>
        </Link>
        <button onClick={toggle} className={`w-7 h-7 rounded-full ${c.bgMid} flex items-center justify-center text-sm`}>
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
                ${activeView === r ? isDark ? 'bg-white text-[#0a0a0a]' : 'bg-[#0a0a0a] text-white' : c.muted}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* User card */}
      <div className={`px-4 py-4 border-b ${c.border}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center font-extrabold text-sm text-green-500">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate ${c.text}`}>{displayName}</p>
            <p className={`text-xs capitalize ${c.muted}`}>{activeView}</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between mb-1">
            <span className={`text-xs ${c.muted}`}>Trust Score</span>
            <span className={`text-xs font-bold ${trustColor(profile?.trust_score ?? 100)}`}>
              {profile?.trust_score ?? 100}/100
            </span>
          </div>
          <div className={`h-1.5 rounded-full ${c.bgMid}`}>
            <div className={`h-1.5 rounded-full transition-all duration-700 ${
              (profile?.trust_score ?? 100) >= 80 ? 'bg-green-500'
              : (profile?.trust_score ?? 100) >= 50 ? 'bg-orange-500' : 'bg-red-500'
            }`} style={{ width: `${profile?.trust_score ?? 100}%` }}/>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(item => (
          <Link key={item.label} to={item.path} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${item.path === currentPath ? c.navAct : c.navItem}`}>
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Wallet */}
      <div className={`mx-3 mb-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20`}>
        <p className="text-xs font-bold uppercase tracking-widest text-green-500 mb-1">Wallet</p>
        <p className="text-xl font-extrabold text-green-500">
          ₦{(profile?.wallet_balance ?? 0).toLocaleString()}
        </p>
        <Link to="/escrow" className="text-xs text-green-500/70 hover:text-green-500 font-semibold mt-1 inline-flex items-center gap-1">
          {isFreelancer ? 'View earnings' : 'Add funds'} <ArrowUpRight size={10}/>
        </Link>
      </div>

      <div className={`p-4 border-t ${c.border}`}>
        <button onClick={async () => { await signOut(); navigate('/login') }}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${c.navItem}`}>
          <LogOut size={17}/> Log out
        </button>
      </div>
    </aside>
  )

  // ── FREELANCER VIEW — Job Board ───────────────────────────
  const FreelancerView = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className={`flex items-center justify-between px-6 py-4 border-b ${c.border} ${c.card} flex-shrink-0`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className={`lg:hidden p-2 rounded-lg ${c.bgMid}`}>
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
        <div className={`hidden md:flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${c.border} ${c.muted}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
          {jobs.length} open jobs
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Wallet', value: `₦${(stats?.wallet ?? 0).toLocaleString()}`, color: 'text-green-500', icon: <Wallet size={15}/> },
            { label: 'Active Contracts', value: loadingData ? '—' : stats?.active ?? 0, color: c.text, icon: <FileText size={15}/> },
            { label: 'Pending Review', value: loadingData ? '—' : stats?.pending ?? 0, color: stats?.pending > 0 ? 'text-orange-500' : c.text, icon: <Clock size={15}/> },
            { label: 'Trust Score', value: `${stats?.trust ?? 100}/100`, color: trustColor(stats?.trust ?? 100), icon: <Shield size={15}/> },
          ].map(s => (
            <div key={s.label} className={`${c.card} border ${c.border} rounded-2xl p-4`}>
              <div className={`flex items-center gap-2 mb-2 ${c.muted}`}>{s.icon}<span className="text-xs font-bold uppercase tracking-widest">{s.label}</span></div>
              <p className={`text-xl font-extrabold tracking-tight ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Job search */}
        <div className="relative">
          <Search size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 ${c.muted}`}/>
          <input type="text" placeholder="Search jobs by title or category..."
            value={jobSearch} onChange={e => setJobSearch(e.target.value)}
            className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm outline-none transition-all ${c.input}`}/>
        </div>

        {/* Jobs list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className={`text-sm font-bold ${c.text}`}>Open Jobs</p>
            <p className={`text-xs ${c.muted}`}>{filteredJobs.length} available</p>
          </div>

          {loadingData ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className={`${c.card} border ${c.border} rounded-2xl p-5`}>
                  <div className="space-y-3">
                    <div className={`h-4 w-48 rounded ${c.bgMid} animate-pulse`}/>
                    <div className={`h-3 w-32 rounded ${c.bgMid} animate-pulse`}/>
                    <div className={`h-3 w-full rounded ${c.bgMid} animate-pulse`}/>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="space-y-3">
              {filteredJobs.map(job => (
                <div key={job.id} className={`${c.card} border ${c.border} rounded-2xl p-5 transition-all ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-[#f8f8f8]'} cursor-pointer`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className={`text-sm font-bold ${c.text}`}>{job.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-green-500/10 text-green-500`}>
                          {job.category}
                        </span>
                      </div>
                      <p className={`text-xs ${c.light} line-clamp-2 mb-3`}>{job.description}</p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className={`flex items-center gap-1 text-xs ${c.muted}`}>
                          <DollarSign size={11}/>
                          ₦{job.budget_min?.toLocaleString()} – ₦{job.budget_max?.toLocaleString()}
                        </div>
                        {job.deadline && (
                          <div className={`flex items-center gap-1 text-xs ${c.muted}`}>
                            <Calendar size={11}/>
                            {new Date(job.deadline).toLocaleDateString()}
                          </div>
                        )}
                        <div className={`flex items-center gap-1 text-xs ${c.muted}`}>
                          <User size={11}/>
                          {job.client?.full_name || 'Client'}
                          {job.client?.trust_score && (
                            <span className={`ml-1 font-bold ${trustColor(job.client.trust_score)}`}>
                              · {job.client.trust_score}/100
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ApplyButton job={job} userId={user.id} navigate={navigate} c={c} isDark={isDark}/>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`${c.card} border ${c.border} rounded-2xl p-16 text-center`}>
              <div className="text-4xl mb-3">🔍</div>
              <p className={`font-bold ${c.text}`}>
                {jobSearch ? 'No jobs match your search' : 'No open jobs right now'}
              </p>
              <p className={`text-sm ${c.muted} mt-1`}>
                {jobSearch ? 'Try a different keyword' : 'Check back soon — clients post new jobs daily'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )

  // ── CLIENT VIEW — Dashboard ───────────────────────────────
  const ClientView = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className={`flex items-center justify-between px-6 py-4 border-b ${c.border} ${c.card} flex-shrink-0`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className={`lg:hidden p-2 rounded-lg ${c.bgMid}`}>
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
        <Link to="/contracts/new"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${c.btn}`}>
          <Plus size={15}/> New Contract
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Wallet Balance', value: `₦${(stats?.wallet ?? 0).toLocaleString()}`, color: 'text-green-500', icon: <Wallet size={15}/>, link: '/escrow' },
            { label: 'Active Contracts', value: loadingData ? '—' : stats?.active ?? 0, color: c.text, icon: <FileText size={15}/>, link: '/contracts' },
            { label: 'Awaiting Review', value: loadingData ? '—' : stats?.pending ?? 0, color: stats?.pending > 0 ? 'text-orange-500' : c.text, icon: <Clock size={15}/>, link: '/contracts' },
            { label: 'Trust Score', value: `${stats?.trust ?? 100}/100`, color: trustColor(stats?.trust ?? 100), icon: <Shield size={15}/>, link: '/trust' },
          ].map(s => (
            <Link key={s.label} to={s.link} className={`${c.card} border ${c.border} rounded-2xl p-5 transition-all ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-[#f8f8f8]'}`}>
              <div className={`flex items-center gap-2 mb-3 ${c.muted}`}>{s.icon}<span className="text-xs font-bold uppercase tracking-widest">{s.label}</span></div>
              <p className={`text-2xl font-extrabold tracking-tight ${s.color}`}>{s.value}</p>
            </Link>
          ))}
        </div>

        {/* CTA if no wallet balance */}
        {!loadingData && (stats?.wallet ?? 0) === 0 && (
          <Link to="/escrow" className="block">
            <div className="p-5 rounded-2xl bg-green-500/5 border border-green-500/20 flex items-center justify-between gap-4">
              <div>
                <p className={`font-bold text-sm ${c.text}`}>Add funds to start hiring</p>
                <p className={`text-xs ${c.light} mt-0.5`}>Your wallet is empty. Top up to create contracts and fund escrow.</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-bold whitespace-nowrap">
                Add funds <ArrowUpRight size={13}/>
              </div>
            </div>
          </Link>
        )}

        {/* Posted jobs */}
        <div className={`${c.card} border ${c.border} rounded-2xl overflow-hidden`}>
          <div className={`flex items-center justify-between px-6 py-4 border-b ${c.border}`}>
            <p className={`text-sm font-bold ${c.text}`}>Your Posted Jobs</p>
            <Link to="/contracts/new" className="text-xs font-bold text-green-500 hover:underline flex items-center gap-1">
              <Plus size={11}/> Post New
            </Link>
          </div>
          {loadingData ? (
            <div className="px-6 py-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : postedJobs.length > 0 ? (
            <div className="divide-y" style={{ borderColor: isDark ? '#2e2e2e' : '#e0e0e0' }}>
              {postedJobs.map(job => (
                <div key={job.id} className={`flex items-center gap-4 px-6 py-4 ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-[#f8f8f8]'} transition-colors`}>
                  <div className={`w-10 h-10 rounded-xl ${c.bgMid} border ${c.border} flex items-center justify-center flex-shrink-0`}>
                    <Briefcase size={15} className={c.muted}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${c.text}`}>{job.title}</p>
                    <p className={`text-xs ${c.muted}`}>
                      {job.category} · {job.job_applications?.length || 0} applicant{job.job_applications?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-bold ${c.text}`}>₦{job.budget_min?.toLocaleString()} – ₦{job.budget_max?.toLocaleString()}</p>
                    <span className={`text-xs font-bold ${job.status === 'open' ? 'text-green-500' : c.muted}`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-center">
              <p className={`text-sm font-bold ${c.text}`}>No jobs posted yet</p>
              <p className={`text-xs ${c.muted} mt-1 mb-4`}>Post a job to start receiving proposals from freelancers.</p>
              <Link to="/contracts/new"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${c.btn}`}>
                <Plus size={13}/> Post a Job
              </Link>
            </div>
          )}
        </div>

        {/* Active contracts */}
        <div className={`${c.card} border ${c.border} rounded-2xl overflow-hidden`}>
          <div className={`flex items-center justify-between px-6 py-4 border-b ${c.border}`}>
            <p className={`text-sm font-bold ${c.text}`}>Active Contracts</p>
            <Link to="/contracts" className="text-xs font-bold text-green-500 hover:underline">View all</Link>
          </div>
          {loadingData ? (
            <div className="divide-y" style={{ borderColor: isDark ? '#2e2e2e' : '#e0e0e0' }}>
              {[1,2].map(i => (
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
              {contracts.map(ct => {
                const party = ct.freelancer
                const name  = party?.full_name || 'Freelancer'
                const initials = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
                return (
                  <div key={ct.id} className={`flex items-center gap-4 px-6 py-4 ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-[#f8f8f8]'} transition-colors`}>
                    <div className={`w-10 h-10 rounded-xl ${c.bgMid} border ${c.border} flex items-center justify-center font-bold text-xs ${c.text}`}>{initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${c.text}`}>{name}</p>
                      <p className={`text-xs ${c.muted} truncate`}>{ct.title}</p>
                      <div className={`mt-2 h-1 rounded-full ${c.bgMid}`}><div className="h-1 rounded-full bg-green-500" style={{ width: '40%' }}/></div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-extrabold ${c.text}`}>₦{ct.total_value?.toLocaleString()}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS[ct.status] || STATUS.draft}`}>{ct.status?.replace('_', ' ')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="text-3xl mb-3">📋</div>
              <p className={`text-sm font-bold ${c.text}`}>No active contracts yet</p>
              <p className={`text-xs ${c.muted} mt-1 mb-4`}>Create your first contract to get started.</p>
              <Link to="/contracts/new" className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${c.btn}`}>
                <Plus size={13}/> Post a Job
              </Link>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className={`${c.card} border ${c.border} rounded-2xl overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${c.border}`}>
            <p className={`text-sm font-bold ${c.text}`}>Recent Activity</p>
          </div>
          <div className="divide-y" style={{ borderColor: isDark ? '#2e2e2e' : '#e0e0e0' }}>
            {activity.length > 0 ? activity.map(a => (
              <div key={a.id} className="flex items-start gap-3 px-6 py-3">
                <span className="text-lg flex-shrink-0">{txIcon(a.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${c.text}`}>{a.description || a.type}</p>
                  <p className={`text-xs ${c.muted} mt-0.5`}>{new Date(a.created_at).toLocaleString()}</p>
                </div>
                <p className={`text-sm font-bold flex-shrink-0 ${a.type === 'deposit' || a.type === 'escrow_release' ? 'text-green-500' : c.text}`}>
                  {a.type === 'deposit' || a.type === 'escrow_release' ? '+' : '-'}₦{a.amount?.toLocaleString()}
                </p>
              </div>
            )) : [
              { e: '🎉', t: `Welcome to Collectica, ${displayName.split(' ')[0]}!` },
              { e: '💡', t: 'Add funds to your wallet then create your first contract' },
              { e: '🤖', t: 'Colle AI is ready to draft contracts from your chats' },
              { e: '🛡️', t: 'Your trust score starts at 100 — keep it high' },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-6 py-3">
                <span className="text-lg">{a.e}</span>
                <p className={`text-xs font-medium ${c.text} mt-0.5`}>{a.t}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )

  return (
    <div className={`h-screen flex overflow-hidden transition-colors duration-300 ${c.bg}`}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 flex-shrink-0 flex-col h-full"><Sidebar/></div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}/>
          <div className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col"><Sidebar/></div>
        </>
      )}

      {isFreelancer ? <FreelancerView/> : <ClientView/>}
    </div>
  )
}
