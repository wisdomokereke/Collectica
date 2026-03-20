import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Wallet, Lock, TrendingUp, Clock, ArrowDownLeft, ArrowUpRight, CheckCircle, ChevronRight, X, Check, Loader2, Shield, AlertTriangle, Plus } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const DEMO_CONTRACTS = [
  { id:'e1', contract:'Brand Identity — TechFlow Nigeria', initials:'TF', total:450000, released:90000, locked:360000, funded:true, status:'active',
    milestones:[{id:1,title:'Discovery & Moodboard',pct:20,amount:90000,status:'released'},{id:2,title:'Logo Concepts',pct:30,amount:135000,status:'locked'},{id:3,title:'Final Brand Guidelines',pct:50,amount:225000,status:'locked'}]},
  { id:'e2', contract:'Pitch Deck — BuildLagos', initials:'BL', total:210000, released:0, locked:210000, funded:true, status:'active',
    milestones:[{id:1,title:'Draft Slides',pct:50,amount:105000,status:'pending'},{id:2,title:'Final Deck',pct:50,amount:105000,status:'locked'}]},
  { id:'e3', contract:'Logo Design — NaijaCart', initials:'NC', total:140000, released:0, locked:0, funded:false, status:'unfunded',
    milestones:[{id:1,title:'Concepts',pct:40,amount:56000,status:'unfunded'},{id:2,title:'Final Files',pct:60,amount:84000,status:'unfunded'}]},
]

const TXNS = [
  {id:'t1',type:'released',desc:'Milestone 1 released — Brand Identity',amount:90000,date:'Today, 9:14 AM'},
  {id:'t2',type:'funded',  desc:'Escrow funded — Pitch Deck (BuildLagos)',amount:210000,date:'Yesterday, 3:30 PM'},
  {id:'t3',type:'deposit', desc:'Wallet top-up',amount:500000,date:'Mar 8, 11:00 AM'},
  {id:'t4',type:'funded',  desc:'Escrow funded — Brand Identity',amount:450000,date:'Mar 4, 10:00 AM'},
]

const MS = { released:{label:'Released',color:'text-green-500',bg:'bg-green-500/10',dot:'bg-green-500'}, locked:{label:'Locked',color:'text-orange-500',bg:'bg-orange-500/10',dot:'bg-orange-500'}, pending:{label:'Pending Review',color:'text-blue-400',bg:'bg-blue-400/10',dot:'bg-blue-400'}, unfunded:{label:'Unfunded',color:'text-[#888]',bg:'bg-white/5',dot:'bg-[#555]'} }

function fmt(n) { return '₦'+Number(n).toLocaleString() }

