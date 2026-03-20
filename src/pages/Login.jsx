import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Shield } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { theme, toggle } = useTheme()
  const { signIn, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]     = useState('')

  // If already logged in, go to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, loading])

  const c = {
    bg:      isDark ? 'bg-[#0a0a0a]' : 'bg-[#f8f8f8]',
    card:    isDark ? 'bg-[#111]'    : 'bg-white',
    border:  isDark ? 'border-[#2e2e2e]' : 'border-[#e0e0e0]',
    text:    isDark ? 'text-white'   : 'text-[#0a0a0a]',
    muted:   isDark ? 'text-[#555]'  : 'text-[#aaa]',
    light:   isDark ? 'text-[#888]'  : 'text-[#666]',
    input:   isDark
      ? 'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e] focus:border-white'
      : 'bg-white text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0] focus:border-[#0a0a0a]',
    btnPrim: isDark ? 'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]' : 'bg-[#0a0a0a] text-white hover:bg-[#222]',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setSubmitting(true)
    try {
      await signIn({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${c.bg}`}>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0a0a0a] p-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0a0a0a] border border-[#2e2e2e] flex items-center justify-center">
            <Shield size={14} className="text-green-500"/>
          </div>
          <span className="text-white font-extrabold tracking-tight text-lg">Collectica</span>
        </div>
        <div>
          <p className="text-4xl font-extrabold text-white leading-tight mb-6">
            Every deal.<br/>
            Protected by<br/>
            <span className="text-green-500">contract.</span>
          </p>
          <p className="text-[#555] text-sm leading-relaxed max-w-sm">
            Collectica holds your money, enforces the contract, and only releases payment when the work is done.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
          <p className="text-[#444] text-xs font-medium">Colle AI is active in every contract</p>
        </div>
      </div>

      {/* Right — form */}
      <div className={`flex-1 flex flex-col items-center justify-center px-8 relative ${c.card}`}>
        <button onClick={toggle}
          className={`absolute top-6 right-6 w-9 h-9 rounded-full border flex items-center justify-center text-sm
            ${isDark ? 'border-[#2e2e2e] bg-[#1a1a1a]' : 'border-[#e0e0e0] bg-[#f0f0f0]'}`}>
          {isDark ? '☀️' : '🌙'}
        </button>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className={`text-3xl font-extrabold tracking-tight ${c.text} mb-2`}>Welcome back</h1>
            <p className={`text-sm ${c.light}`}>
              New to Collectica?{' '}
              <Link to="/onboarding" className="text-green-500 font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Email</label>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)}
                className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all ${c.input}`}/>
            </div>
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`w-full pl-4 pr-12 py-3.5 rounded-xl border text-sm outline-none transition-all ${c.input}`}/>
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${c.muted}`}>
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={submitting}
              className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${c.btnPrim}`}>
              {submitting
                ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> Signing in...</>
                : <><ArrowRight size={15}/> Sign in</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
