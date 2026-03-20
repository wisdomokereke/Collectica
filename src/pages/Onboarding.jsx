import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Shield, ArrowRight, ArrowLeft, Eye, EyeOff,
  Briefcase, User, CheckCircle, Sparkles, Lock,
  Wallet, Star, Copy, RefreshCw
} from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth, ROLES } from '../lib/AuthContext'

// ── Steps config ───────────────────────────────────────────
const STEPS = [
  { id: 0, label: 'Role' },
  { id: 1, label: 'Identity' },
  { id: 2, label: 'Profile' },
  { id: 3, label: 'Wallet' },
  { id: 4, label: 'Signing Key' },
  { id: 5, label: 'Welcome' },
]

// ── Feature panel content per step ────────────────────────
const PANELS = {
  freelancer: [
    {
      emoji: '🧑‍💻',
      tag: 'For Freelancers',
      title: 'Get paid.\nEvery time.',
      body: 'Collectica holds your client\'s money before you start. The moment work is confirmed, it\'s yours. No more chasing invoices.',
      stats: [
        { value: '0%', label: 'Payment disputes' },
        { value: '100%', label: 'Contract protection' },
      ],
    },
    {
      emoji: '🔐',
      tag: 'Your Identity',
      title: 'One account.\nYour whole career.',
      body: 'Your Collectica profile is your verified work history. Every contract you complete builds a trust record no client can question.',
      stats: [
        { value: 'Real', label: 'Verified reviews' },
        { value: 'Yours', label: 'Permanent record' },
      ],
    },
    {
      emoji: '🎯',
      tag: 'Your Skills',
      title: 'Be found by\nthe right clients.',
      body: 'Clients search by skill. The more specific you are, the better the match. Pick what you\'re best at — not everything.',
      stats: [
        { value: '5', label: 'Skills max' },
        { value: 'Smart', label: 'Matching' },
      ],
    },
    {
      emoji: '💰',
      tag: 'Escrow Wallet',
      title: 'Your money.\nSafe and instant.',
      body: 'When a milestone is approved, payment lands in your Collectica wallet immediately. Withdraw to your bank anytime.',
      stats: [
        { value: 'Instant', label: 'On approval' },
        { value: 'Anytime', label: 'Withdrawal' },
      ],
    },
    {
      emoji: '✍️',
      tag: 'Digital Signing',
      title: 'Your signature.\nYour protection.',
      body: 'Your signing key is unique to you forever. When you sign a contract, it\'s legally binding and tamper-proof. No one can forge it.',
      stats: [
        { value: 'Unique', label: 'To you only' },
        { value: 'Locked', label: 'Once signed' },
      ],
    },
  ],
  client: [
    {
      emoji: '💼',
      tag: 'For Clients',
      title: 'Hire with\nconfidence.',
      body: 'Your money stays in Collectica until the work is done exactly as agreed. You approve every milestone before a single naira moves.',
      stats: [
        { value: '100%', label: 'Scam protection' },
        { value: '0', label: 'Upfront risk' },
      ],
    },
    {
      emoji: '🔐',
      tag: 'Your Identity',
      title: 'One account.\nEvery project.',
      body: 'Your Collectica profile holds every contract you\'ve ever created. Freelancers can see your track record — building trust both ways.',
      stats: [
        { value: 'Real', label: 'Verified profile' },
        { value: 'Clear', label: 'Project history' },
      ],
    },
    {
      emoji: '📋',
      tag: 'Your Business',
      title: 'Post jobs.\nHire the best.',
      body: 'Tell freelancers what you do and what you need. The clearer your profile, the better the talent that comes to you.',
      stats: [
        { value: 'Fast', label: 'Talent match' },
        { value: 'Verified', label: 'Freelancers only' },
      ],
    },
    {
      emoji: '🏦',
      tag: 'Escrow Wallet',
      title: 'Fund once.\nPay in stages.',
      body: 'Deposit into your Collectica wallet. Lock funds per contract. Release payment milestone by milestone as work gets done.',
      stats: [
        { value: 'Staged', label: 'Payments' },
        { value: 'Full', label: 'Control' },
      ],
    },
    {
      emoji: '✍️',
      tag: 'Digital Signing',
      title: 'Sign contracts\nlike a pro.',
      body: 'Your signing key makes every contract legally binding in seconds. No lawyers, no paperwork — just two parties and a clear agreement.',
      stats: [
        { value: 'Binding', label: 'Instantly' },
        { value: 'No', label: 'Lawyers needed' },
      ],
    },
  ],
}