function TopUpModal({ isDark, c, onClose, onDone }) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('bank')
  const [step, setStep]     = useState(0)

  const handle = async () => {
    setStep(1); await new Promise(r=>setTimeout(r,2000)); setStep(2)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
      <div className={`relative w-full max-w-md ${c.card} border ${c.border} rounded-2xl overflow-hidden`} onClick={e=>e.stopPropagation()}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${c.border}`}>
          <p className={`font-bold ${c.text}`}>Add Money to Wallet</p>
          <button onClick={onClose} className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bgMid} ${c.light}`}><X size={15}/></button>
        </div>
        <div className="p-6">
          {step===0 && <div className="space-y-5">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Amount (₦)</label>
              <input type="number" placeholder="e.g. 500000" value={amount} onChange={e=>setAmount(e.target.value)} className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all ${isDark?'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e] focus:border-white':'bg-white text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0] focus:border-[#0a0a0a]'}`}/>
              <div className="flex gap-2 mt-2">{[100000,250000,500000,1000000].map(a=><button key={a} onClick={()=>setAmount(String(a))} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${c.border} ${c.muted} ${isDark?'hover:bg-[#1a1a1a]':'hover:bg-[#f8f8f8]'}`}>{fmt(a)}</button>)}</div>
            </div>
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-3`}>Payment Method</label>
              <div className="space-y-2">
                {[{k:'bank',e:'🏦',t:'Bank Transfer',s:'GTBank ····4521'},{k:'paystack',e:'💳',t:'Paystack',s:'Card / USSD'},{k:'ussd',e:'📱',t:'USSD',s:'*737# or *919#'}].map(m=>(
                  <button key={m.k} onClick={()=>setMethod(m.k)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${method===m.k?(isDark?'border-white bg-white/5':'border-[#0a0a0a] bg-[#0a0a0a]/5'):`${c.border} ${isDark?'hover:bg-[#1a1a1a]':'hover:bg-[#f8f8f8]'}`}`}>
                    <span className="text-xl">{m.e}</span>
                    <div className="flex-1"><p className={`text-sm font-bold ${c.text}`}>{m.t}</p><p className={`text-xs ${c.muted}`}>{m.s}</p></div>
                    {method===m.k && <Check size={14} className={isDark?'text-white':'text-[#0a0a0a]'}/>}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl border border-green-500/20 bg-green-500/5"><Shield size={13} className="text-green-500 mt-0.5 flex-shrink-0"/><p className="text-xs text-green-600 leading-relaxed">Funds are held in your Collectica wallet. You allocate them to contracts — they only leave when you release payment.</p></div>
            <button onClick={handle} disabled={!amount||Number(amount)<=0} className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${isDark?'bg-white text-[#0a0a0a]':'bg-[#0a0a0a] text-white'}`}><Plus size={14}/> Add {amount?fmt(Number(amount)):'Funds'}</button>
          </div>}
          {step===1 && <div className="py-12 flex flex-col items-center gap-5"><Loader2 size={32} className="animate-spin text-green-500"/><div className="text-center"><p className={`font-bold ${c.text}`}>Processing...</p><p className={`text-sm ${c.muted} mt-1`}>Connecting to your bank</p></div></div>}
          {step===2 && <div className="py-8 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-3xl">✅</div>
            <div><p className={`text-xl font-extrabold ${c.text}`}>Funds Added!</p><p className={`text-sm ${c.light} mt-1`}>{fmt(Number(amount))} is now in your Collectica wallet.</p></div>
            <button onClick={()=>{onDone(Number(amount));onClose()}} className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${isDark?'bg-white text-[#0a0a0a]':'bg-[#0a0a0a] text-white'}`}>Done</button>
          </div>}
        </div>
      </div>
    </div>
  )
}

