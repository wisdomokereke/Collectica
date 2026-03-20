import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, FileText, Clock, CheckCircle, AlertTriangle, ChevronRight, Shield } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth } from '../lib/AuthContext'

const CONTRACTS = [
  {id:'c1',initials:'TF',party:'TechFlow Nigeria',type:'Brand Identity',amount:'₦450,000',status:'active',progress:40,milestones:3,date:'Mar 4, 2026'},
  {id:'c2',initials:'BL',party:'BuildLagos',type:'Pitch Deck Design',amount:'₦210,000',status:'review',progress:55,milestones:2,date:'Mar 5, 2026'},
  {id:'c3',initials:'KA',party:'Kemi Adeyemi',type:'Social Media Kit',amount:'₦180,000',status:'completed',progress:100,milestones:1,date:'Mar 6, 2026'},
  {id:'c4',initials:'NC',party:'NaijaCart',type:'Logo Design',amount:'₦140,000',status:'pending',progress:0,milestones:2,date:'Mar 9, 2026'},
]
const STATUS = {
  active:   {label:'Active',         color:'text-green-500',  bg:'bg-green-500/10'},
  review:   {label:'In Review',      color:'text-orange-500', bg:'bg-orange-500/10'},
  completed:{label:'Completed',      color:'text-[#888]',     bg:'bg-white/5'},
  pending:  {label:'Awaiting Escrow',color:'text-blue-400',   bg:'bg-blue-400/10'},
}

export default function Contracts() {
  const { theme, toggle } = useTheme()
  const { isFreelancer } = useAuth()
  const isDark = theme === 'dark'
  const [tab, setTab] = useState('all')

  const c = {
    bg:     isDark?'bg-[#0a0a0a]':'bg-[#f8f8f8]',
    card:   isDark?'bg-[#111]':'bg-white',
    bgMid:  isDark?'bg-[#1a1a1a]':'bg-[#f0f0f0]',
    border: isDark?'border-[#2e2e2e]':'border-[#e0e0e0]',
    text:   isDark?'text-white':'text-[#0a0a0a]',
    muted:  isDark?'text-[#555]':'text-[#aaa]',
    light:  isDark?'text-[#888]':'text-[#666]',
    btn:    isDark?'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]':'bg-[#0a0a0a] text-white hover:bg-[#222]',
    divider:isDark?'bg-[#2e2e2e]':'bg-[#e0e0e0]',
    tab:    isDark?'text-[#555] hover:text-white':'text-[#aaa] hover:text-[#0a0a0a]',
    tabAct: isDark?'text-white border-b-2 border-white':'text-[#0a0a0a] border-b-2 border-[#0a0a0a]',
  }

  const filtered = tab==='all'?CONTRACTS:CONTRACTS.filter(c=>c.status===tab)

  return (
    <div className={`min-h-screen flex flex-col ${c.bg}`}>
      <header className={`sticky top-0 z-20 flex items-center justify-between px-6 md:px-10 py-4 border-b ${c.border} ${c.card}`}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={`flex items-center gap-2 text-sm font-semibold ${c.light}`}><ArrowLeft size={15}/> Dashboard</Link>
          <div className={`w-px h-4 ${c.divider}`}/>
          <div className="flex items-center gap-2"><FileText size={15} className={c.muted}/><span className={`text-sm font-bold ${c.text}`}>Contracts</span></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm ${isDark?'border-[#2e2e2e] bg-[#1a1a1a]':'border-[#e0e0e0] bg-[#f0f0f0]'}`}>{isDark?'☀️':'🌙'}</button>
          <Link to="/contracts/new" className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${c.btn}`}><Plus size={14}/> New</Link>
        </div>
      </header>
      <main className="flex-1 px-4 md:px-10 py-10 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className={`text-4xl font-extrabold tracking-tight ${c.text}`}>Contracts</h1>
          <p className={`text-sm ${c.light} mt-1`}>All your active and past contracts on Collectica.</p>
        </div>
        <div className={`flex gap-6 border-b ${c.border} mb-6`}>
          {['all','active','review','completed','pending'].map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`pb-3 text-sm font-bold capitalize transition-all ${tab===t?c.tabAct:c.tab}`}>{t==='all'?'All':STATUS[t]?.label||t}</button>
          ))}
        </div>
        <div className="space-y-3">
          {filtered.map(ct=>{
            const s = STATUS[ct.status]
            return (
              <Link key={ct.id} to={`/messages`} className={`${c.card} border ${c.border} rounded-2xl p-5 flex items-center gap-4 transition-all ${isDark?'hover:bg-[#1a1a1a]':'hover:bg-[#f8f8f8]'} hover:scale-[1.005]`}>
                <div className={`w-12 h-12 rounded-xl ${c.bgMid} border ${c.border} flex items-center justify-center font-extrabold text-sm ${c.text}`}>{ct.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div><p className={`text-sm font-bold ${c.text}`}>{ct.party}</p><p className={`text-xs ${c.muted}`}>{ct.type} · {ct.milestones} milestones · {ct.date}</p></div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                  </div>
                  <div className={`mt-3 h-1.5 rounded-full ${c.bgMid}`}><div className="h-1.5 rounded-full bg-green-500" style={{width:`${ct.progress}%`}}/></div>
                  <p className={`text-xs mt-1 ${c.muted}`}>{ct.progress}% complete</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-base font-extrabold ${c.text}`}>{ct.amount}</p>
                  <ChevronRight size={15} className={`${c.muted} mt-1 ml-auto`}/>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
