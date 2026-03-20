import { Link } from 'react-router-dom'
import { Shield, ArrowRight, Lock, Zap, Star, MessageSquare, FileText, Wallet } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'

export default function Landing() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  const c = {
    bg: isDark ? 'bg-[#0a0a0a]' : 'bg-white',
    text: isDark ? 'text-white' : 'text-[#0a0a0a]',
    muted: isDark ? 'text-[#555]' : 'text-[#aaa]',
    light: isDark ? 'text-[#888]' : 'text-[#666]',
    card: isDark ? 'bg-[#111] border-[#2e2e2e]' : 'bg-[#f8f8f8] border-[#e0e0e0]',
    border: isDark ? 'border-[#2e2e2e]' : 'border-[#e0e0e0]',
  }

  return (
    <div className={`min-h-screen flex flex-col ${c.bg} transition-colors`}>
      {/* Nav */}
      <nav className={`flex items-center justify-between px-6 md:px-12 py-5 border-b ${c.border}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
            <Shield size={15} className="text-white" />
          </div>
          <span className={`text-lg font-extrabold tracking-tight ${c.text}`}>Collectica</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggle} className="text-lg">{isDark ? '☀️' : '🌙'}</button>
          <Link to="/login" className={`text-sm font-semibold ${c.light} hover:${c.text}`}>Sign in</Link>
          <Link to="/onboarding" className="px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-all">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/10 text-green-600 text-xs font-bold mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Built for African freelancers & clients
        </div>

        <h1 className={`text-5xl md:text-7xl font-extrabold tracking-tight max-w-3xl leading-tight mb-6 ${c.text}`}>
          Get paid.<br />
          <span className="text-green-500">Always.</span>
        </h1>

        <p className={`text-lg md:text-xl max-w-xl leading-relaxed mb-10 ${c.light}`}>
          Collectica holds your money in escrow, enforces your contract, and only releases payment when the work is done. No more chasing. No more risk.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/onboarding" className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-green-500 text-white font-bold text-base hover:bg-green-600 transition-all">
            Create Free Account <ArrowRight size={18} />
          </Link>
          <Link to="/login" className={`flex items-center gap-2 px-8 py-4 rounded-2xl border font-bold text-base transition-all ${c.border} ${c.light} hover:${c.text}`}>
            Sign In
          </Link>
        </div>

        {/* Stats */}
        <div className={`flex items-center gap-8 mt-16 flex-wrap justify-center text-center`}>
          {[['🛡️', 'Escrow Protected', 'Every transaction'], ['🤖', 'AI Contracts', 'From your chat'], ['⭐', 'Trust Scores', 'Verified history']].map(([icon, label, sub]) => (
            <div key={label}>
              <p className="text-2xl mb-1">{icon}</p>
              <p className={`font-bold text-sm ${c.text}`}>{label}</p>
              <p className={`text-xs ${c.muted}`}>{sub}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Features */}
      <section className={`px-6 md:px-12 py-16 border-t ${c.border}`}>
        <div className="max-w-5xl mx-auto">
          <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2 text-center`}>Everything you need</p>
          <h2 className={`text-3xl font-extrabold text-center mb-10 ${c.text}`}>Built for trust</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: <Lock size={20} />, title: 'Escrow Protection', desc: 'Funds are locked until you approve. You can never lose money to a bad actor on Collectica.' },
              { icon: <MessageSquare size={20} />, title: 'AI Contract from Chat', desc: 'Chat with the other party, then call our AI to turn the conversation into a signed contract.' },
              { icon: <Star size={20} />, title: 'Trust Engine', desc: 'Every user has a verified trust score based on real contract history and delivery record.' },
              { icon: <FileText size={20} />, title: 'Milestone Payments', desc: 'Break work into milestones. Payment releases only when each milestone is approved.' },
              { icon: <Wallet size={20} />, title: 'One Wallet', desc: 'Top up once, allocate across all your active projects from a single dashboard.' },
              { icon: <Zap size={20} />, title: 'Instant Notifications', desc: 'Real-time alerts for every milestone, payment, message, and contract update.' },
            ].map(f => (
              <div key={f.title} className={`p-5 rounded-2xl border ${c.card}`}>
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 mb-4">
                  {f.icon}
                </div>
                <p className={`font-bold mb-2 ${c.text}`}>{f.title}</p>
                <p className={`text-sm leading-relaxed ${c.light}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`px-6 py-16 border-t ${c.border} text-center`}>
        <h2 className={`text-3xl font-extrabold mb-4 ${c.text}`}>Ready to get protected?</h2>
        <p className={`${c.light} mb-8`}>Join Collectica. Work safely. Get paid.</p>
        <Link to="/onboarding" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-green-500 text-white font-bold hover:bg-green-600 transition-all">
          Create Free Account <ArrowRight size={18} />
        </Link>
      </section>

      <footer className={`px-6 py-6 border-t ${c.border} text-center`}>
        <p className={`text-xs ${c.muted}`}>© 2025 Collectica. Smart escrow for African freelancers.</p>
      </footer>
    </div>
  )
}
