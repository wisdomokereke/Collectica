import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, Shield, Wallet, Settings, LogOut, Sun, Moon, MessageSquare, TrendingUp, Clock, CheckCircle, AlertTriangle, Plus, ChevronRight, Bell, Menu, X } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth, ROLES } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const NAV = [
  { icon: <LayoutDashboard size={17}/>, label: 'Overview',     path: '/dashboard' },
  { icon: <FileText size={17}/>,        label: 'Contracts',    path: '/contracts' },
  { icon: <Wallet size={17}/>,          label: 'Escrow',       path: '/escrow' },
  { icon: <MessageSquare size={17}/>,   label: 'Messages',     path: '/messages',  badge: true },
  { icon: <Shield size={17}/>,          label: 'Trust Engine', path: '/trust' },
  { icon: <Settings size={17}/>,        label: 'Milestones',   path: '/milestones' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function useTypewriter(texts, typingSpeed = 50, deletingSpeed = 30, pauseMs = 2200) {
  const [display, setDisplay] = useState('')
  const [idx, setIdx]         = useState(0)
  const [typing, setTyping]   = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    const target = texts[idx]
    if (typing) {
      if (display.length < target.length) {
        timerRef.current = setTimeout(() => setDisplay(target.slice(0, display.length + 1)), typingSpeed)
      } else {
        timerRef.current = setTimeout(() => setTyping(false), pauseMs)
      }
    } else {
      if (display.length > 0) {
        timerRef.current = setTimeout(() => setDisplay(d => d.slice(0, -1)), deletingSpeed)
      } else {
        setIdx(i => (i + 1) % texts.length)
        setTyping(true)
      }
    }
    return () => clearTimeout(timerRef.current)
  }, [display, typing, idx])

  return display
}

