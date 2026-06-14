import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import logo from '../assets/login-icon.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', response.data.token)
      navigate('/')
    } catch {
      setError('Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

      <div className="text-center mb-10">
        <img src={logo} alt="Gastando Menos" className="w-45 h-45 mx-auto" />
        <h1 className="text-3xl font-bold text-white -mt-12">Gastando Menos</h1>
        <p className="text-gray-400 mt-2">Para de gastar dinheiro!</p>
      </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 space-y-4 border border-gray-800">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-violet-500"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-violet-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg py-2.5 transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

      </div>
    </div>
  )
}