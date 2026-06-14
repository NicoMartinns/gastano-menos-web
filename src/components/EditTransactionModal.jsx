import { useState, useEffect } from 'react'
import api from '../api/client'

export default function EditTransactionModal({ transaction, onClose, onSuccess }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    category_id: transaction.CategoryID,
    description: transaction.Description,
    amount: transaction.Amount,
    type: transaction.Type,
    date: transaction.Date.split('T')[0],
    payment_method: transaction.PaymentMethod || '',
  })

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data || []))
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      ...form,
      amount: parseFloat(form.amount),
    }

    // se for recorrente, deixa o Dashboard decidir o scope
    if (transaction.IsRecurring || transaction.RecurringOriginID) {
      onSuccess(payload)
      setLoading(false)
      return
    }

    try {
      await api.put(`/transactions/${transaction.ID}?scope=single`, payload)
      onSuccess(null)
      onClose()
    } catch {
      setError('Erro ao salvar alterações')
    } finally {
      setLoading(false)
    }
  }

  const hasChildren = (parentId) => categories.some(c => c.ParentID === parentId)

  const isValid =
  form.description.trim() !== '' &&
  form.amount !== '' &&
  parseFloat(form.amount) > 0 &&
  form.category_id !== '' &&
  form.date !== ''

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-800 p-6 space-y-4">

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Editar Transação</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setForm(f => ({ ...f, type: 'EXPENSE', category_id: '' }))}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${form.type === 'EXPENSE' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
              Despesa
            </button>
            <button type="button" onClick={() => setForm(f => ({ ...f, type: 'INCOME', category_id: '' }))}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${form.type === 'INCOME' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
              Receita
            </button>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Descrição</label>
            <input name="description" value={form.description} onChange={handleChange} required
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-violet-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Valor</label>
              <input name="amount" value={form.amount} onChange={handleChange} required type="number" step="0.01" min="0"
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-violet-500" />
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
                        {categories.filter(c => c.ParentID === parent.ID).map(child => (
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

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading || !isValid}
            className={`w-full text-white font-medium rounded-lg py-2.5 text-sm transition-colors
              ${isValid && !loading
                ? 'bg-violet-600 hover:bg-violet-500 cursor-pointer'
                : 'bg-gray-700 cursor-not-allowed opacity-50'
              }`}>
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>

        </form>
      </div>
    </div>
  )
}