export default function Dashboard() {
  const { theme, toggle } = useTheme()
  const { user, profile, activeView, switchView, signOut, displayName, isFreelancer } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activity, setActivity]       = useState([])
  const [unread, setUnread]           = useState(0)

  const FEATURE_TEXTS = isFreelancer ? [
    `Here's your freelance overview`,
    'Draft contracts from just your chats',
    'Trust Engine — see who trusts you',
    'Smart escrow protects every payment',
    'Milestone protection keeps clients honest',
    'AI monitors transactions for fraud',
    'File deliverables directly in chat',
  ] : [
    `Here's your client overview`,
    'Hire with confidence — escrow protects you too',
    'AI generates contracts from your conversations',
    'Trust Engine — know every freelancer before you hire',
    'Set review rounds per milestone — no surprises',
    'Release payments with one tap when satisfied',
    'Real-time visibility into every contract',
  ]

  const animText = useTypewriter(FEATURE_TEXTS)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchActivity()
    const channel = supabase.channel('activity-' + user.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchActivity)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  const fetchActivity = async () => {
    if (!user) return
    const { data } = await supabase
      .from('activity_feed')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6)
    if (data) setActivity(data)

    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('read', false)
      .neq('sender_id', user.id)
    setUnread(count || 0)
  }

  if (!user) return null

  const c = {
    bg:      isDark ? 'bg-[#0a0a0a]'     : 'bg-[#f8f8f8]',
    sidebar: isDark ? 'bg-[#111]'        : 'bg-white',
    border:  isDark ? 'border-[#2e2e2e]' : 'border-[#e0e0e0]',
    text:    isDark ? 'text-white'       : 'text-[#0a0a0a]',
    muted:   isDark ? 'text-[#555]'      : 'text-[#aaa]',
    light:   isDark ? 'text-[#888]'      : 'text-[#666]',
    card:    isDark ? 'bg-[#111]'        : 'bg-white',
    bgMid:   isDark ? 'bg-[#1a1a1a]'     : 'bg-[#f0f0f0]',
    navItem: isDark ? 'text-[#555] hover:bg-[#1a1a1a] hover:text-white' : 'text-[#aaa] hover:bg-[#f0f0f0] hover:text-[#0a0a0a]',
    navAct:  isDark ? 'bg-[#1a1a1a] text-white' : 'bg-[#f0f0f0] text-[#0a0a0a]',
    btn:     isDark ? 'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]' : 'bg-[#0a0a0a] text-white hover:bg-[#222]',
    divider: isDark ? 'bg-[#2e2e2e]'     : 'bg-[#e0e0e0]',
  }

  const DEMO_STATS = isFreelancer ? [
    { label: 'In Escrow',           value: '₦840,000',  change: '3 active contracts', up: true,  icon: <Wallet size={16}/> },
    { label: 'Released This Month', value: '₦320,000',  change: '2 completed',        up: true,  icon: <TrendingUp size={16}/> },
    { label: 'Pending Review',      value: '₦180,000',  change: 'Awaiting client',    up: null,  icon: <Clock size={16}/> },
    { label: 'Trust Score',         value: `${profile?.trust_score || 70}/100`, change: 'Building reputation', up: true, icon: <Shield size={16}/> },
  ] : [
    { label: 'Wallet Balance',      value: '₦1,200,000', change: 'Available to deploy', up: true, icon: <Wallet size={16}/> },
    { label: 'In Escrow',           value: '₦660,000',   change: '3 active contracts',  up: true, icon: <TrendingUp size={16}/> },
    { label: 'Pending Approvals',   value: '2',           change: 'Awaiting your review',up: null, icon: <Clock size={16}/> },
    { label: 'Freelancers Hired',   value: '5',           change: 'Total contracts',     up: true, icon: <CheckCircle size={16}/> },
  ]

  const DEMO_CONTRACTS = isFreelancer ? [
    { initials:'TF', name:'TechFlow Nigeria',  type:'Brand Identity',    amount:'₦450,000', status:'active',    progress:40 },
    { initials:'BL', name:'BuildLagos',        type:'Pitch Deck',        amount:'₦210,000', status:'review',    progress:55 },
    { initials:'KA', name:'Kemi Adeyemi',      type:'Social Media Kit',  amount:'₦180,000', status:'completed', progress:100 },
  ] : [
    { initials:'AO', name:'Ade Okonkwo',       type:'Brand Identity',    amount:'₦450,000', status:'active',    progress:40 },
    { initials:'JM', name:'Jide Mensah',       type:'Website Redesign',  amount:'₦620,000', status:'active',    progress:60 },
    { initials:'SC', name:'Sade Coker',        type:'Video Ad',          amount:'₦95,000',  status:'completed', progress:100 },
  ]

  const STATUS_COLORS = { active:'text-green-500 bg-green-500/10', review:'text-orange-500 bg-orange-500/10', completed:'text-[#888] bg-white/5', pending:'text-blue-400 bg-blue-400/10' }

  const Sidebar = () => (
    <aside className={`flex flex-col h-full ${c.sidebar} border-r ${c.border}`}>
      {/* Logo + theme */}
      <div className={`flex items-center justify-between px-5 py-5 border-b ${c.border}`}>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center"><span className="text-white font-black text-xs">C</span></div>
          <span className={`text-sm font-extrabold tracking-tight ${c.text}`}>Collectica</span>
        </Link>
        <button onClick={toggle} className={`w-7 h-7 rounded-full ${c.bgMid} flex items-center justify-center text-sm`}>{isDark?'☀️':'🌙'}</button>
      </div>

      {/* Role toggle */}
      <div className={`px-4 py-3 border-b ${c.border}`}>
        <div className={`flex rounded-xl p-1 ${c.bgMid}`}>
          {[ROLES.FREELANCER, ROLES.CLIENT].map(r => (
            <button key={r} onClick={()=>switchView(r)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${activeView===r?(isDark?'bg-white text-[#0a0a0a]':'bg-[#0a0a0a] text-white'):`${c.muted}`}`}>{r}</button>
          ))}
        </div>
      </div>

      {/* User card */}
      <div className={`px-4 py-4 border-b ${c.border}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${c.bgMid} border ${c.border} flex items-center justify-center font-extrabold text-sm ${c.text}`}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate ${c.text}`}>{displayName}</p>
            <p className={`text-xs ${c.muted} capitalize`}>{profile?.skill || profile?.role || activeView}</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between mb-1">
            <span className={`text-xs ${c.muted}`}>Trust Score</span>
            <span className="text-xs font-bold text-green-500">{profile?.trust_score || 70}</span>
          </div>
          <div className={`h-1.5 rounded-full ${c.bgMid}`}><div className="h-1.5 rounded-full bg-green-500 transition-all" style={{width:`${profile?.trust_score || 70}%`}}/></div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
        {NAV.map(item => (
          <Link key={item.label} to={item.path} onClick={()=>setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${item.path==='/dashboard'?c.navAct:c.navItem}`}>
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge && unread > 0 && <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isDark?'bg-white text-[#0a0a0a]':'bg-[#0a0a0a] text-white'}`}>{unread}</span>}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className={`p-4 border-t ${c.border}`}>
        <button onClick={async()=>{await signOut();navigate('/login')}} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${c.navItem}`}>
          <LogOut size={17}/> Log out
        </button>
      </div>
    </aside>
  )

  return (
    <div className={`h-screen flex overflow-hidden transition-colors duration-300 ${c.bg}`}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 flex-shrink-0 flex-col h-full"><Sidebar/></div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={()=>setSidebarOpen(false)}/>
          <div className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col"><Sidebar/></div>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className={`flex items-center justify-between px-6 py-4 border-b ${c.border} ${c.card}`}>
          <div className="flex items-center gap-3">
            <button onClick={()=>setSidebarOpen(true)} className={`lg:hidden p-2 rounded-lg ${c.bgMid}`}><Menu size={18} className={c.text}/></button>
            <div>
              <h1 className={`text-lg font-extrabold tracking-tight ${c.text}`}>{getGreeting()}, {displayName.split(' ')[0]} 👋</h1>
              <p className={`text-xs ${c.light} h-4`}>
                <span>{animText}</span>
                <span className="animate-pulse ml-0.5 text-green-500">|</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/messages" className={`relative p-2 rounded-xl ${c.bgMid} ${c.text}`}>
              <Bell size={17}/>
              {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 text-white text-[9px] font-bold flex items-center justify-center">{unread}</span>}
            </Link>
            <Link to="/contracts/new" className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${c.btn}`}>
              <Plus size={14}/> New Contract
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {DEMO_STATS.map(stat => (
              <div key={stat.label} className={`${c.card} border ${c.border} rounded-2xl p-5`}>
                <div className={`flex items-center gap-2 mb-3 ${c.muted}`}>{stat.icon}<span className="text-xs font-bold uppercase tracking-widest">{stat.label}</span></div>
                <p className={`text-2xl font-extrabold tracking-tight ${c.text}`}>{stat.value}</p>
                <p className={`text-xs mt-1 ${stat.up===true?'text-green-500':stat.up===false?'text-red-500':c.muted}`}>{stat.change}</p>
              </div>
            ))}
          </div>

          {/* Contracts */}
          <div className={`${c.card} border ${c.border} rounded-2xl overflow-hidden`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${c.border}`}>
              <p className={`text-sm font-bold ${c.text}`}>Active Contracts</p>
              <Link to="/contracts" className={`text-xs font-bold text-green-500 hover:underline`}>View all</Link>
            </div>
            <div className="divide-y" style={{borderColor:isDark?'#2e2e2e':'#e0e0e0'}}>
              {DEMO_CONTRACTS.map((ct,i) => (
                <div key={i} className={`flex items-center gap-4 px-6 py-4 ${isDark?'hover:bg-[#1a1a1a]':'hover:bg-[#f8f8f8]'} transition-colors`}>
                  <div className={`w-10 h-10 rounded-xl ${c.bgMid} border ${c.border} flex items-center justify-center font-bold text-xs ${c.text}`}>{ct.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${c.text}`}>{ct.name}</p>
                    <p className={`text-xs ${c.muted}`}>{ct.type}</p>
                    <div className={`mt-2 h-1 rounded-full ${c.bgMid}`}><div className="h-1 rounded-full bg-green-500" style={{width:`${ct.progress}%`}}/></div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-extrabold ${c.text}`}>{ct.amount}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[ct.status] || STATUS_COLORS.pending}`}>{ct.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className={`${c.card} border ${c.border} rounded-2xl overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${c.border}`}>
              <p className={`text-sm font-bold ${c.text}`}>Recent Activity</p>
            </div>
            <div className="divide-y" style={{borderColor:isDark?'#2e2e2e':'#e0e0e0'}}>
              {activity.length > 0 ? activity.map((a,i) => (
                <div key={i} className="flex items-start gap-3 px-6 py-3">
                  <span className="text-lg">{a.emoji || '📋'}</span>
                  <div><p className={`text-xs ${c.text}`}>{a.text}</p><p className={`text-xs ${c.muted} mt-0.5`}>{new Date(a.created_at).toLocaleString()}</p></div>
                </div>
              )) : [
                {e:'💸',t:'Wallet ready — add funds to start a contract',time:'Just now'},
                {e:'🛡️',t:'Trust Engine is tracking your profile score',time:'Just now'},
                {e:'📬',t:'Messages are end-to-end monitored by AI',time:'Just now'},
              ].map((a,i) => (
                <div key={i} className="flex items-start gap-3 px-6 py-3">
                  <span className="text-lg">{a.e}</span>
                  <div><p className={`text-xs ${c.text}`}>{a.t}</p><p className={`text-xs ${c.muted} mt-0.5`}>{a.time}</p></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
