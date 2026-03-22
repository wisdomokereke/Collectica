import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Briefcase, ArrowRight, Upload,
  CheckCircle, File, X, Shield, DollarSign
} from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
  'Graphic Design', 'UI/UX Design', 'Web Development', 'Mobile Development',
  'Copywriting', 'Content Writing', 'Video Editing', 'Motion Graphics',
  'Social Media Management', 'Photography', 'Branding', 'SEO',
  'Data Analysis', 'Virtual Assistant', 'Voiceover', 'Translation',
  '3D Modeling', 'Animation', 'Other',
]

const DURATIONS = [
  { label: 'Less than a week', value: 'less_than_week' },
  { label: '1–2 weeks',        value: '1_2_weeks'      },
  { label: '1 month',          value: '1_month'         },
  { label: '2–3 months',       value: '2_3_months'      },
  { label: '3–6 months',       value: '3_6_months'      },
  { label: 'Ongoing',          value: 'ongoing'         },
]

export default function NewContract() {
  const { theme } = useTheme()
  const { user, isFreelancer, loading } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'
  const fileRef = useRef(null)

  const [step, setStep]       = useState(0) // 0=details, 1=preview, 2=posted
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [brief, setBrief]     = useState(null)
  const [form, setForm]       = useState({
    title: '', description: '', category: '',
    budget_min: '', budget_max: '', deadline: '', duration: '',
    skills_needed: [],
  })

  const c = {
    bg:      isDark ? 'bg-[#0a0a0a]'     : 'bg-[#f8f8f8]',
    card:    isDark ? 'bg-[#111]'        : 'bg-white',
    bgMid:   isDark ? 'bg-[#1a1a1a]'     : 'bg-[#f0f0f0]',
    border:  isDark ? 'border-[#2e2e2e]' : 'border-[#e0e0e0]',
    text:    isDark ? 'text-white'       : 'text-[#0a0a0a]',
    muted:   isDark ? 'text-[#555]'      : 'text-[#aaa]',
    light:   isDark ? 'text-[#888]'      : 'text-[#666]',
    input:   isDark
      ? 'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e] focus:border-white'
      : 'bg-white text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0] focus:border-[#0a0a0a]',
    btn:     isDark ? 'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]' : 'bg-[#0a0a0a] text-white hover:bg-[#222]',
    btnGhost:isDark ? 'border-[#2e2e2e] text-[#888] hover:text-white' : 'border-[#e0e0e0] text-[#666] hover:text-[#0a0a0a]',
  }

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const toggleSkill = (skill) => setForm(f => ({
    ...f,
    skills_needed: f.skills_needed.includes(skill)
      ? f.skills_needed.filter(s => s !== skill)
      : [...f.skills_needed, skill]
  }))

  const handleBrief = (e) => {
    const file = e.target.files?.[0]
    if (file) setBrief(file)
  }

  const canPost = () =>
    form.title.trim() &&
    form.description.trim() &&
    form.category &&
    form.budget_min &&
    form.budget_max &&
    parseFloat(form.budget_max) >= parseFloat(form.budget_min)

  const handlePost = async () => {
    setError('')
    setLoading(true)
    try {
      let brief_url  = null
      let brief_name = null

      // Upload brief if provided
      if (brief) {
        const path = `${user.id}/${Date.now()}-${brief.name}`
        const { error: uploadError } = await supabase.storage
          .from('briefs')
          .upload(path, brief, { upsert: false })
        if (!uploadError) {
          const { data } = supabase.storage.from('briefs').getPublicUrl(path)
          brief_url  = data.publicUrl
          brief_name = brief.name
        }
      }

      // Create job in Supabase
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          client_id:     user.id,
          title:         form.title.trim(),
          description:   form.description.trim(),
          category:      form.category,
          budget_min:    parseFloat(form.budget_min),
          budget_max:    parseFloat(form.budget_max),
          deadline:      form.deadline || null,
          status:        'open',
          brief_url,
          brief_name,
          skills_needed: form.skills_needed.length > 0 ? form.skills_needed : null,
        })
        .select()
        .single()

      if (jobError) throw jobError

      setStep(2)
    } catch (err) {
      setError(err.message || 'Failed to post job. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Redirect freelancers instantly — they find jobs, not post them
  useEffect(() => {
    if (!loading && isFreelancer) navigate('/jobs', { replace: true })
  }, [isFreelancer, loading])

  if (isFreelancer) return null

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${c.bg}`}>

      {/* Header */}
      <header className={`sticky top-0 z-20 flex items-center justify-between px-6 md:px-10 py-4 border-b ${c.border} ${c.card}`}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={`flex items-center gap-2 text-sm font-semibold ${c.light}`}>
            <ArrowLeft size={15}/> Dashboard
          </Link>
          <div className={`w-px h-4 ${isDark ? 'bg-[#2e2e2e]' : 'bg-[#e0e0e0]'}`}/>
          <div className="flex items-center gap-2">
            <Briefcase size={15} className={c.muted}/>
            <span className={`text-sm font-bold ${c.text}`}>Post a Job</span>
          </div>
        </div>
        {/* Step indicator */}
        {step < 2 && (
          <div className="flex items-center gap-2">
            {['Job Details', 'Preview'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all
                  ${i < step ? 'bg-green-500 text-white'
                    : i === step ? isDark ? 'bg-white text-[#0a0a0a]' : 'bg-[#0a0a0a] text-white'
                    : `${c.bgMid} ${c.muted}`}`}>
                  {i < step ? <CheckCircle size={12}/> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? c.text : c.muted}`}>{s}</span>
                {i < 1 && <div className={`w-6 h-px ${i < step ? 'bg-green-500' : c.border}`}/>}
              </div>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 px-4 md:px-10 py-10 max-w-2xl mx-auto w-full">

        {/* ── STEP 0 — Job Details ── */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className={`text-3xl font-extrabold tracking-tight ${c.text}`}>Post a Job</h1>
              <p className={`text-sm ${c.light} mt-1`}>
                All freelancers on Collectica will be notified. They'll reach out to chat with you.
              </p>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>
                Job Title *
              </label>
              <input type="text" placeholder="e.g. Brand Identity Design for Fintech Startup"
                value={form.title} onChange={e => set('title', e.target.value)}
                className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all ${c.input}`}/>
            </div>

            {/* Description */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>
                Job Description *
              </label>
              <textarea placeholder="Describe what you need done. Be specific — the clearer your brief, the better the proposals you'll receive."
                value={form.description} onChange={e => set('description', e.target.value)}
                rows={5}
                className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all resize-none ${c.input}`}/>
            </div>

            {/* Category */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>
                Category *
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => set('category', cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                      ${form.category === cat
                        ? 'bg-green-500 text-white border-green-500'
                        : `${c.border} ${c.light}`}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills needed */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>
                Skills Needed <span className={c.muted}>(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {['Figma', 'React', 'Node.js', 'Adobe Illustrator', 'Premiere Pro', 'Copywriting',
                  'WordPress', 'Python', 'Branding', 'Motion Graphics', 'Photography', 'SEO'].map(skill => (
                  <button key={skill} onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                      ${form.skills_needed.includes(skill)
                        ? 'bg-green-500/20 text-green-500 border-green-500/40'
                        : `${c.border} ${c.light}`}`}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>
                Budget Range (₦) *
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold ${c.muted}`}>₦</span>
                  <input type="number" placeholder="Min" value={form.budget_min}
                    onChange={e => set('budget_min', e.target.value)}
                    className={`w-full pl-8 pr-4 py-3.5 rounded-xl border text-sm outline-none transition-all ${c.input}`}/>
                </div>
                <span className={`text-sm font-bold ${c.muted}`}>–</span>
                <div className="relative flex-1">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold ${c.muted}`}>₦</span>
                  <input type="number" placeholder="Max" value={form.budget_max}
                    onChange={e => set('budget_max', e.target.value)}
                    className={`w-full pl-8 pr-4 py-3.5 rounded-xl border text-sm outline-none transition-all ${c.input}`}/>
                </div>
              </div>
              <p className={`text-xs mt-2 ${c.muted}`}>
                Freelancers will propose their price within this range
              </p>
            </div>

            {/* Duration + Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>
                  Expected Duration
                </label>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map(d => (
                    <button key={d.value} onClick={() => set('duration', d.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                        ${form.duration === d.value
                          ? 'bg-green-500 text-white border-green-500'
                          : `${c.border} ${c.light}`}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>
                  Deadline <span className={c.muted}>(optional)</span>
                </label>
                <input type="date" value={form.deadline}
                  onChange={e => set('deadline', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all ${c.input}`}/>
              </div>
            </div>

            {/* Brief upload */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>
                Attach Brief <span className={c.muted}>(optional — PDF, Word, or image)</span>
              </label>
              <input ref={fileRef} type="file" className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleBrief}/>
              {brief ? (
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${c.border} ${c.bgMid}`}>
                  <File size={16} className="text-green-500 flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${c.text}`}>{brief.name}</p>
                    <p className={`text-xs ${c.muted}`}>{(brief.size/1024/1024).toFixed(1)} MB</p>
                  </div>
                  <button onClick={() => setBrief(null)} className={c.muted}>
                    <X size={15}/>
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed ${c.border} transition-all
                    ${isDark ? 'hover:border-[#555]' : 'hover:border-[#aaa]'}`}>
                  <Upload size={16} className={c.muted}/>
                  <p className={`text-sm ${c.light}`}>Click to upload your brief or project document</p>
                </button>
              )}
              <p className={`text-xs mt-1.5 ${c.muted}`}>
                💡 Colle can read your brief document to help draft the contract
              </p>
            </div>

            <button onClick={() => { if (canPost()) setStep(1) }}
              disabled={!canPost()}
              className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${c.btn}`}>
              <ArrowRight size={15}/> Preview Job Post
            </button>
          </div>
        )}

        {/* ── STEP 1 — Preview ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className={`text-3xl font-extrabold tracking-tight ${c.text}`}>Preview</h1>
              <p className={`text-sm ${c.light} mt-1`}>This is what freelancers will see.</p>
            </div>

            {/* Job card preview */}
            <div className={`${c.card} border ${c.border} rounded-2xl overflow-hidden`}>
              <div className={`px-6 py-5 border-b ${c.border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/10 text-green-500">
                      {form.category}
                    </span>
                    <h2 className={`text-lg font-extrabold ${c.text} mt-2`}>{form.title}</h2>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-extrabold text-green-500">
                      ₦{parseFloat(form.budget_min).toLocaleString()} – ₦{parseFloat(form.budget_max).toLocaleString()}
                    </p>
                    {form.duration && (
                      <p className={`text-xs ${c.muted} mt-0.5`}>
                        {DURATIONS.find(d => d.value === form.duration)?.label}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                <p className={`text-sm ${c.light} leading-relaxed`}>{form.description}</p>
                {form.skills_needed.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.skills_needed.map(s => (
                      <span key={s} className={`text-xs px-2.5 py-1 rounded-full border ${c.border} ${c.light}`}>{s}</span>
                    ))}
                  </div>
                )}
                {brief && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${c.bgMid} border ${c.border}`}>
                    <File size={13} className="text-green-500"/>
                    <span className={`text-xs font-semibold ${c.text}`}>{brief.name}</span>
                    <span className={`text-xs ${c.muted} ml-auto`}>Brief attached</span>
                  </div>
                )}
                {form.deadline && (
                  <p className={`text-xs ${c.muted}`}>
                    📅 Deadline: {new Date(form.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Escrow note */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <Shield size={14} className="text-green-500 mt-0.5 flex-shrink-0"/>
              <div>
                <p className="text-xs font-bold text-green-500">How this works</p>
                <p className={`text-xs ${c.light} mt-1 leading-relaxed`}>
                  Freelancers will message you to discuss scope. Once you agree, Colle drafts the contract inside the chat. You both sign, then you fund the escrow from your wallet. Payment is released per milestone.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handlePost} disabled={loading}
                className={`flex-1 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${c.btn}`}>
                {loading
                  ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> Posting...</>
                  : <><Briefcase size={15}/> Post Job to All Freelancers</>}
              </button>
              <button onClick={() => setStep(0)}
                className={`px-5 py-4 rounded-xl border font-semibold text-sm transition-all ${c.btnGhost}`}>
                Edit
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 — Posted ── */}
        {step === 2 && (
          <div className="text-center space-y-6 py-10">
            <div className="text-6xl">🎉</div>
            <div>
              <h1 className={`text-3xl font-extrabold tracking-tight ${c.text} mb-2`}>Job Posted!</h1>
              <p className={`text-sm ${c.light} max-w-sm mx-auto`}>
                All freelancers on Collectica have been notified. Expect them to reach out in your Messages.
              </p>
            </div>
            <div className={`${c.card} border ${c.border} rounded-2xl p-5 text-left max-w-sm mx-auto`}>
              {[
                ['Job Title', form.title],
                ['Category', form.category],
                ['Budget', `₦${parseFloat(form.budget_min).toLocaleString()} – ₦${parseFloat(form.budget_max).toLocaleString()}`],
                ['Brief', brief ? brief.name : 'None attached'],
              ].map(([label, val]) => (
                <div key={label} className={`flex items-center justify-between py-2.5 border-b last:border-0 ${c.border}`}>
                  <span className={`text-xs font-bold ${c.muted}`}>{label}</span>
                  <span className={`text-xs font-semibold ${c.text} truncate max-w-[180px]`}>{val}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <Link to="/messages"
                className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all ${c.btn}`}>
                Go to Messages
              </Link>
              <Link to="/dashboard"
                className={`flex items-center gap-2 px-6 py-3.5 rounded-xl border font-semibold text-sm transition-all ${c.btnGhost}`}>
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
