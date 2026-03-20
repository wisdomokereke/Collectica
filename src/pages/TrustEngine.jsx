import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, Shield, AlertTriangle, CheckCircle, XCircle, Loader2, FileText, Star, ChevronRight, Users } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const SEED_USERS = [
  { id:'s1', name:'Ade Okonkwo',    role:'freelancer', skill:'Graphic Designer',   location:'Lagos',       trust_score:91, contracts_completed:12, contracts_total:12, joined:'14 months ago', verified:true,  level:'trusted',   bio:'Award-winning brand designer with 5+ years.' },
  { id:'s2', name:'Emeka Olu',      role:'freelancer', skill:'Web Developer',      location:'Abuja',       trust_score:85, contracts_completed:8,  contracts_total:9,  joined:'8 months ago',  verified:true,  level:'trusted',   bio:'Full-stack developer. React, Node, Supabase.' },
  { id:'s3', name:'Sade Coker',     role:'freelancer', skill:'Video Editor',       location:'Port Harcourt',trust_score:54,contracts_completed:5,  contracts_total:8,  joined:'6 months ago',  verified:true,  level:'caution',   bio:'Motion and video specialist.' },
  { id:'s4', name:'Tunde Musa',     role:'freelancer', skill:'Copywriter',         location:'Ibadan',      trust_score:34, contracts_completed:2,  contracts_total:7,  joined:'3 months ago',  verified:false, level:'high_risk', bio:'Content writer for tech brands.' },
  { id:'s5', name:'Funke Balogun',  role:'client',     skill:null,                 location:'Abuja',       trust_score:94, contracts_completed:12, contracts_total:12, joined:'14 months ago', verified:true,  level:'trusted',   bio:'Product Manager at a fintech company.' },
  { id:'s6', name:'TechFlow Nigeria',role:'client',    skill:null,                 location:'Lagos',       trust_score:88, contracts_completed:6,  contracts_total:7,  joined:'10 months ago', verified:true,  level:'trusted',   bio:'B2B SaaS startup — hiring regularly.' },
  { id:'s7', name:'David Okafor',   role:'client',     skill:null,                 location:'Lagos',       trust_score:18, contracts_completed:0,  contracts_total:4,  joined:'2 weeks ago',   verified:false, level:'high_risk', bio:'Startup founder.' },
  { id:'s8', name:'BuildLagos',     role:'client',     skill:null,                 location:'Lagos',       trust_score:62, contracts_completed:3,  contracts_total:5,  joined:'5 months ago',  verified:true,  level:'caution',   bio:'PropTech startup building for Lagos market.' },
]

const LVL = {
  trusted:  { label:'Verified Trusted',        color:'text-green-500',  bg:'bg-green-500/10',  border:'border-green-500/30',  emoji:'✅' },
  caution:  { label:'Proceed with Caution',    color:'text-orange-500', bg:'bg-orange-500/10', border:'border-orange-500/30', emoji:'⚠️' },
  high_risk:{ label:'High Risk',               color:'text-red-500',    bg:'bg-red-500/10',    border:'border-red-500/30',    emoji:'🚩' },
}

function ScoreRing({ score, level, size=80 }) {
  const r = 34, circ = 2*Math.PI*r, offset = circ - (score/100)*circ
  const color = level==='trusted'?'#22c55e':level==='caution'?'#f97316':'#ef4444'
  return (
    <div className="relative flex items-center justify-center" style={{width:size,height:size}}>
      <svg width={size} height={size} viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#2e2e2e" strokeWidth="6"/>
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{transition:'stroke-dashoffset 1s ease'}}/>
      </svg>
      <div className="absolute text-center"><p className={`text-base font-extrabold ${LVL[level].color}`}>{score}</p></div>
    </div>
  )
}

