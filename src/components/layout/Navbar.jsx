import { Link, useLocation } from 'react-router-dom'
import { Sun, Moon, Menu, X } from 'lucide-react'
import { useTheme } from '../../lib/ThemeContext'
import { useState } from 'react'

export default function Navbar({ variant = 'default' }) {
  const { theme, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const isDark = theme === 'dark'

  const navLinks = [
    { label: 'How it works', href: '/#how' },
    { label: 'Features', href: '/#features' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Trust Engine', href: '/trust' },
  ]

  return (
    <nav className={`
      fixed top-0 left-0 right-0 z-50
      flex items-center justify-between
      px-6 md:px-12 py-5
      border-b backdrop-blur-md
      transition-all duration-300
      ${isDark
        ? 'bg-[#0a0a0a]/85 border-[#2e2e2e] text-white'
        : 'bg-white/88 border-[#e0e0e0] text-[#0a0a0a]'}
    `}>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-1.5 font-extrabold text-lg tracking-tight">
        Collectica
        <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-white' : 'bg-[#0a0a0a]'}`} />
      </Link>

      {/* Desktop links */}
      <ul className="hidden md:flex gap-8 list-none">
        {navLinks.map(link => (
          <li key={link.label}>
            <Link
              to={link.href}
              className={`text-sm font-medium transition-colors duration-200
                ${isDark ? 'text-[#888] hover:text-white' : 'text-[#666] hover:text-[#0a0a0a]'}`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            border transition-all duration-200
            ${isDark
              ? 'border-[#2e2e2e] bg-[#1a1a1a] text-white hover:border-[#888]'
              : 'border-[#e0e0e0] bg-[#f0f0f0] text-[#0a0a0a] hover:border-[#999]'}
          `}
          title="Toggle theme"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Auth buttons */}
        <Link
          to="/login"
          className={`
            hidden md:block text-sm font-medium px-4 py-2 rounded-lg border transition-all
            ${isDark
              ? 'border-[#2e2e2e] text-[#ccc] hover:text-white hover:border-[#888]'
              : 'border-[#e0e0e0] text-[#444] hover:text-[#0a0a0a] hover:border-[#999]'}
          `}
        >
          Log in
        </Link>
        <Link
          to="/onboarding"
          className={`
            hidden md:block text-sm font-bold px-4 py-2 rounded-lg transition-all
            ${isDark
              ? 'bg-white text-[#0a0a0a] hover:bg-[#f5f5f5]'
              : 'bg-[#0a0a0a] text-white hover:bg-[#222]'}
          `}
        >
          Get started
        </Link>

        {/* Mobile menu */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className={`
          absolute top-full left-0 right-0 border-b p-6 flex flex-col gap-4
          ${isDark ? 'bg-[#0a0a0a] border-[#2e2e2e]' : 'bg-white border-[#e0e0e0]'}
        `}>
          {navLinks.map(link => (
            <Link
              key={link.label}
              to={link.href}
              onClick={() => setMenuOpen(false)}
              className={`text-sm font-medium ${isDark ? 'text-[#888]' : 'text-[#666]'}`}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-2 border-t border-[#2e2e2e]">
            <Link to="/login" className="flex-1 text-center text-sm py-2 border border-[#2e2e2e] rounded-lg">Log in</Link>
            <Link to="/onboarding" className={`flex-1 text-center text-sm py-2 font-bold rounded-lg ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>Get started</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