export default function Escrow() {
  const { theme, toggle } = useTheme()
  const { profile, isFreelancer, refreshProfile } = useAuth()
  const isDark = theme === 'dark'
  const [tab, setTab]                   = useState('overview')
  const [expanded, setExpanded]         = useState('e1')
  const [showTopUp, setShowTopUp]       = useState(false)
  const [walletBalance, setWalletBalance] = useState(profile?.wallet_balance || 0)
  const [releaseModal, setReleaseModal] = useState(null)

  const c = {
    bg:     isDark?'bg-[#0a0a0a]':'bg-[#f8f8f8]',
    card:   isDark?'bg-[#111]':'bg-white',
    bgMid:  isDark?'bg-[#1a1a1a]':'bg-[#f0f0f0]',
    bgAcc:  isDark?'bg-[#242424]':'bg-[#e8e8e8]',
    border: isDark?'border-[#2e2e2e]':'border-[#e0e0e0]',
    text:   isDark?'text-white':'text-[#0a0a0a]',
    muted:  isDark?'text-[#555]':'text-[#aaa]',
    light:  isDark?'text-[#888]':'text-[#666]',
    btn:    isDark?'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]':'bg-[#0a0a0a] text-white hover:bg-[#222]',
    ghost:  isDark?'border-[#2e2e2e] text-[#888] hover:text-white':'border-[#e0e0e0] text-[#666] hover:text-[#0a0a0a]',
    divider:isDark?'bg-[#2e2e2e]':'bg-[#e0e0e0]',
    progress:isDark?'bg-[#2e2e2e]':'bg-[#e8e8e8]',
    tab:    isDark?'text-[#555] hover:text-white':'text-[#aaa] hover:text-[#0a0a0a]',
    tabAct: isDark?'text-white border-b-2 border-white':'text-[#0a0a0a] border-b-2 border-[#0a0a0a]',
  }

  const totalLocked   = DEMO_CONTRACTS.filter(e=>e.funded).reduce((s,e)=>s+e.locked,0)
  const totalReleased = DEMO_CONTRACTS.reduce((s,e)=>s+e.released,0)

  const ReleaseModal = () => {
    const [step, setStep] = useState(0)
    const m = releaseModal?.milestone
    const handle = async () => { setStep(1); await new Promise(r=>setTimeout(r,2000)); setStep(2) }
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={()=>setReleaseModal(null)}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
        <div className={`relative w-full max-w-md ${c.card} border ${c.border} rounded-2xl overflow-hidden`} onClick={e=>e.stopPropagation()}>
          <div className={`flex items-center justify-between px-6 py-4 border-b ${c.border}`}>
            <p className={`font-bold ${c.text}`}>Release Payment</p>
            <button onClick={()=>setReleaseModal(null)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bgMid} ${c.light}`}><X size={15}/></button>
          </div>
          <div className="p-6">
            {step===0 && <div className="space-y-5">
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <p className="text-xs text-green-500 font-bold mb-1">Releasing</p>
                <p className={`text-sm font-bold ${c.text}`}>{m?.title}</p>
                <p className="text-2xl font-extrabold mt-2 text-green-500">{fmt(m?.amount||0)}</p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl border border-orange-500/20 bg-orange-500/5"><AlertTriangle size={13} className="text-orange-500 mt-0.5"/><p className="text-xs text-orange-400 leading-relaxed">Once released, this payment cannot be reversed. Confirm the work meets the agreed scope.</p></div>
              <button onClick={handle} className="w-full py-4 rounded-xl font-bold text-sm bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center gap-2"><CheckCircle size={15}/> Confirm & Release {fmt(m?.amount||0)}</button>
              <button onClick={()=>setReleaseModal(null)} className={`w-full py-3 rounded-xl border font-semibold text-sm transition-all ${c.ghost}`}>Cancel</button>
            </div>}
            {step===1 && <div className="py-12 flex flex-col items-center gap-5"><Loader2 size={32} className="animate-spin text-green-500"/><p className={`font-bold ${c.text}`}>Processing...</p></div>}
            {step===2 && <div className="py-8 flex flex-col items-center gap-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-3xl">💸</div>
              <div><p className={`text-xl font-extrabold ${c.text}`}>Payment Released!</p><p className={`text-sm ${c.light} mt-1`}>{fmt(m?.amount||0)} sent to the freelancer instantly.</p></div>
              <button onClick={()=>setReleaseModal(null)} className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${c.btn}`}>Done</button>
            </div>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${c.bg}`}>
      <header className={`sticky top-0 z-20 flex items-center justify-between px-6 md:px-10 py-4 border-b ${c.border} ${c.card}`}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={`flex items-center gap-2 text-sm font-semibold ${c.light}`}><ArrowLeft size={15}/> Dashboard</Link>
          <div className={`w-px h-4 ${c.divider}`}/>
          <div className="flex items-center gap-2"><Wallet size={15} className={c.muted}/><span className={`text-sm font-bold ${c.text}`}>Escrow & Wallet</span></div>
        </div>
        <button onClick={toggle} className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm ${isDark?'border-[#2e2e2e] bg-[#1a1a1a]':'border-[#e0e0e0] bg-[#f0f0f0]'}`}>{isDark?'☀️':'🌙'}</button>
      </header>

      <main className="flex-1 px-4 md:px-10 py-10 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Protected Funds</p>
          <h1 className={`text-4xl font-extrabold tracking-tight ${c.text}`}>Escrow & Wallet</h1>
          <p className={`text-sm ${c.light} mt-1`}>{isFreelancer?'Track all funds held in escrow for your contracts. Released when clients approve milestones.':'Manage your wallet and allocate funds to contracts. Full visibility — no surprises.'}</p>
        </div>

        {/* Wallet card */}
        <div className={`${c.card} border ${c.border} rounded-2xl p-6 mb-6 flex items-center justify-between flex-wrap gap-4`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-1`}>Wallet Balance</p>
            <p className={`text-4xl font-extrabold tracking-tight ${c.text}`}>{fmt(walletBalance)}</p>
            <p className={`text-xs ${c.light} mt-1`}>{isFreelancer?'Your available earnings':'Available to fund contracts'}</p>
          </div>
          {!isFreelancer && (
            <button onClick={()=>setShowTopUp(true)} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${c.btn}`}><Plus size={14}/> Add Money</button>
          )}
          {isFreelancer && (
            <div className="text-right">
              <p className={`text-xs ${c.muted} mb-1`}>Total Locked in Escrow</p>
              <p className="text-xl font-extrabold text-orange-500">{fmt(totalLocked)}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {label:'Locked in Escrow', value:fmt(totalLocked),   color:'text-orange-500', icon:<Lock size={15}/>},
            {label:'Total Released',   value:fmt(totalReleased), color:'text-green-500',  icon:<TrendingUp size={15}/>},
            {label:'Active Contracts', value:'2',                 color:null,              icon:<Wallet size={15}/>},
            {label:'Awaiting Funding', value:'1',                 color:'text-[#888]',     icon:<Clock size={15}/>},
          ].map(s=>(
            <div key={s.label} className={`${c.card} border ${c.border} rounded-2xl p-4`}>
              <div className={`flex items-center gap-2 mb-2 ${s.color||c.muted}`}>{s.icon}<span className="text-xs font-bold uppercase tracking-widest">{s.label}</span></div>
              <p className={`text-xl font-extrabold ${s.color||c.text}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={`flex gap-6 border-b ${c.border} mb-6`}>
          {[{k:'overview',l:'Contracts'},{k:'history',l:'Transactions'}].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} className={`pb-3 text-sm font-bold transition-all ${tab===t.k?c.tabAct:c.tab}`}>{t.l}</button>
          ))}
        </div>

        {tab==='overview' && (
          <div className="space-y-4">
            {DEMO_CONTRACTS.map(ec=>{
              const isExpanded = expanded===ec.id
              const pct = ec.total>0?(ec.released/ec.total)*100:0
              return (
                <div key={ec.id} className={`${c.card} border ${c.border} rounded-2xl overflow-hidden`}>
                  <button onClick={()=>setExpanded(isExpanded?null:ec.id)} className={`w-full flex items-center gap-4 px-6 py-5 text-left transition-colors ${isDark?'hover:bg-[#1a1a1a]':'hover:bg-[#f8f8f8]'}`}>
                    <div className={`w-11 h-11 rounded-xl ${c.bgMid} border ${c.border} flex items-center justify-center font-bold text-sm ${c.text}`}>{ec.initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-bold ${c.text}`}>{ec.contract}</p>
                        {!ec.funded && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#888]/10 text-[#888]">Unfunded</span>}
                        {ec.status==='completed' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">✓ Complete</span>}
                      </div>
                      <div className={`mt-2 h-1.5 rounded-full ${c.progress} w-48 max-w-full`}><div className="h-1.5 rounded-full bg-green-500 transition-all" style={{width:`${pct}%`}}/></div>
                      <p className={`text-xs mt-1 ${c.muted}`}>{fmt(ec.released)} of {fmt(ec.total)} released</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs ${c.muted}`}>Locked</p>
                      <p className={`text-base font-extrabold ${ec.locked>0?'text-orange-500':c.muted}`}>{fmt(ec.locked)}</p>
                    </div>
                    <ChevronRight size={16} className={`${c.muted} transition-transform ${isExpanded?'rotate-90':''}`}/>
                  </button>

                  {isExpanded && (
                    <div className={`border-t ${c.border}`}>
                      {!ec.funded && (
                        <div className="px-6 py-3 border-b border-orange-500/20 bg-orange-500/5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2"><AlertTriangle size={13} className="text-orange-500"/><p className="text-xs text-orange-400">Escrow not funded. Freelancer cannot begin work.</p></div>
                          {!isFreelancer && <button onClick={()=>setShowTopUp(true)} className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold">Fund Now</button>}
                        </div>
                      )}
                      <div className="divide-y" style={{borderColor:isDark?'#2e2e2e':'#e8e8e8'}}>
                        {ec.milestones.map(m=>{
                          const ms = MS[m.status]
                          const canRelease = !isFreelancer && m.status==='pending'
                          return (
                            <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.status==='released'?'border-green-500 bg-green-500/10 text-green-500':`${isDark?'border-[#2e2e2e] text-[#555]':'border-[#e0e0e0] text-[#aaa]'}`}`}>{m.status==='released'?<Check size={12}/>:m.id}</div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold ${c.text}`}>{m.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${ms.bg} ${ms.color}`}><span className={`w-1.5 h-1.5 rounded-full ${ms.dot}`}/>{ms.label}</span>
                                  <span className={`text-xs ${c.muted}`}>{m.pct}%</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <p className={`text-sm font-extrabold ${m.status==='released'?'text-green-500':c.text}`}>{fmt(m.amount)}</p>
                                {canRelease && <button onClick={()=>setReleaseModal({milestone:m,contract:ec})} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-all"><ArrowUpRight size={11}/> Release</button>}
                                {m.status==='released' && <span className="flex items-center gap-1 text-xs font-bold text-green-500"><CheckCircle size={12}/> Paid</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {ec.funded && <div className={`px-6 py-3 border-t ${c.border} flex justify-end`}><p className={`text-xs ${c.muted} flex items-center gap-1.5`}><Shield size={11}/> Secured by Collectica Escrow</p></div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab==='history' && (
          <div className={`${c.card} border ${c.border} rounded-2xl overflow-hidden`}>
            <div className="divide-y" style={{borderColor:isDark?'#2e2e2e':'#e8e8e8'}}>
              {TXNS.map(tx=>{
                const isRelease = tx.type==='released'
                const isDeposit = tx.type==='deposit'
                return (
                  <div key={tx.id} className={`flex items-center gap-4 px-6 py-4 ${isDark?'hover:bg-[#1a1a1a]':'hover:bg-[#f8f8f8]'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isRelease?'bg-green-500/10 text-green-500':isDeposit?'bg-blue-400/10 text-blue-400':'bg-orange-500/10 text-orange-500'}`}>
                      {isRelease?<ArrowUpRight size={16}/>:isDeposit?<Plus size={16}/>:<ArrowDownLeft size={16}/>}
                    </div>
                    <div className="flex-1 min-w-0"><p className={`text-sm font-bold truncate ${c.text}`}>{tx.desc}</p><p className={`text-xs ${c.muted} mt-0.5`}>{tx.date}</p></div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-extrabold ${isRelease||isDeposit?'text-green-500':c.text}`}>{isRelease||isDeposit?'+':''}{fmt(tx.amount)}</p>
                      <p className={`text-xs mt-0.5 font-semibold capitalize ${isRelease?'text-green-500':isDeposit?'text-blue-400':'text-orange-500'}`}>{tx.type}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className={`px-6 py-4 border-t ${c.border} flex items-center justify-between ${isDark?'bg-[#1a1a1a]':'bg-[#f8f8f8]'}`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${c.muted}`}>Net Released</p>
              <p className="text-lg font-extrabold text-green-500">{fmt(totalReleased)}</p>
            </div>
          </div>
        )}
      </main>

      {showTopUp && <TopUpModal isDark={isDark} c={c} onClose={()=>setShowTopUp(false)} onDone={(amt)=>setWalletBalance(b=>b+amt)}/>}
      {releaseModal && <ReleaseModal/>}
    </div>
  )
}