const SKILLS = [
  'Graphic Design', 'UI/UX Design', 'Web Development', 'Mobile Development',
  'Copywriting', 'Content Writing', 'Video Editing', 'Motion Graphics',
  'Social Media Management', 'Photography', 'Branding', 'SEO',
  'Data Analysis', 'Virtual Assistant', 'Voiceover', 'Translation',
  '3D Modeling', 'Animation',
]

const CATEGORIES = [
  'Technology', 'Creative & Design', 'Marketing', 'Writing & Content',
  'Business', 'Finance', 'Legal', 'Education', 'Other',
]

// ── Illustrated feature panel ──────────────────────────────
function FeaturePanel({ step, role, isDark }) {
  const panels = role === ROLES.CLIENT ? PANELS.client : PANELS.freelancer
  const panelIndex = Math.max(0, Math.min(step - 1, panels.length - 1))
  const p = step === 0 ? null : panels[panelIndex]

  if (step === 0) {
    return (
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-[#0a0a0a] p-14">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-green-500" />
          <span className="text-white font-extrabold text-lg tracking-tight">Collectica</span>
        </div>
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="text-5xl">🛡️</div>
            <h2 className="text-3xl font-extrabold text-white leading-snug">
              Trust between<br />
              <span className="text-green-500">every deal.</span>
            </h2>
            <p className="text-[#666] text-sm leading-relaxed">
              Collectica is the contract-first freelance platform built for Africa. Every deal is protected, every payment is guaranteed, every contract is enforced by AI.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: 'Escrow', l: 'Protected payments' },
              { v: 'AI', l: 'Contract drafting' },
              { v: 'Trust', l: 'Score system' },
              { v: 'Git', l: 'Style contracts' },
            ].map(item => (
              <div key={item.l} className="bg-[#111] border border-[#2e2e2e] rounded-xl p-3">
                <p className="text-green-500 font-extrabold text-sm">{item.v}</p>
                <p className="text-[#555] text-xs mt-0.5">{item.l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[#333] text-xs">Built for African freelancers & clients</p>
      </div>
    )
  }

  if (step === 5) {
    return (
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-[#0a0a0a] p-14">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-green-500" />
          <span className="text-white font-extrabold text-lg tracking-tight">Collectica</span>
        </div>
        <div className="space-y-6">
          <div className="text-5xl">🎉</div>
          <div>
            <h2 className="text-3xl font-extrabold text-white leading-snug mb-3">
              You're ready<br />to <span className="text-green-500">collect.</span>
            </h2>
            <p className="text-[#666] text-sm leading-relaxed">
              Your account is set up. Colle is waiting to help you close your first deal.
            </p>
          </div>
          <div className="space-y-2">
            {[
              '✅ Account created',
              '✅ Profile saved to database',
              '✅ Signing key generated',
              '✅ Wallet ready',
              '🚀 Dashboard waiting',
            ].map(item => (
              <p key={item} className="text-sm text-[#666] font-medium">{item}</p>
            ))}
          </div>
        </div>
        <p className="text-[#333] text-xs">Welcome to Collectica</p>
      </div>
    )
  }

  return (
    <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-[#0a0a0a] p-14">
      <div className="flex items-center gap-2">
        <Shield size={18} className="text-green-500" />
        <span className="text-white font-extrabold text-lg tracking-tight">Collectica</span>
      </div>
      <div className="space-y-6">
        <div className="text-5xl">{p.emoji}</div>
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-green-500">{p.tag}</span>
          <h2 className="text-3xl font-extrabold text-white leading-snug mt-2 whitespace-pre-line">
            {p.title}
          </h2>
        </div>
        <p className="text-[#666] text-sm leading-relaxed">{p.body}</p>
        <div className="grid grid-cols-2 gap-3 pt-2">
          {p.stats.map(s => (
            <div key={s.label} className="bg-[#111] border border-[#2e2e2e] rounded-xl p-4">
              <p className="text-green-500 font-extrabold text-xl">{s.value}</p>
              <p className="text-[#555] text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Step dots */}
      <div className="flex gap-2">
        {STEPS.slice(0, 5).map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-500
            ${i === step - 1 ? 'w-8 bg-green-500' : i < step - 1 ? 'w-4 bg-green-500/40' : 'w-4 bg-[#2e2e2e]'}`} />
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
export default function Onboarding() {
  const { theme, toggle } = useTheme()
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const [step, setStep] = useState(0)
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
    skills: [], portfolio_url: '',
    company_name: '', category: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [signingKey, setSigningKey] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  const c = {
    bg: isDark ? 'bg-[#0a0a0a]' : 'bg-[#f8f8f8]',
    card: isDark ? 'bg-[#111]' : 'bg-white',
    bgMid: isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]',
    border: isDark ? 'border-[#2e2e2e]' : 'border-[#e0e0e0]',
    text: isDark ? 'text-white' : 'text-[#0a0a0a]',
    muted: isDark ? 'text-[#555]' : 'text-[#aaa]',
    light: isDark ? 'text-[#888]' : 'text-[#666]',
    input: isDark
      ? 'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e] focus:border-white'
      : 'bg-white text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0] focus:border-[#0a0a0a]',
    btnPrim: isDark ? 'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]' : 'bg-[#0a0a0a] text-white hover:bg-[#222]',
    btnGhost: isDark ? 'border-[#2e2e2e] text-[#888] hover:text-white' : 'border-[#e0e0e0] text-[#666] hover:text-[#0a0a0a]',
  }

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const toggleSkill = (skill) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter(s => s !== skill)
        : f.skills.length < 5 ? [...f.skills, skill] : f.skills
    }))
  }

  const generateKey = () => {
    const key = 'COL-' +
      Math.random().toString(36).substring(2, 7).toUpperCase() + '-' +
      Math.random().toString(36).substring(2, 7).toUpperCase() + '-' +
      Math.random().toString(36).substring(2, 7).toUpperCase()
    setSigningKey(key)
  }

  const copyKey = () => {
    navigator.clipboard.writeText(signingKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canProceed = () => {
    if (step === 0) return !!role
    if (step === 1) return form.full_name.trim() && form.email.trim() && form.password.length >= 6
    if (step === 2) return true // profile is optional
    if (step === 3) return true // wallet explainer — just read
    if (step === 4) return signingKey && pin.length === 6 && pin === confirmPin
    return true
  }

  const handleNext = async () => {
    setError('')
    if (step === 4) {
      // Final step — create account
      setLoading(true)
      try {
        await signUp({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role,
          skills: form.skills.length > 0 ? form.skills : null,
          portfolio_url: form.portfolio_url || null,
          company_name: form.company_name || null,
          signing_key: signingKey,
          location: null,
        })
        setStep(5)
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
      return
    }
    setStep(s => s + 1)
  }

  const handleBack = () => { setError(''); setStep(s => s - 1) }

  const firstName = form.full_name.split(' ')[0] || 'there'

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${c.bg}`}>
      <FeaturePanel step={step} role={role} isDark={isDark} />

      {/* ── Right panel ── */}
      <div className={`flex-1 flex flex-col min-h-screen ${c.card}`}>

        {/* Top bar */}
        <div className={`flex items-center justify-between px-8 py-5 border-b ${c.border}`}>
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <Shield size={16} className="text-green-500" />
            <span className={`font-extrabold text-sm ${c.text}`}>Collectica</span>
          </div>

          {/* Progress bar */}
          {step < 5 && (
            <div className="flex items-center gap-2 mx-auto lg:mx-0">
              {STEPS.slice(0, 5).map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all
                    ${i < step ? 'bg-green-500 text-white' : i === step ? `${isDark ? 'bg-white text-[#0a0a0a]' : 'bg-[#0a0a0a] text-white'}` : `${c.bgMid} ${c.muted}`}`}>
                    {i < step ? <CheckCircle size={12} /> : i + 1}
                  </div>
                  {i < 4 && <div className={`w-6 h-px ${i < step ? 'bg-green-500' : c.border}`} />}
                </div>
              ))}
            </div>
          )}

          <button onClick={toggle}
            className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm ml-auto
              ${isDark ? 'border-[#2e2e2e] bg-[#1a1a1a]' : 'border-[#e0e0e0] bg-[#f0f0f0]'}`}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col justify-center px-8 py-10 w-full max-w-md mx-auto">

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* ── STEP 0 — Role ── */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest text-green-500 mb-2`}>Step 1 of 5</p>
                <h1 className={`text-3xl font-extrabold tracking-tight ${c.text} mb-1`}>How will you use Collectica?</h1>
                <p className={`text-sm ${c.light}`}>Your role shapes your entire experience on the platform.</p>
              </div>
              <div className="space-y-3">
                {[
                  {
                    r: ROLES.FREELANCER,
                    icon: <User size={24} />,
                    title: "I'm a Freelancer",
                    desc: 'Find jobs, sign contracts, get paid safely every time.',
                    perks: ['Protected payments', 'AI contract drafting', 'Trust score'],
                  },
                  {
                    r: ROLES.CLIENT,
                    icon: <Briefcase size={24} />,
                    title: "I'm a Client",
                    desc: 'Post jobs, hire talent, pay only when work is done.',
                    perks: ['Escrow protection', 'Milestone control', 'Verified talent'],
                  },
                ].map(opt => (
                  <button key={opt.r} onClick={() => setRole(opt.r)}
                    className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all
                      ${role === opt.r
                        ? 'border-green-500 bg-green-500/5'
                        : `${c.border} ${isDark ? 'hover:border-[#555]' : 'hover:border-[#999]'}`}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                      ${role === opt.r ? 'bg-green-500 text-white' : `${c.bgMid} ${c.light}`}`}>
                      {opt.icon}
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold ${c.text} mb-0.5`}>{opt.title}</p>
                      <p className={`text-sm ${c.light} mb-2`}>{opt.desc}</p>
                      <div className="flex gap-2 flex-wrap">
                        {opt.perks.map(p => (
                          <span key={p} className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${role === opt.r ? 'bg-green-500/20 text-green-500' : `${c.bgMid} ${c.muted}`}`}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                    {role === opt.r && <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-1" />}
                  </button>
                ))}
              </div>
              <p className={`text-center text-sm ${c.light}`}>
                Already have an account?{' '}
                <Link to="/login" className="text-green-500 font-semibold hover:underline">Sign in</Link>
              </p>
            </div>
          )}

          {/* ── STEP 1 — Identity ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-green-500 mb-2">Step 2 of 5</p>
                <h1 className={`text-3xl font-extrabold tracking-tight ${c.text} mb-1`}>Create your account</h1>
                <p className={`text-sm ${c.light}`}>This is how you'll sign in to Collectica every time.</p>
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Full Name</label>
                <input type="text" placeholder="Ade Okonkwo" value={form.full_name}
                  onChange={e => set('full_name', e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all ${c.input}`} />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Email Address</label>
                <input type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all ${c.input}`} />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} placeholder="Minimum 6 characters"
                    value={form.password} onChange={e => set('password', e.target.value)}
                    className={`w-full pl-4 pr-12 py-3.5 rounded-xl border text-sm outline-none transition-all ${c.input}`} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${c.muted}`}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {form.password.length > 0 && form.password.length < 6 && (
                  <p className="text-xs text-red-400 mt-1">Password must be at least 6 characters</p>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2 — Profile ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-green-500 mb-2">Step 3 of 5</p>
                <h1 className={`text-3xl font-extrabold tracking-tight ${c.text} mb-1`}>
                  {role === ROLES.FREELANCER ? 'Your skills' : 'Your business'}
                </h1>
                <p className={`text-sm ${c.light}`}>
                  Hey {firstName} 👋{' '}
                  {role === ROLES.FREELANCER
                    ? 'Pick up to 5 skills. Clients search by these — be specific.'
                    : 'Tell clients what kind of work you hire for.'}
                </p>
              </div>
              {role === ROLES.FREELANCER ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map(skill => (
                      <button key={skill} onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                          ${form.skills.includes(skill)
                            ? 'bg-green-500 text-white border-green-500'
                            : `${c.border} ${c.light} ${isDark ? 'hover:border-[#555]' : 'hover:border-[#aaa]'}`}`}>
                        {skill}
                      </button>
                    ))}
                  </div>
                  {form.skills.length > 0 && (
                    <p className={`text-xs ${c.muted}`}>{form.skills.length}/5 selected</p>
                  )}
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Portfolio URL <span className={c.muted}>(optional)</span></label>
                    <input type="url" placeholder="https://yourportfolio.com" value={form.portfolio_url}
                      onChange={e => set('portfolio_url', e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all ${c.input}`} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Company / Business Name <span className={c.muted}>(optional)</span></label>
                    <input type="text" placeholder="TechFlow Nigeria" value={form.company_name}
                      onChange={e => set('company_name', e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all ${c.input}`} />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>What do you mainly hire for?</label>
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
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3 — Wallet Explainer ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-green-500 mb-2">Step 4 of 5</p>
                <h1 className={`text-3xl font-extrabold tracking-tight ${c.text} mb-1`}>Your Collectica Wallet</h1>
                <p className={`text-sm ${c.light}`}>
                  Every user gets a built-in wallet. Here's how it works for you as a {role}.
                </p>
              </div>
              <div className={`${c.bgMid} border ${c.border} rounded-2xl p-5`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <Wallet size={18} className="text-green-500" />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${c.text}`}>Wallet Balance</p>
                    <p className="text-2xl font-extrabold text-green-500">₦0.00</p>
                  </div>
                </div>
                <div className={`h-px ${isDark ? 'bg-[#2e2e2e]' : 'bg-[#e0e0e0]'} mb-4`} />
                <div className="space-y-3">
                  {role === ROLES.CLIENT ? [
                    { icon: '💳', title: 'Deposit funds', desc: 'Add money to your wallet anytime' },
                    { icon: '🔒', title: 'Lock per contract', desc: 'Funds are held safely in escrow' },
                    { icon: '✅', title: 'Release on approval', desc: 'You control when freelancers get paid' },
                    { icon: '↩️', title: 'Full refund protection', desc: 'Unused funds return to your wallet' },
                  ] : [
                    { icon: '👀', title: 'See escrow balance', desc: 'Know exactly what\'s waiting for you' },
                    { icon: '⚡', title: 'Instant on approval', desc: 'Payment lands the moment client approves' },
                    { icon: '🏦', title: 'Withdraw anytime', desc: 'Transfer to your bank whenever you want' },
                    { icon: '📊', title: 'Full earning history', desc: 'Every naira tracked and recorded' },
                  ].map(item => (
                    <div key={item.title} className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0">{item.icon}</span>
                      <div>
                        <p className={`text-sm font-bold ${c.text}`}>{item.title}</p>
                        <p className={`text-xs ${c.muted}`}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-green-500/5 border border-green-500/20">
                <Shield size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-green-600 leading-relaxed font-medium">
                  Collectica never holds your money indefinitely. Every naira is traceable, protected, and always moves with your consent.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 4 — Signing Key ── */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-green-500 mb-2">Step 5 of 5</p>
                <h1 className={`text-3xl font-extrabold tracking-tight ${c.text} mb-1`}>Your signing key</h1>
                <p className={`text-sm ${c.light}`}>
                  This key is your digital identity on Collectica. Every contract you sign uses it. Keep it safe.
                </p>
              </div>

              {/* Generate key */}
              <div className={`rounded-2xl border-2 border-dashed ${signingKey ? 'border-green-500/40' : c.border} p-5 space-y-3`}>
                {signingKey ? (
                  <>
                    <p className={`text-xs font-bold uppercase tracking-widest ${c.muted}`}>Your Unique Signing Key</p>
                    <p className="text-lg font-extrabold text-green-500 tracking-widest font-mono break-all">{signingKey}</p>
                    <div className="flex gap-2">
                      <button onClick={copyKey}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all
                          ${isDark ? 'border-[#2e2e2e] text-[#888] hover:text-white' : 'border-[#e0e0e0] text-[#666] hover:text-[#0a0a0a]'}`}>
                        <Copy size={11} /> {copied ? 'Copied!' : 'Copy key'}
                      </button>
                      <button onClick={generateKey}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all
                          ${isDark ? 'border-[#2e2e2e] text-[#888] hover:text-white' : 'border-[#e0e0e0] text-[#666] hover:text-[#0a0a0a]'}`}>
                        <RefreshCw size={11} /> Regenerate
                      </button>
                    </div>
                    <p className={`text-xs ${c.muted}`}>⚠️ Save this somewhere safe — you'll need it to sign contracts.</p>
                  </>
                ) : (
                  <button onClick={generateKey}
                    className="w-full py-3 rounded-xl text-sm font-bold border border-green-500/30 text-green-500 hover:bg-green-500/10 transition-all flex items-center justify-center gap-2">
                    <Sparkles size={14} /> Generate My Signing Key
                  </button>
                )}
              </div>

              {/* PIN */}
              {signingKey && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>
                      Create a 6-digit PIN to protect your key
                    </label>
                    <input
                      type="password" inputMode="numeric" maxLength={6}
                      placeholder="• • • • • •" value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none tracking-[0.8em] text-center font-bold transition-all ${c.input}`} />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>
                      Confirm PIN
                    </label>
                    <input
                      type="password" inputMode="numeric" maxLength={6}
                      placeholder="• • • • • •" value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none tracking-[0.8em] text-center font-bold transition-all
                        ${confirmPin.length === 6 && confirmPin !== pin ? 'border-red-500/50' : c.input}`} />
                    {confirmPin.length === 6 && confirmPin !== pin && (
                      <p className="text-xs text-red-400 mt-1">PINs do not match</p>
                    )}
                    {confirmPin.length === 6 && confirmPin === pin && (
                      <p className="text-xs text-green-500 mt-1">✓ PINs match</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/20">
                    <Lock size={11} className="text-green-500 flex-shrink-0" />
                    <p className="text-xs text-green-600 font-medium">Your PIN is stored securely and never shown again.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 5 — Welcome ── */}
          {step === 5 && (
            <div className="text-center space-y-6">
              <div className="text-6xl">🎉</div>
              <div>
                <h1 className={`text-3xl font-extrabold tracking-tight ${c.text} mb-2`}>
                  Welcome, {firstName}!
                </h1>
                <p className={`text-sm ${c.light}`}>
                  Your account is live. Colle is ready to help you close your first deal.
                </p>
              </div>
              <div className={`${c.bgMid} border ${c.border} rounded-2xl p-5 text-left space-y-0`}>
                {[
                  ['Name', form.full_name],
                  ['Role', role === ROLES.FREELANCER ? '🧑‍💻 Freelancer' : '💼 Client'],
                  ['Email', form.email],
                  ['Signing Key', signingKey],
                ].map(([label, val]) => (
                  <div key={label} className={`flex items-center justify-between py-3 border-b last:border-0 ${c.border}`}>
                    <span className={`text-xs font-bold ${c.muted}`}>{label}</span>
                    <span className={`text-xs font-semibold ${c.text} font-mono truncate max-w-[200px]`}>{val}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${c.btnPrim}`}>
                <ArrowRight size={15} /> Go to my Dashboard
              </button>
            </div>
          )}

          {/* ── Navigation buttons ── */}
          {step < 5 && (
            <div className="mt-8 space-y-3">
              <button onClick={handleNext} disabled={!canProceed() || loading}
                className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${c.btnPrim}`}>
                {loading
                  ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Creating your account...</>
                  : step === 4
                    ? <><Shield size={15} /> Create my account</>
                    : <><ArrowRight size={15} /> Continue</>}
              </button>
              {step > 0 && (
                <button onClick={handleBack}
                  className={`w-full py-3 rounded-xl border text-sm font-semibold transition-all ${c.btnGhost}`}>
                  <ArrowLeft size={14} className="inline mr-1.5" /> Back
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}