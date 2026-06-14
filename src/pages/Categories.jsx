import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Categories() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [type, setType] = useState('EXPENSE')
  const [parentID, setParentID] = useState('')
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await api.get('/categories')
      setCategories(response.data || [])
    } catch {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/categories', {
        name,
        type,
        parent_id: parentID || null,
      })
      setName('')
      setParentID('')
      fetchCategories()
    } catch {
      setError('Erro ao criar categoria')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deseja excluir esta categoria? As subcategorias também serão excluídas.')) return
    try {
      await api.delete(`/categories/${id}`)
      fetchCategories()
    } catch {
      alert('Erro ao excluir categoria — verifique se ela não possui transações vinculadas')
    }
  }

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const parents = categories.filter(c => !c.ParentID)
  const getChildren = (parentId) => categories.filter(c => c.ParentID === parentId)
  const parentOptions = parents.filter(c => c.Type === type)

  const income = parents.filter(c => c.Type === 'INCOME')
  const expense = parents.filter(c => c.Type === 'EXPENSE')

  const CategoryList = ({ list, color }) => (
    <ul className="divide-y divide-gray-800">
      {list.map(c => {
        const children = getChildren(c.ID)
        const isOpen = expanded[c.ID]

        return (
          <li key={c.ID}>
            <div className="px-4 py-3 flex items-center justify-between group">
              <button onClick={() => toggleExpand(c.ID)}
                className="flex items-center gap-2 text-left flex-1">
                <span className={`text-xs transition-transform ${isOpen ? 'rotate-90' : ''} ${children.length === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-500'}`}>
                  ›
                </span>
                <span className="text-sm font-medium">{c.Name}</span>
                {children.length > 0 && (
                  <span className="text-xs text-gray-600">({children.length})</span>
                )}
              </button>
              <button onClick={() => handleDelete(c.ID)}
                className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-lg leading-none ml-2">
                ×
              </button>
            </div>

            {isOpen && children.length > 0 && (
              <ul className="border-t border-gray-800">
                {children.map(child => (
                  <li key={child.ID} className="flex items-center justify-between px-4 py-2 bg-gray-800/40 group">
                    <span className="text-sm text-gray-400 pl-6">↳ {child.Name}</span>
                    <button onClick={() => handleDelete(child.ID)}
                      className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-lg leading-none">
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-violet-400">Gastando Menos</h1>
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Voltar
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        <h2 className="text-lg font-semibold">Categorias</h2>

        <form onSubmit={handleCreate} className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Nova categoria</h3>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { setType('EXPENSE'); setParentID('') }}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${type === 'EXPENSE' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
              Despesa
            </button>
            <button type="button" onClick={() => { setType('INCOME'); setParentID('') }}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${type === 'INCOME' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
              Receita
            </button>
          </div>

          {parentOptions.length > 0 && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Categoria pai (opcional)</label>
              <select value={parentID} onChange={(e) => setParentID(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-violet-500">
                <option value="">Nenhuma — criar categoria raiz</option>
                {parentOptions.map(c => (
                  <option key={c.ID} value={c.ID}>{c.Name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-violet-500"
              placeholder="Nome da categoria" />
            <button type="submit"
              className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 rounded-lg transition-colors">
              Adicionar
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </form>

        {[{ label: 'Despesas', list: expense, color: 'text-red-400' },
          { label: 'Receitas', list: income, color: 'text-green-400' }].map(({ label, list, color }) => (
          <div key={label} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className={`text-sm font-semibold ${color}`}>{label}</h3>
            </div>
            {loading ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">Carregando...</div>
            ) : list.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">Nenhuma categoria</div>
            ) : (
              <CategoryList list={list} color={color} />
            )}
          </div>
        ))}

      </main>
    </div>
  )
}