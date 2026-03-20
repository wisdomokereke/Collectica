import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Shield, ArrowRight, ArrowLeft, Eye, EyeOff,
  Briefcase, User, CheckCircle, Sparkles, Lock
} from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth, ROLES } from '../lib/AuthContext'

// ── Feature highlights shown per step ─────────────────────
const FEATURES = [
  {
    emoji: '🤝',
    title: 'Your deals, protected.',
    body: 'Collectica holds payment in escrow and only releases it when work is confirmed done. No more ghosting. No more scams.',
  },
  {
    emoji: '⚖️',
    title: 'Colle — your AI lawyer.',
    body: 'Colle lives inside every chat. It reads your conversation and drafts a legal contract in seconds — no legal degree required.',
  },
  {
    emoji: '🔐',
    title: 'Sign with your key.',
    body: 'Every user gets a unique signing identity. Contracts are locked the moment both parties sign — tamper-proof and verifiable.',
  },
  {
    emoji: '📊',
    title: 'Build your financial identity.',
    body: 'Every completed contract builds your trust score — a verified record of your work that no bank or client can ignore.',
  },
  {
    emoji: '💰',
    title: 'Milestone payments.',
    body: 'Break big projects into milestones. Clients fund each stage. Freelancers get paid as they deliver. Everyone stays safe.',
  },
]

const SKILLS = [
  'Graphic Design','UI/UX Design','Web Development','Mobile Development',
  'Copywriting','Content Writing','Video Editing','Motion Graphics',
  'Social Media Management','Photography','Branding','SEO','Data Analysis',
  'Virtual Assistant','Voiceover','Translation','3D Modeling','Animation',
]

const CATEGORIES = [
  'Technology','Creative & Design','Marketing','Writing & Content',
  'Business','Finance','Legal','Education','Other',
]