export default function TrustEngine() {
  const { theme, toggle } = useTheme()
  const { user, isFreelancer, isClient } = useAuth()
  const isDark = theme === 'dark'
  const [users, setUsers]       = useState([])
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')

  useEffect(() => {
    fetchUsers()
  }, [isFreelancer, isClient])

  const fetchUsers = async () => {
    setLoading(true)
    const targetRole = isFreelancer ? 'client' : 'freelancer'
    const { data } = await supabase.from('users').select('*').eq('role', targetRole).neq('id', user?.id).limit(20)
    if (data && data.length > 0) {
      setUsers(data.map(u => ({
        ...u,
        level: u.trust_score >= 75 ? 'trusted' : u.trust_score >= 45 ? 'caution' : 'high_risk',
        contracts_completed: 0,
        contracts_total: 0,
        joined: 'Recently',
        verified: false,
      })))
    } else {
      setUsers(SEED_USERS.filter(u => u.role !== (isFreelancer ? 'freelancer' : 'client')))
    }
    setLoading(false)
  }

  const c = {
    bg:     isDark?'bg-[#0a0a0a]':'bg-[#f8f8f8]',
    card:   isDark?'bg-[#111]':'bg-white',
    bgMid:  isDark?'bg-[#1a1a1a]':'bg-[#f0f0f0]',
    border: isDark?'border-[#2e2e2e]':'border-[#e0e0e0]',
    text:   isDark?'text-white':'text-[#0a0a0a]',
    muted:  isDark?'text-[#555]':'text-[#aaa]',
    light:  isDark?'text-[#888]':'text-[#666]',
    divider:isDark?'bg-[#2e2e2e]':'bg-[#e0e0e0]',
    btn:    isDark?'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]':'bg-[#0a0a0a] text-white hover:bg-[#222]',
  }

  const filtered = users.filter(u => {
    const matchSearch = !query || u.name?.toLowerCase().includes(query.toLowerCase()) || u.skill?.toLowerCase().includes(query.toLowerCase())
    const matchFilter = filter === 'all' || u.level === filter
    return matchSearch && matchFilter
  })

  const roleLabel = isFreelancer ? 'Clients' : 'Freelancers'

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${c.bg}`}>
      <header className={`sticky top-0 z-20 flex items-center justify-between px-6 md:px-10 py-4 border-b ${c.border} ${c.card}`}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={`flex items-center gap-2 text-sm font-semibold ${c.light}`}><ArrowLeft size={15}/> Dashboard</Link>
          <div className={`w-px h-4 ${c.divider}`}/>
          <div className="flex items-center gap-2"><Shield size={15} className={c.muted}/><span className={`text-sm font-bold ${c.text}`}>Trust Engine</span></div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${c.border} text-xs font-bold ${c.muted}`}><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/> AI Active</div>
          <button onClick={toggle} className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm ${isDark?'border-[#2e2e2e] bg-[#1a1a1a]':'border-[#e0e0e0] bg-[#f0f0f0]'}`}>{isDark?'☀️':'🌙'}</button>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-10 py-10 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Platform Overview</p>
          <h1 className={`text-4xl font-extrabold tracking-tight ${c.text}`}>Trust Engine</h1>
          <p className={`text-sm ${c.light} mt-2`}>Showing all <strong>{roleLabel}</strong> on Collectica. Every profile is scored from real contract history.</p>
        </div>

        {/* Search + filter */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 ${c.muted}`}/>
            <input type="text" placeholder={`Search ${roleLabel.toLowerCase()}...`} value={query} onChange={e=>setQuery(e.target.value)} className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${isDark?'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e] focus:border-white':'bg-white text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0] focus:border-[#0a0a0a]'}`}/>
          </div>
          <div className="flex gap-2">
            {['all','trusted','caution','high_risk'].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all capitalize ${filter===f?(isDark?'bg-white text-[#0a0a0a] border-white':'bg-[#0a0a0a] text-white border-[#0a0a0a]'):`${c.border} ${c.muted}`}`}>{f.replace('_',' ')}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-green-500"/></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(u => {
              const lvl = LVL[u.level || 'caution']
              return (
                <button key={u.id} onClick={()=>setSelected(u)} className={`${c.card} border ${c.border} rounded-2xl p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl ${c.bgMid} border ${c.border} flex items-center justify-center font-extrabold text-base ${c.text}`}>{u.name?.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-bold truncate ${c.text}`}>{u.name}</p>
                        {u.verified && <CheckCircle size={11} className="text-green-500 flex-shrink-0"/>}
                      </div>
                      <p className={`text-xs ${c.muted}`}>{u.skill || 'Client'} · {u.location}</p>
                    </div>
                    <ScoreRing score={u.trust_score} level={u.level||'caution'} size={50}/>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${lvl.border} ${lvl.bg}`}>
                    <span className="text-sm">{lvl.emoji}</span>
                    <span className={`text-xs font-bold ${lvl.color}`}>{lvl.label}</span>
                    <ChevronRight size={12} className={`ml-auto ${lvl.color}`}/>
                  </div>
                  <p className={`text-xs mt-3 ${c.muted} line-clamp-2`}>{u.bio || 'No bio yet.'}</p>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className={`col-span-full ${c.card} border ${c.border} rounded-2xl p-16 text-center`}>
                <Users size={32} className={`mx-auto mb-3 ${c.muted}`}/>
                <p className={`font-bold ${c.text}`}>No {roleLabel.toLowerCase()} found</p>
                <p className={`text-sm ${c.light} mt-1`}>Try a different search or filter</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Detail modal */}
      {selected && (() => {
        const lvl = LVL[selected.level || 'caution']
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={()=>setSelected(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
            <div className={`relative w-full max-w-md ${c.card} border ${c.border} rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto`} onClick={e=>e.stopPropagation()}>
              <div className={`flex items-center justify-between px-6 py-4 border-b ${c.border}`}>
                <p className={`font-bold ${c.text}`}>Trust Profile</p>
                <button onClick={()=>setSelected(null)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bgMid} ${c.light}`}><XCircle size={15}/></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl ${c.bgMid} border ${c.border} flex items-center justify-center font-extrabold text-2xl ${c.text}`}>{selected.name?.charAt(0)}</div>
                  <div>
                    <div className="flex items-center gap-2"><p className={`text-lg font-extrabold ${c.text}`}>{selected.name}</p>{selected.verified&&<CheckCircle size={14} className="text-green-500"/>}</div>
                    <p className={`text-sm ${c.light}`}>{selected.skill||'Client'} · {selected.location}</p>
                    <p className={`text-xs ${c.muted}`}>Member {selected.joined}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${lvl.border} ${lvl.bg}`}>
                  <ScoreRing score={selected.trust_score} level={selected.level||'caution'} size={60}/>
                  <div><p className={`text-xs ${c.muted} mb-0.5`}>Trust Score</p><p className={`text-sm font-bold ${lvl.color}`}>{lvl.emoji} {lvl.label}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[['Completed',selected.contracts_completed,'text-green-500'],['Total',selected.contracts_total,c.text]].map(([l,v,col])=>(
                    <div key={l} className={`${c.bgMid} border ${c.border} rounded-xl p-3`}><p className={`text-xs ${c.muted} mb-1`}>{l} Contracts</p><p className={`text-2xl font-extrabold ${col}`}>{v}</p></div>
                  ))}
                </div>
                {selected.bio && <div className={`${c.bgMid} border ${c.border} rounded-xl p-4`}><p className={`text-xs ${c.muted} mb-1`}>Bio</p><p className={`text-sm ${c.light} leading-relaxed`}>{selected.bio}</p></div>}
                <div className="flex gap-2">
                  {selected.level === 'trusted' ? (
                    <Link to="/contracts/new" className={`flex-1 py-3 rounded-xl font-bold text-sm text-center transition-all ${c.btn}`}>Create Contract</Link>
                  ) : (
                    <div className={`flex-1 py-3 rounded-xl font-bold text-sm text-center cursor-not-allowed ${selected.level==='high_risk'?'bg-red-500/10 text-red-500 border border-red-500/30':'bg-orange-500/10 text-orange-500 border border-orange-500/30'}`}>{selected.level==='high_risk'?'🚫 High Risk — Proceed Carefully':'⚠️ Use Milestone Protection'}</div>
                  )}
                  <button onClick={()=>setSelected(null)} className={`px-4 py-3 rounded-xl border font-semibold text-sm ${c.border} ${c.light}`}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
