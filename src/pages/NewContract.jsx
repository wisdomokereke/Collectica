import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Shield, Sparkles, Check, Loader2, FileText } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth } from '../lib/AuthContext'

const JOB_TYPES = ['Logo & Brand Identity','Web Development','Mobile App','Social Media Kit','Video Production','Copywriting & Content','UI/UX Design','Motion Graphics']
const DURATIONS = ['Under 1 week','1–2 weeks','2–4 weeks','1–2 months','2–3 months','3+ months']

export default function NewContract() {
  const { theme } = useTheme()
  const { displayName, isFreelancer } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ jobType:'', desc:'', budget:'', duration:'', freelancer:'', client: displayName })
  const [contract, setContract] = useState('')
  const [generating, setGenerating] = useState(false)
  const [milestones, setMilestones] = useState([])
  const [signing, setSigning] = useState(false)
  const [done, setDone] = useState(false)
  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  const c = {
    bg:     isDark?'bg-[#0a0a0a]':'bg-[#f8f8f8]',
    card:   isDark?'bg-[#111]':'bg-white',
    bgMid:  isDark?'bg-[#1a1a1a]':'bg-[#f0f0f0]',
    border: isDark?'border-[#2e2e2e]':'border-[#e0e0e0]',
    text:   isDark?'text-white':'text-[#0a0a0a]',
    muted:  isDark?'text-[#555]':'text-[#aaa]',
    light:  isDark?'text-[#888]':'text-[#666]',
    input:  isDark?'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e] focus:border-white':'bg-white text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0] focus:border-[#0a0a0a]',
    btn:    isDark?'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]':'bg-[#0a0a0a] text-white hover:bg-[#222]',
    divider:isDark?'bg-[#2e2e2e]':'bg-[#e0e0e0]',
  }

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, messages:[{role:'user',content:`Generate a short, professional freelance contract for:\n- Job: ${form.jobType}\n- Description: ${form.desc}\n- Budget: ₦${form.budget}\n- Duration: ${form.duration}\n- Freelancer: ${form.freelancer||'Freelancer'}\n- Client: ${form.client||'Client'}\n\nInclude: scope of work, deliverables, payment terms, revision policy. Keep it concise and clear.`}]})
      })
      const data = await res.json()
      setContract(data.content?.[0]?.text || 'Contract generated successfully.')
    } catch { setContract(`CONTRACT AGREEMENT\n\nThis agreement is between ${form.client||'Client'} and ${form.freelancer||'Freelancer'} for ${form.jobType} services.\n\nScope: ${form.desc}\n\nBudget: ₦${form.budget}\nDuration: ${form.duration}\n\nPayment will be held in Collectica escrow and released upon milestone approval.`) }
    const count = ['1–2 weeks','Under 1 week'].includes(form.duration) ? 2 : form.duration.includes('month') ? 3 : 4
    setMilestones(Array.from({length:count},(_,i)=>({id:i+1,title:`Milestone ${i+1}`,pct:Math.floor(100/count),amount:Math.floor((parseInt(form.budget)||0)/count)})))
    setGenerating(false)
    setStep(2)
  }

  const sign = async () => {
    setSigning(true)
    await new Promise(r=>setTimeout(r,1500))
    setSigning(false); setDone(true)
  }

  if (done) return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${c.bg}`}>
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-4xl mx-auto mb-6">✅</div>
        <h1 className={`text-3xl font-extrabold ${c.text} mb-2`}>Contract Signed!</h1>
        <p className={`text-sm ${c.light} mb-6`}>The contract is live. Escrow awaiting funding from the client.</p>
        <div className={`${c.card} border ${c.border} rounded-2xl p-4 text-left mb-6 space-y-2`}>
          {[['Contract ID',`#COL-${Math.random().toString(36).slice(2,8).toUpperCase()}`],['Value',`₦${parseInt(form.budget||0).toLocaleString()}`],['Milestones',milestones.length],['Status','Awaiting escrow']].map(([l,v])=>(
            <div key={l} className="flex justify-between py-1.5 border-b last:border-0" style={{borderColor:isDark?'#2e2e2e':'#e8e8e8'}}>
              <span className={`text-xs ${c.muted}`}>{l}</span><span className={`text-xs font-bold ${c.text}`}>{v}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Link to="/escrow" className={`flex-1 py-3 rounded-xl font-bold text-sm text-center transition-all ${c.btn}`}>Fund Escrow</Link>
          <Link to="/dashboard" className={`flex-1 py-3 rounded-xl border font-semibold text-sm text-center ${c.border} ${c.light}`}>Dashboard</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen flex flex-col ${c.bg}`}>
      <header className={`flex items-center justify-between px-6 py-4 border-b ${c.border} ${c.card}`}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={`flex items-center gap-2 text-sm font-semibold ${c.light}`}><ArrowLeft size={15}/> Dashboard</Link>
          <div className={`w-px h-4 ${c.divider}`}/>
          <span className={`text-sm font-bold ${c.text}`}>New Contract</span>
        </div>
        <div className="flex gap-2">{[0,1,2,3].map(i=><div key={i} className={`h-1.5 rounded-full w-8 transition-all ${i<=step?'bg-green-500':isDark?'bg-[#2e2e2e]':'bg-[#e0e0e0]'}`}/>)}</div>
      </header>

      <main className="flex-1 px-4 py-10 max-w-2xl mx-auto w-full">
        {step===0 && (
          <div className="space-y-6">
            <div><h1 className={`text-3xl font-extrabold ${c.text} mb-1`}>Project Details</h1><p className={`text-sm ${c.light}`}>Tell Collectica what you need. AI will do the rest.</p></div>
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-3`}>Job Type</label>
              <div className="grid grid-cols-2 gap-2">{JOB_TYPES.map(j=><button key={j} onClick={()=>set('jobType',j)} className={`text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${form.jobType===j?'border-green-500 bg-green-500/10 text-green-500 font-bold':`${c.border} ${c.light}`}`}>{j}</button>)}</div>
            </div>
            <div><label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Project Description</label><textarea placeholder="Describe the project in detail..." value={form.desc} onChange={e=>set('desc',e.target.value)} rows={4} className={`w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none transition-all ${c.input}`}/></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Budget (₦)</label><input type="number" placeholder="e.g. 250000" value={form.budget} onChange={e=>set('budget',e.target.value)} className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${c.input}`}/></div>
              <div><label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Duration</label><select value={form.duration} onChange={e=>set('duration',e.target.value)} className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${c.input}`}><option value="">Choose...</option>{DURATIONS.map(d=><option key={d}>{d}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>{isFreelancer?'Client Name':'Freelancer Name'}</label><input type="text" placeholder="Full name" value={form.freelancer} onChange={e=>set('freelancer',e.target.value)} className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${c.input}`}/></div>
              <div><label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Your Name</label><input type="text" value={displayName} disabled className={`w-full px-4 py-3 rounded-xl border text-sm outline-none opacity-60 ${c.input}`}/></div>
            </div>
            <button onClick={()=>setStep(1)} disabled={!form.jobType||!form.desc||!form.budget||!form.duration} className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${c.btn}`}>Continue <ArrowRight size={15}/></button>
          </div>
        )}

        {step===1 && (
          <div className="space-y-6">
            <div><h1 className={`text-3xl font-extrabold ${c.text} mb-1`}>Generate Contract</h1><p className={`text-sm ${c.light}`}>AI will write a professional contract from your details.</p></div>
            <div className={`${c.card} border ${c.border} rounded-2xl p-5 space-y-3`}>
              {[['Job Type',form.jobType],['Budget',`₦${parseInt(form.budget||0).toLocaleString()}`],['Duration',form.duration]].map(([l,v])=>(
                <div key={l} className="flex justify-between"><span className={`text-sm ${c.muted}`}>{l}</span><span className={`text-sm font-bold ${c.text}`}>{v}</span></div>
              ))}
            </div>
            <div className={`flex items-start gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/5`}><Sparkles size={15} className="text-green-500 mt-0.5 flex-shrink-0"/><div><p className={`text-sm font-bold text-green-500`}>AI Contract Generation</p><p className={`text-xs text-green-600 mt-0.5`}>Claude will write a clear, professional contract covering scope, payment terms, revisions, and milestones.</p></div></div>
            <div className="flex gap-3">
              <button onClick={()=>setStep(0)} className={`px-4 py-4 rounded-xl border font-semibold text-sm ${c.border} ${c.light}`}><ArrowLeft size={15}/></button>
              <button onClick={generate} disabled={generating} className={`flex-1 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${c.btn}`}>{generating?<><Loader2 size={15} className="animate-spin"/> Generating...</>:<><Sparkles size={15}/> Generate with AI</>}</button>
            </div>
          </div>
        )}

        {step===2 && (
          <div className="space-y-6">
            <div><h1 className={`text-3xl font-extrabold ${c.text} mb-1`}>Contract & Milestones</h1><p className={`text-sm ${c.light}`}>Review the AI-generated contract and milestone breakdown.</p></div>
            <div className={`${c.card} border ${c.border} rounded-2xl overflow-hidden`}>
              <div className={`flex items-center justify-between px-5 py-3 border-b ${c.border}`}><div className="flex items-center gap-2"><Sparkles size={13} className="text-green-500"/><span className={`text-xs font-bold text-green-500`}>AI Generated</span></div><span className={`text-xs ${c.muted}`}>Review before signing</span></div>
              <pre className={`px-5 py-4 text-xs leading-relaxed whitespace-pre-wrap font-mono ${c.light} max-h-64 overflow-y-auto`}>{contract}</pre>
            </div>
            <div className={`${c.card} border ${c.border} rounded-2xl overflow-hidden`}>
              <div className={`px-5 py-3 border-b ${c.border}`}><p className={`text-xs font-bold uppercase tracking-widest ${c.muted}`}>Milestones</p></div>
              {milestones.map(m=>(
                <div key={m.id} className={`flex items-center justify-between px-5 py-3 border-b last:border-0 ${c.border}`}>
                  <div className="flex items-center gap-3"><div className={`w-7 h-7 rounded-full ${c.bgMid} border ${c.border} flex items-center justify-center text-xs font-bold ${c.text}`}>{m.id}</div><span className={`text-sm font-medium ${c.text}`}>{m.title}</span></div>
                  <div className="text-right"><p className={`text-sm font-extrabold ${c.text}`}>₦{m.amount.toLocaleString()}</p><p className={`text-xs ${c.muted}`}>{m.pct}%</p></div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setStep(1)} className={`px-4 py-4 rounded-xl border font-semibold text-sm ${c.border} ${c.light}`}><ArrowLeft size={15}/></button>
              <button onClick={()=>setStep(3)} className={`flex-1 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${c.btn}`}>Review & Sign <ArrowRight size={15}/></button>
            </div>
          </div>
        )}

        {step===3 && (
          <div className="space-y-6">
            <div><h1 className={`text-3xl font-extrabold ${c.text} mb-1`}>Sign Contract</h1><p className={`text-sm ${c.light}`}>By signing you agree to the terms and Collectica's escrow protection.</p></div>
            <div className={`${c.card} border ${c.border} rounded-2xl p-5 space-y-4`}>
              {[{name:displayName,role:isFreelancer?'Freelancer':'Client',signed:true},{name:form.freelancer||'Other party',role:isFreelancer?'Client':'Freelancer',signed:false}].map((p,i)=>(
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${c.bgMid} border ${c.border}`}>
                  <div><p className={`text-sm font-bold ${c.text}`}>{p.name}</p><p className={`text-xs ${c.muted}`}>{p.role}</p></div>
                  {p.signed?<span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full"><Check size={10}/> Signed</span>:<span className={`text-xs ${c.muted}`}>Awaiting</span>}
                </div>
              ))}
            </div>
            <div className={`flex items-start gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/5`}><Shield size={14} className="text-green-500 mt-0.5"/><p className="text-xs text-green-600 leading-relaxed">Signing activates Collectica escrow protection. Funds from the client will be held securely until you approve milestones.</p></div>
            <div className="flex gap-3">
              <button onClick={()=>setStep(2)} className={`px-4 py-4 rounded-xl border font-semibold text-sm ${c.border} ${c.light}`}><ArrowLeft size={15}/></button>
              <button onClick={sign} disabled={signing} className={`flex-1 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${c.btn}`}>{signing?<><Loader2 size={15} className="animate-spin"/>Signing...</>:<><Check size={15}/> Sign & Create Contract</>}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
