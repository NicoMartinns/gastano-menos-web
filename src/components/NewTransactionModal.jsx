import { useState, useEffect } from 'react'
import api from '../api/client'

export default function NewTransactionModal({ onClose, onSuccess }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const hasChildren = (parentId) => categories.some(c => c.ParentID === parentId)


  const [form, setForm] = useState({
    category_id: '',
    description: '',
    amount: '',
    type: 'EXPENSE',
    date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    recurring_months: '',
    recurrence_day: '',
    payment_method: '',
  })

  useEffect(() => {
  api.get('/categories').then(res => {
    const all = res.data || []
    setCategories(all)
  })
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
    await api.post('/transactions', {
      ...form,
      amount: parseFloat(form.amount),
      recurrence_day: form.recurrence_day ? parseInt(form.recurrence_day) : null,
      recurring_months: form.recurring_months ? parseInt(form.recurring_months) : null,
      payment_method: form.payment_method || null,
    })
      onSuccess()
      onClose()
    } catch {
      setError('Erro ao salvar transação')
    } finally {
      setLoading(false)
    }
  }
  const isValid = 
  form.description.trim() !== '' &&
  form.amount !== '' &&
  parseFloat(form.amount) > 0 &&
  form.category_id !== '' &&
  form.date !== '' &&
  (!form.is_recurring || (form.recurrence_day !== '' && form.recurrence_day !== null))
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-800 p-6 space-y-4">

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nova Transação</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setForm(f => ({ ...f, type: 'EXPENSE' }))}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${form.type === 'EXPENSE' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
              Despesa
            </button>
            <button type="button" onClick={() => setForm(f => ({ ...f, type: 'INCOME' }))}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${form.type === 'INCOME' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
              Receita
            </button>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Descrição</label>
            <input name="description" value={form.description} onChange={handleChange} required
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-violet-500"
              placeholder="Ex: Supermercado" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Valor</label>
              <input name="amount" value={form.amount} onChange={handleChange} required type="number" step="0.01" min="0"
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-violet-500"
                placeholder="0,00" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Data</label>
              <input name="date" value={form.date} onChange={handleChange} required type="date"
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-violet-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Categoria</label>
            <select name="category_id" value={form.category_id} onChange={handleChange} required
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-violet-500">
              <option value="">Selecione...</option>
              {categories
                .filter(c => c.Type === form.type && !c.ParentID)
                .map(parent => (
                  hasChildren(parent.ID)
                    ? (
                      <optgroup key={parent.ID} label={parent.Name}>
                        {categories
                          .filter(c => c.ParentID === parent.ID)
                          .map(child => (
                            <option key={child.ID} value={child.ID}>{child.Name}</option>
                          ))}
                      </optgroup>
                    ) : (
                      <option key={parent.ID} value={parent.ID}>{parent.Name}</option>
                    )
                ))}
            </select>
          </div>

          {form.type === 'EXPENSE' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Meio de pagamento</label>
              <select name="payment_method" value={form.payment_method} onChange={handleChange}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-violet-500">
                <option value="">Selecione...</option>
                <option value="credit">Nubank (crédito)</option>
                <option value="debit">Débito</option>
                <option value="pix">Pix</option>
                <option value="boleto">Boleto</option>
                <option value="cash">Dinheiro</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input name="is_recurring" type="checkbox" checked={form.is_recurring} onChange={handleChange}
              className="rounded" id="recurring" />
            <label htmlFor="recurring" className="text-sm text-gray-400">Transação recorrente</label>
          </div>

          {form.is_recurring && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Dia do mês</label>
                <input name="recurrence_day" value={form.recurrence_day} onChange={handleChange} type="number" min="1" max="31"
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-violet-500"
                  placeholder="Ex: 5" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Meses (vazio = sem prazo)</label>
                <input name="recurring_months" value={form.recurring_months} onChange={handleChange} type="number" min="1"
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-violet-500"
                  placeholder="Ex: 12" />
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading || !isValid}
            className={`w-full text-white font-medium rounded-lg py-2.5 text-sm transition-colors
              ${isValid && !loading
                ? 'bg-violet-600 hover:bg-violet-500 cursor-pointer'
                : 'bg-gray-700 cursor-not-allowed opacity-50'
              }`}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>

        </form>
      </div>
    </div>
  )
}