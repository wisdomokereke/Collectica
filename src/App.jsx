import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './lib/ThemeContext'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Landing      from './pages/Landing'
import Login        from './pages/Login'
import Onboarding   from './pages/Onboarding'
import Dashboard    from './pages/Dashboard'
import Contracts    from './pages/Contracts'
import NewContract  from './pages/NewContract'
import TrustEngine  from './pages/TrustEngine'
import Escrow       from './pages/Escrow'
import Deliverables from './pages/Deliverables'
import Messages     from './pages/Messages'
import Milestones   from './pages/Milestones'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"/>
        <p className="text-sm text-[#555] font-medium">Loading Collectica...</p>
      </div>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Spinner/>
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Spinner/>
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"           element={<Landing />} />
      <Route path="/login"      element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/onboarding" element={<PublicRoute><Onboarding /></PublicRoute>} />

      {/* Protected */}
      <Route path="/dashboard"     element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/jobs"          element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/contracts"     element={<PrivateRoute><Contracts /></PrivateRoute>} />
      <Route path="/contracts/new" element={<PrivateRoute><NewContract /></PrivateRoute>} />
      <Route path="/trust"         element={<PrivateRoute><TrustEngine /></PrivateRoute>} />
      <Route path="/escrow"        element={<PrivateRoute><Escrow /></PrivateRoute>} />
      <Route path="/deliverables"  element={<PrivateRoute><Deliverables /></PrivateRoute>} />
      <Route path="/messages"      element={<PrivateRoute><Messages /></PrivateRoute>} />
      <Route path="/milestones"    element={<PrivateRoute><Milestones /></PrivateRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}