function FeaturePanel({ step, isDark }) {
  const f = FEATURES[Math.min(step, FEATURES.length - 1)]
  return (
    <div className={`hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-14
      ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#1a1a2e]'}`}>
      <div className="flex items-center gap-2">
        <Shield size={18} className="text-[#4F46E5]"/>
        <span className="text-white font-extrabold text-lg tracking-tight">Collectica</span>
      </div>
      <div className="space-y-5">
        <div className="text-5xl">{f.emoji}</div>
        <h2 className="text-2xl font-extrabold text-white leading-snug">{f.title}</h2>
        <p className="text-[#8080a0] text-sm leading-relaxed">{f.body}</p>
        {/* Step dots */}
        <div className="flex gap-2 pt-4">
          {FEATURES.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500
              ${i === Math.min(step, FEATURES.length - 1) ? 'w-6 bg-[#4F46E5]' : 'w-1.5 bg-[#333]'}`}/>
          ))}
        </div>
      </div>
      <p className="text-[#444] text-xs">Trusted by freelancers across Africa</p>
    </div>
  )
}

export default function Onboarding() {
  const { theme, toggle } = useTheme()
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const [step, setStep]             = useState(0) // 0=role, 1=identity, 2=profile, 3=signing key, 4=done
  const [role, setRole]             = useState('')
  const [formData, setFormData]     = useState({
    full_name: '', email: '', password: '',
    skills: [], portfolio_url: '',
    company_name: '', category: '',
  })
  const [showPw, setShowPw]         = useState(false)
  const [pin, setPin]               = useState('')
  const [signingKey, setSigningKey] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const c = {
    bg:     isDark ? 'bg-[#0a0a0a]'     : 'bg-[#f8f8f8]',
    card:   isDark ? 'bg-[#111]'        : 'bg-white',
    bgMid:  isDark ? 'bg-[#1a1a1a]'     : 'bg-[#f0f0f0]',
    border: isDark ? 'border-[#2e2e2e]' : 'border-[#e0e0e0]',
    text:   isDark ? 'text-white'       : 'text-[#0a0a0a]',
    muted:  isDark ? 'text-[#555]'      : 'text-[#aaa]',
    light:  isDark ? 'text-[#888]'      : 'text-[#666]',
    input:  isDark
      ? 'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e] focus:border-white'
      : 'bg-white text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0] focus:border-[#0a0a0a]',
    btnPrim: isDark ? 'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]' : 'bg-[#0a0a0a] text-white hover:bg-[#222]',
    btnGhost: isDark ? 'border-[#2e2e2e] text-[#888] hover:text-white' : 'border-[#e0e0e0] text-[#666] hover:text-[#0a0a0a]',
  }

  const set = (field, val) => setFormData(f => ({ ...f, [field]: val }))

  const toggleSkill = (skill) => {
    setFormData(f => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter(s => s !== skill)
        : f.skills.length < 5 ? [...f.skills, skill] : f.skills
    }))
  }

  const generateKey = () => {
    const key = 'COL-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      + '-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    setSigningKey(key)
  }

  const handleSignup = async () => {
    setError('')
    if (!pin || pin.length !== 6) { setError('Please enter a 6-digit PIN'); return }
    if (!signingKey) { setError('Please generate your signing key first'); return }
    setLoading(true)
    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role,
        skills: formData.skills,
        portfolio_url: formData.portfolio_url || null,
        company_name: formData.company_name || null,
        signing_key: signingKey,
      })
      setStep(4) // success screen
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 0) return !!role
    if (step === 1) return formData.full_name.trim() && formData.email.trim() && formData.password.length >= 6
    if (step === 2) return role === ROLES.FREELANCER ? formData.skills.length > 0 : !!formData.company_name.trim() || true
    return true
  }

  const next = () => {
    setError('')
    if (step === 3) { handleSignup(); return }
    setStep(s => s + 1)
  }
  const back = () => { setError(''); setStep(s => s - 1) }

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${c.bg}`}>
      <FeaturePanel step={step} isDark={isDark}/>

      {/* Main form panel */}
      <div className={`flex-1 flex flex-col ${c.card}`}>
        {/* Top bar */}
        <div className={`flex items-center justify-between px-8 py-5 border-b ${c.border}`}>
          <div className="flex items-center gap-2 lg:hidden">
            <Shield size={16} className="text-[#4F46E5]"/>
            <span className={`font-extrabold text-sm ${c.text}`}>Collectica</span>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            {step > 0 && step < 4 && (
              <button onClick={back} className={`flex items-center gap-1.5 text-sm font-semibold ${c.light}`}>
                <ArrowLeft size={14}/> Back
              </button>
            )}
          </div>
          {/* Progress dots */}
          {step < 4 && (
            <div className="flex items-center gap-2 mx-auto lg:mx-0">
              {[0,1,2,3].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500
                  ${i < step ? 'w-4 bg-[#4F46E5]' : i === step ? 'w-6 bg-[#4F46E5]' : `w-1.5 ${isDark ? 'bg-[#2e2e2e]' : 'bg-[#ddd]'}`}`}/>
              ))}
            </div>
          )}
          <button onClick={toggle}
            className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm
              ${isDark ? 'border-[#2e2e2e] bg-[#1a1a1a]' : 'border-[#e0e0e0] bg-[#f0f0f0]'}`}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 py-10 max-w-md mx-auto w-full">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* ── STEP 0 — Role ── */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Step 1 of 4</p>
                <h1 className={`text-3xl font-extrabold tracking-tight ${c.text} mb-1`}>How will you use Collectica?</h1>
                <p className={`text-sm ${c.light}`}>Your role shapes your entire experience.</p>
              </div>
              <div className="space-y-3">
                {[
                  { r: ROLES.FREELANCER, icon: <User size={22}/>, title: 'I am a Freelancer', desc: 'Find jobs, sign contracts, get paid safely through escrow.' },
                  { r: ROLES.CLIENT,     icon: <Briefcase size={22}/>, title: 'I am a Client', desc: 'Post jobs, hire talent, pay with full milestone protection.' },
                ].map(opt => (
                  <button key={opt.r} onClick={() => setRole(opt.r)}
                    className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all
                      ${role === opt.r
                        ? 'border-[#4F46E5] bg-[#4F46E5]/5'
                        : `${c.border} ${isDark ? 'hover:border-[#555]' : 'hover:border-[#aaa]'}`}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                      ${role === opt.r ? 'bg-[#4F46E5] text-white' : `${c.bgMid} ${c.light}`}`}>
                      {opt.icon}
                    </div>
                    <div>
                      <p className={`font-bold ${c.text}`}>{opt.title}</p>
                      <p className={`text-sm ${c.light} mt-0.5`}>{opt.desc}</p>
                    </div>
                    {role === opt.r && <CheckCircle size={18} className="text-[#4F46E5] ml-auto flex-shrink-0 mt-1"/>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 1 — Identity ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Step 2 of 4</p>
                <h1 className={`text-3xl font-extrabold tracking-tight ${c.text} mb-1`}>Create your account</h1>
                <p className={`text-sm ${c.light}`}>This is how you'll sign in every time.</p>
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Full Name</label>
                <input type="text" placeholder="Ade Okonkwo" value={formData.full_name}
                  onChange={e => set('full_name', e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all ${c.input}`}/>
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Email</label>
                <input type="email" placeholder="you@example.com" value={formData.email}
                  onChange={e => set('email', e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all ${c.input}`}/>
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
                    value={formData.password} onChange={e => set('password', e.target.value)}
                    className={`w-full pl-4 pr-12 py-3.5 rounded-xl border text-sm outline-none transition-all ${c.input}`}/>
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${c.muted}`}>
                    {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 — Profile ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Step 3 of 4</p>
                <h1 className={`text-3xl font-extrabold tracking-tight ${c.text} mb-1`}>
                  {role === ROLES.FREELANCER ? 'Your skills' : 'Your business'}
                </h1>
                <p className={`text-sm ${c.light}`}>
                  Hi {formData.full_name.split(' ')[0] || 'there'} 👋{' '}
                  {role === ROLES.FREELANCER
                    ? 'Pick up to 5 skills — clients will find you by these.'
                    : 'Tell us a bit about what you do.'}
                </p>
              </div>

              {role === ROLES.FREELANCER ? (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map(skill => (
                      <button key={skill} onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                          ${formData.skills.includes(skill)
                            ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                            : `${c.border} ${c.light} ${isDark ? 'hover:border-[#555]' : 'hover:border-[#aaa]'}`}`}>
                        {skill}
                      </button>
                    ))}
                  </div>
                  {formData.skills.length > 0 && (
                    <p className={`text-xs mt-3 ${c.muted}`}>{formData.skills.length}/5 selected</p>
                  )}
                  <div className="mt-4">
                    <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Portfolio URL (optional)</label>
                    <input type="url" placeholder="https://yourportfolio.com" value={formData.portfolio_url}
                      onChange={e => set('portfolio_url', e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all ${c.input}`}/>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Company / Business Name (optional)</label>
                    <input type="text" placeholder="TechFlow Nigeria" value={formData.company_name}
                      onChange={e => set('company_name', e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all ${c.input}`}/>
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>What do you mainly hire for?</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => set('category', cat)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                            ${formData.category === cat
                              ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                              : `${c.border} ${c.light}`}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3 — Signing Key ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Step 4 of 4</p>
                <h1 className={`text-3xl font-extrabold tracking-tight ${c.text} mb-1`}>Your signing key</h1>
                <p className={`text-sm ${c.light}`}>
                  Every contract you sign uses this key. Think of it like a digital signature — unique to you forever.
                </p>
              </div>
              <div className={`p-5 rounded-2xl border-2 border-dashed ${c.border} space-y-3`}>
                {signingKey ? (
                  <>
                    <p className={`text-xs font-bold uppercase tracking-widest ${c.muted}`}>Your Key</p>
                    <p className="text-xl font-extrabold text-[#4F46E5] tracking-widest font-mono">{signingKey}</p>
                    <p className={`text-xs ${c.muted}`}>Save this somewhere safe. You'll need your PIN to sign contracts.</p>
                  </>
                ) : (
                  <button onClick={generateKey}
                    className="w-full py-3 rounded-xl text-sm font-bold border border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5]/10 transition-all flex items-center justify-center gap-2">
                    <Sparkles size={14}/> Generate My Signing Key
                  </button>
                )}
              </div>
              {signingKey && (
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>
                    Create a 6-digit PIN to protect your key
                  </label>
                  <input type="password" inputMode="numeric" maxLength={6}
                    placeholder="••••••" value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none tracking-[0.5em] text-center font-bold transition-all ${c.input}`}/>
                  <p className={`text-xs mt-2 ${c.muted}`}>
                    <Lock size={10} className="inline mr-1"/>
                    Your PIN is never stored as plain text.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4 — Success ── */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="text-6xl">🎉</div>
              <div>
                <h1 className={`text-3xl font-extrabold tracking-tight ${c.text} mb-2`}>
                  Welcome, {formData.full_name.split(' ')[0]}!
                </h1>
                <p className={`text-sm ${c.light}`}>
                  Your account is ready. Colle is waiting to help you close your first deal.
                </p>
              </div>
              <div className={`${c.bgMid} border ${c.border} rounded-2xl p-5 text-left space-y-2`}>
                {[
                  ['Role', role === ROLES.FREELANCER ? '🧑‍💻 Freelancer' : '💼 Client'],
                  ['Name', formData.full_name],
                  ['Email', formData.email],
                  ['Signing Key', signingKey],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b last:border-0"
                    style={{ borderColor: isDark ? '#2e2e2e' : '#e8e8e8' }}>
                    <span className={`text-xs font-bold ${c.muted}`}>{label}</span>
                    <span className={`text-xs font-semibold ${c.text} font-mono`}>{val}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/dashboard')}
                className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${c.btnPrim}`}>
                <ArrowRight size={15}/> Go to my Dashboard
              </button>
            </div>
          )}

          {/* Nav buttons */}
          {step < 4 && (
            <div className="mt-8 flex flex-col gap-3">
              <button onClick={next} disabled={!canProceed() || loading}
                className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${c.btnPrim}`}>
                {loading
                  ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> Creating account...</>
                  : step === 3
                    ? <><Shield size={15}/> Create my account</>
                    : <><ArrowRight size={15}/> Continue</>}
              </button>
              {step > 0 && (
                <button onClick={back} className={`w-full py-3 rounded-xl border text-sm font-semibold transition-all ${c.btnGhost}`}>
                  <ArrowLeft size={14} className="inline mr-1.5"/> Back
                </button>
              )}
            </div>
          )}

          {step === 0 && (
            <p className={`text-center text-sm mt-6 ${c.light}`}>
              Already have an account?{' '}
              <Link to="/login" className="text-[#4F46E5] font-semibold hover:underline">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
