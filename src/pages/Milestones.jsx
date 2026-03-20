import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock, RotateCcw, AlertTriangle, Shield, Sparkles, X, Check, ChevronRight, FileText } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth } from '../lib/AuthContext'

const MILESTONES = [
  { id:'m1', contract:'Brand Identity — TechFlow Nigeria', milestone:'Milestone 2 — Logo Concepts', submittedBy:'Ade Okonkwo', submittedAt:'2 hours ago', fileName:'techflow_logo_concepts_v1.zip', fileSize:'14.2 MB', status:'pending', amount:'₦135,000', aiScore:91, aiVerdict:'pass', aiSummary:'3 logo concepts delivered as specified. File format meets requirements. Scope match confirmed.', reviewsAllowed:2, reviewsUsed:0 },
  { id:'m2', contract:'Social Media Kit — Kemi Adeyemi',  milestone:'Milestone 1 — Full Delivery',  submittedBy:'Ade Okonkwo', submittedAt:'1 day ago',   fileName:'kemi_social_kit_final.zip',      fileSize:'8.7 MB',  status:'approved',amount:'₦180,000', aiScore:97, aiVerdict:'pass', aiSummary:'All deliverables present. 12 post templates, 4 story templates, brand guide included.', reviewsAllowed:2, reviewsUsed:0 },
  { id:'m3', contract:'Pitch Deck — BuildLagos',          milestone:'Milestone 1 — Draft Slides',   submittedBy:'Ade Okonkwo', submittedAt:'3 days ago',  fileName:'buildlagos_deck_draft.pdf',      fileSize:'3.1 MB',  status:'revision',amount:'₦105,000', aiScore:58, aiVerdict:'warn', aiSummary:'Partial match. 12 of 15 agreed slides delivered. Missing: Market Analysis, Competitive Landscape, Financial Projections.', reviewsAllowed:2, reviewsUsed:1, revisionNote:'Please include the missing 3 slides before resubmitting.' },
]

const STATUS = {
  pending:  {label:'Pending Review', icon:<Clock size={13}/>,         color:'text-orange-500', bg:'bg-orange-500/10', border:'border-orange-500/20'},
  approved: {label:'Approved',       icon:<CheckCircle size={13}/>,    color:'text-green-500',  bg:'bg-green-500/10',  border:'border-green-500/20'},
  revision: {label:'Needs Revision', icon:<RotateCcw size={13}/>,      color:'text-red-500',    bg:'bg-red-500/10',    border:'border-red-500/20'},
}

