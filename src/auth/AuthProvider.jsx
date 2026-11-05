import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'
import { AuthContext } from './context'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')))
  const [error, setError] = useState('')

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
    setError('')
    setLoading(false)
  }, [])

  const refresh = useCallback(async (signal) => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const { data } = await api.get('/auth/me', { signal })
      if (!signal?.aborted && localStorage.getItem('token') === token) {
        setUser(data)
        setError('')
      }
    } catch (err) {
      if (signal?.aborted || localStorage.getItem('token') !== token) return
      if (err.response?.status !== 401) setError('Não foi possível verificar seu acesso. Tente novamente.')
    } finally {
      if (!signal?.aborted && localStorage.getItem('token') === token) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const checkAccess = () => { void refresh(controller.signal) }
    checkAccess()
    window.addEventListener('auth-session-ended', logout)
    window.addEventListener('focus', checkAccess)
    const timer = window.setInterval(checkAccess, 60_000)
    const handleStorage = (event) => {
      if (event.key === 'token') {
        // Accounts in different tabs must not inherit another account's interface.
        window.location.reload()
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => {
      controller.abort()
      window.clearInterval(timer)
      window.removeEventListener('auth-session-ended', logout)
      window.removeEventListener('focus', checkAccess)
      window.removeEventListener('storage', handleStorage)
    }
  }, [logout, refresh])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    try {
      const response = await api.get('/auth/me')
      setUser(response.data)
      setError('')
      setLoading(false)
    } catch (err) {
      logout()
      throw err
    }
  }

  return <AuthContext.Provider value={{ user, loading, error, login, logout, refresh }}>{children}</AuthContext.Provider>
}
