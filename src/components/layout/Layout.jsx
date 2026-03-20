import { useTheme } from '../../lib/ThemeContext'
import Navbar from './Navbar'

export default function Layout({ children, hideNav = false }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-[#0a0a0a]'}`}>
      {!hideNav && <Navbar />}
      <main>{children}</main>
    </div>
  )
}