export default function Milestones() {
  const { theme, toggle } = useTheme()
  const { isFreelancer } = useAuth()
  const isDark = theme === 'dark'
  const [tab, setTab]       = useState('all')
  const [selected, setSelected] = useState(null)
  const [approving, setApproving] = useState(false)
  const [approved, setApproved]   = useState([])

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

  const handleApprove = async (id) => {
    setApproving(true)
    await new Promise(r=>setTimeout(r,1500))
    setApproved(p=>[...p,id])
    setApproving(false)
    setSelected(null)
  }

  const filtered = tab==='all' ? MILESTONES : MILESTONES.filter(m=>m.status===tab)

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${c.bg}`}>
      <header className={`sticky top-0 z-20 flex items-center justify-between px-6 md:px-10 py-4 border-b ${c.border} ${c.card}`}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={`flex items-center gap-2 text-sm font-semibold ${c.light}`}><ArrowLeft size={15}/> Dashboard</Link>
          <div className={`w-px h-4 ${c.divider}`}/>
          <div className="flex items-center gap-2"><Shield size={15} className={c.muted}/><span className={`text-sm font-bold ${c.text}`}>Milestones</span></div>
        </div>
        <button onClick={toggle} className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm ${isDark?'border-[#2e2e2e] bg-[#1a1a1a]':'border-[#e0e0e0] bg-[#f0f0f0]'}`}>{isDark?'☀️':'🌙'}</button>
      </header>

      <main className="flex-1 px-4 md:px-10 py-10 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Milestone Notifications</p>
          <h1 className={`text-4xl font-extrabold tracking-tight ${c.text}`}>Milestones</h1>
          <p className={`text-sm ${c.light} mt-1`}>{isFreelancer?'Notifications when clients approve your work and payments are released.':'Review submitted work and release milestone payments when satisfied.'}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[{l:'Pending Review',v:MILESTONES.filter(m=>m.status==='pending').length,c:'text-orange-500'},{l:'Approved',v:MILESTONES.filter(m=>m.status==='approved').length+approved.length,c:'text-green-500'},{l:'Needs Revision',v:MILESTONES.filter(m=>m.status==='revision').length,c:'text-red-500'}].map(s=>(
            <div key={s.l} className={`${c.card} border ${c.border} rounded-2xl p-4`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>{s.l}</p>
              <p className={`text-2xl font-extrabold ${s.c}`}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={`flex gap-6 border-b ${c.border} mb-6`}>
          {[{k:'all',l:'All'},{k:'pending',l:'Pending'},{k:'approved',l:'Approved'},{k:'revision',l:'Needs Revision'}].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} className={`pb-3 text-sm font-bold transition-all ${tab===t.k?c.tabAct:c.tab}`}>{t.l}</button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(m=>{
            const s = STATUS[approved.includes(m.id)?'approved':m.status]
            const effStatus = approved.includes(m.id)?'approved':m.status
            return (
              <div key={m.id} onClick={()=>setSelected(m)} className={`${c.card} border ${c.border} rounded-2xl p-5 cursor-pointer transition-all ${isDark?'hover:bg-[#1a1a1a]':'hover:bg-[#f8f8f8]'} hover:scale-[1.005]`}>
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl ${c.bgMid} border ${c.border} flex items-center justify-center flex-shrink-0`}><FileText size={18} className={c.light}/></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div><p className={`text-sm font-bold ${c.text}`}>{m.contract}</p><p className={`text-xs ${c.muted} mt-0.5`}>{m.milestone}</p></div>
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${s.border} ${s.bg} ${s.color}`}>{s.icon} {s.label}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <span className={`text-xs ${c.muted}`}>{m.fileName} · {m.fileSize}</span>
                      <span className={`text-xs ${c.muted}`}>{m.submittedAt}</span>
                      <span className={`text-xs font-bold flex items-center gap-1 ${m.aiVerdict==='pass'?'text-green-500':'text-orange-500'}`}><Sparkles size={11}/>AI: {m.aiScore}/100</span>
                      <span className={`text-xs ${c.muted}`}>Reviews: {m.reviewsUsed}/{m.reviewsAllowed}</span>
                    </div>
                    {m.revisionNote && <div className="mt-2 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 flex items-start gap-1.5"><RotateCcw size={10} className="text-red-500 mt-0.5 flex-shrink-0"/><p className="text-xs text-red-400 line-clamp-1">{m.revisionNote}</p></div>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-extrabold ${effStatus==='approved'?'text-green-500':c.text}`}>{m.amount}</p>
                    <ChevronRight size={15} className={`${c.muted} mt-1`}/>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Detail modal */}
      {selected && (() => {
        const effStatus = approved.includes(selected.id)?'approved':selected.status
        const s = STATUS[effStatus]
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={()=>setSelected(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
            <div className={`relative w-full max-w-lg ${c.card} border ${c.border} rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto`} onClick={e=>e.stopPropagation()}>
              <div className={`flex items-center justify-between px-6 py-4 border-b ${c.border}`}>
                <p className={`font-bold ${c.text}`}>Milestone Detail</p>
                <button onClick={()=>setSelected(null)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bgMid} ${c.light}`}><X size={15}/></button>
              </div>
              <div className="p-6 space-y-5">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${s.border} ${s.bg} w-fit`}><span className={s.color}>{s.icon}</span><span className={`text-xs font-bold ${s.color}`}>{s.label}</span></div>
                <div><p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-1`}>Contract</p><p className={`text-sm font-bold ${c.text}`}>{selected.contract}</p><p className={`text-xs ${c.muted} mt-0.5`}>{selected.milestone}</p></div>
                <div className={`flex items-center gap-3 p-4 rounded-xl ${c.bgMid} border ${c.border}`}>
                  <FileText size={20} className={c.light}/>
                  <div><p className={`text-sm font-bold ${c.text}`}>{selected.fileName}</p><p className={`text-xs ${c.muted}`}>{selected.fileSize} · Submitted {selected.submittedAt}</p></div>
                </div>
                <div className={`border rounded-2xl overflow-hidden ${selected.aiVerdict==='pass'?'border-green-500/20':'border-orange-500/20'}`}>
                  <div className={`flex items-center gap-2 px-4 py-2.5 ${selected.aiVerdict==='pass'?'bg-green-500/5':'bg-orange-500/5'}`}><Sparkles size={12} className={selected.aiVerdict==='pass'?'text-green-500':'text-orange-500'}/><p className={`text-xs font-bold ${selected.aiVerdict==='pass'?'text-green-500':'text-orange-500'}`}>AI Scope Check — {selected.aiScore}/100</p></div>
                  <div className="px-4 py-3"><p className={`text-xs leading-relaxed ${c.light}`}>{selected.aiSummary}</p></div>
                </div>
                {selected.revisionNote && <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4"><p className="text-xs font-bold text-red-500 mb-1">Revision Requested ({selected.reviewsUsed}/{selected.reviewsAllowed} used)</p><p className={`text-xs ${c.light}`}>{selected.revisionNote}</p></div>}
                {selected.reviewsUsed >= selected.reviewsAllowed && effStatus!=='approved' && (
                  <div className="border border-blue-400/20 bg-blue-400/5 rounded-xl p-4 flex items-start gap-2"><AlertTriangle size={13} className="text-blue-400 mt-0.5"/><p className="text-xs text-blue-400">Review rounds exhausted. Client must approve or escalate. AI will auto-release if satisfaction was expressed in chat.</p></div>
                )}
                <div className={`flex items-center justify-between p-4 rounded-xl ${c.bgMid} border ${c.border}`}><span className={`text-sm font-bold ${c.text}`}>Milestone Payment</span><span className={`text-lg font-extrabold ${effStatus==='approved'?'text-green-500':c.text}`}>{selected.amount}</span></div>
                {!isFreelancer && effStatus==='pending' && !approved.includes(selected.id) && (
                  <div className="flex gap-3">
                    <button onClick={()=>handleApprove(selected.id)} disabled={approving} className="flex-1 py-3 rounded-xl font-bold text-sm bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {approving?<><Clock size={14} className="animate-spin"/>Processing...</>:<><Check size={14}/>Approve & Release Payment</>}
                    </button>
                    <button className="flex-1 py-3 rounded-xl border font-semibold text-sm border-red-500/30 text-red-500 hover:bg-red-500/10 flex items-center justify-center gap-2"><RotateCcw size={14}/> Request Revision</button>
                  </div>
                )}
                {effStatus==='approved' && <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20"><CheckCircle size={14} className="text-green-500"/><p className="text-xs font-bold text-green-500">Approved — Payment released. This action is irreversible.</p></div>}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
