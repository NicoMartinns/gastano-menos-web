import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../auth/context'

const PAGE_SIZE = 20
const emptyForm = () => ({ name: '', email: '', password: '', role: 'USER', is_active: false })
const inputClass = 'w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-violet-500'

function errorMessage(err, fallback) {
  if (err.response?.status === 403) return 'Seu perfil não tem permissão para administrar usuários.'
  if ([400, 404, 409].includes(err.response?.status) && typeof err.response.data === 'string') return err.response.data.trim()
  return fallback
}

export default function Users() {
  const { user: currentUser, refresh } = useAuth()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const loadUsers = useCallback((signal) => {
    return api.get(`/admin/users/?limit=${PAGE_SIZE}&offset=${offset}`, { signal })
      .then(({ data }) => {
        if (signal?.aborted) return
        setUsers(data.users)
        setTotal(data.total)
      })
      .catch((err) => {
        if (!signal?.aborted) setError(errorMessage(err, 'Não foi possível carregar os usuários.'))
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false)
      })
  }, [offset])

  useEffect(() => {
    const controller = new AbortController()
    void loadUsers(controller.signal)
    return () => controller.abort()
  }, [loadUsers])

  const resetForm = () => {
    setEditing(null)
    setForm(emptyForm())
  }

  const edit = (user) => {
    setEditing(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role, is_active: user.is_active })
    setError('')
    setMessage('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (editing?.is_active && !form.is_active && !window.confirm('Bloquear este usuário? As sessões atuais serão invalidadas.')) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      if (editing) {
        const { name, email, role, is_active } = form
        const payload = { name, email, role, is_active }
        await api.put(`/admin/users/${editing.id}`, payload)
      } else {
        await api.post('/admin/users/', form)
      }
      if (editing?.id === currentUser.id) await refresh()
      resetForm()
      setMessage(editing ? 'Usuário atualizado.' : 'Usuário cadastrado.')
      setLoading(true)
      await loadUsers()
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível salvar o usuário. Tente novamente.'))
    } finally {
      setSaving(false)
    }
  }

  const change = (event) => {
    const { name, value, type, checked } = event.target
    setForm(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
  }
  const editingSelf = editing?.id === currentUser.id

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-violet-400">Gastando Menos</h1>
        <Link to="/" className="text-sm text-gray-400 hover:text-white">← Voltar</Link>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Usuários</h2>
          <p className="text-sm text-gray-400 mt-2">Controle quem pode entrar. Todas as contas liberadas compartilham as transações e categorias.</p>
        </div>
        {error && <p role="alert" className="text-red-400">{error}</p>}
        {message && <p role="status" className="text-green-400">{message}</p>}
        <form onSubmit={submit} className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
          <h3 className="font-semibold">{editing ? `Editar ${editing.name}` : 'Cadastrar usuário'}</h3>
          <fieldset disabled={saving} className="space-y-4 disabled:opacity-60">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-sm text-gray-300 space-y-1">
                <span>Nome</span>
                <input name="name" value={form.name} onChange={change} required maxLength={255} className={inputClass} />
              </label>
              <label className="text-sm text-gray-300 space-y-1">
                <span>Email</span>
                <input name="email" type="email" value={form.email} onChange={change} required maxLength={255} className={inputClass} />
              </label>
              {!editing && <label className="text-sm text-gray-300 space-y-1">
                <span>Senha inicial (12 a 72 bytes)</span>
                <input name="password" type="password" autoComplete="new-password" value={form.password} onChange={change} required minLength={12} maxLength={72} className={inputClass} />
              </label>}
              <label className="text-sm text-gray-300 space-y-1">
                <span>Perfil</span>
                <select name="role" value={form.role} onChange={change} disabled={editingSelf} className={inputClass}>
                  <option value="USER">Usuário</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input name="is_active" type="checkbox" checked={form.is_active} onChange={change} disabled={editingSelf} />
              Acesso liberado ao sistema
            </label>
            {editingSelf && <p className="text-xs text-gray-400">Você pode editar seus dados. Seu próprio acesso e perfil estão protegidos.</p>}
            <div className="flex gap-3">
              <button type="submit" className="bg-violet-600 hover:bg-violet-500 rounded-lg px-4 py-2 text-sm">{saving ? 'Salvando...' : 'Salvar usuário'}</button>
              {editing && <button type="button" onClick={resetForm} className="text-gray-400 text-sm">Cancelar edição</button>}
            </div>
          </fieldset>
        </form>
        <section className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden" aria-label="Usuários cadastrados">
          <div className="p-4 flex justify-between items-center gap-4">
            <h3 className="font-semibold">Contas cadastradas ({total})</h3>
            <button onClick={() => { setError(''); setLoading(true); void loadUsers() }} disabled={loading || saving} className="text-sm text-violet-400 disabled:opacity-50">Atualizar lista</button>
          </div>
          {loading ? <p role="status" className="p-4 text-gray-400">Carregando...</p> : users.length === 0 ? <p className="p-4 text-gray-400">Nenhum usuário nesta página.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-gray-400 border-y border-gray-800"><tr>
                  <th className="p-4">Usuário</th><th className="p-4">Perfil</th><th className="p-4">Acesso</th><th className="p-4">Ação</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-800">{users.map(user => (
                  <tr key={user.id}>
                    <td className="p-4"><p>{user.name}{user.id === currentUser.id ? ' (você)' : ''}</p><p className="text-gray-400">{user.email}</p></td>
                    <td className="p-4">{user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</td>
                    <td className={`p-4 ${user.is_active ? 'text-green-400' : 'text-red-400'}`}>{user.is_active ? 'Liberado' : 'Bloqueado'}</td>
                    <td className="p-4"><button onClick={() => edit(user)} disabled={saving} className="text-violet-400 disabled:opacity-50" aria-label={`Editar ${user.name}`}>Editar</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <div className="p-4 flex justify-between items-center gap-3 border-t border-gray-800">
            <button onClick={() => { setLoading(true); setOffset(value => Math.max(0, value - PAGE_SIZE)) }} disabled={offset === 0 || loading || saving} className="text-sm text-gray-300 disabled:opacity-40">Anterior</button>
            <span className="text-xs text-gray-400">Página {Math.floor(offset / PAGE_SIZE) + 1}</span>
            <button onClick={() => { setLoading(true); setOffset(value => value + PAGE_SIZE) }} disabled={offset + PAGE_SIZE >= total || loading || saving} className="text-sm text-gray-300 disabled:opacity-40">Próxima</button>
          </div>
        </section>
      </main>
    </div>
  )
}
