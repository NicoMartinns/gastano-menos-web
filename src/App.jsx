import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider'
import { useAuth } from './auth/context'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Categories from './pages/Categories'
import Report from './pages/Report'
import Users from './pages/Users'

function PrivateRoute({ children, admin = false }) {
  const { user, loading, error, refresh, logout } = useAuth()
  if (loading) return <p className="min-h-screen bg-gray-950 text-gray-300 p-8" role="status">Verificando acesso...</p>
  if (error) return (
    <div className="min-h-screen bg-gray-950 text-gray-300 p-8 space-y-4">
      <p role="alert">{error}</p>
      <button onClick={() => refresh()} className="mr-4 text-violet-400">Tentar novamente</button>
      <button onClick={logout}>Sair</button>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (admin && user.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/users" element={<PrivateRoute admin><Users /></PrivateRoute>} />
          <Route path="/categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
          <Route path="/report" element={<PrivateRoute><Report /></PrivateRoute>} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
