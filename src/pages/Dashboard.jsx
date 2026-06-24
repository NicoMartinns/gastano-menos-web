import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import NewTransactionModal from '../components/NewTransactionModal'
import CategoryChart from '../components/CategoryChart'
import EditTransactionModal from '../components/EditTransactionModal'

export default function Dashboard() {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterType, setFilterType] = useState('ALL')
  const [filterCategory, setFilterCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [recurringAction, setRecurringAction] = useState(null)
  const [filterPayment, setFilterPayment] = useState('')
  const [viewMode, setViewMode] = useState('all')

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const paymentLabels = {
    credit: 'Nubank',
    debit: 'Débito',
    pix: 'Pix',
    boleto: 'Boleto',
    cash: 'Dinheiro',
  }

  const paymentColors = {
    credit: 'bg-violet-500/20 text-violet-400',
    debit: 'bg-blue-500/20 text-blue-400',
    pix: 'bg-green-500/20 text-green-400',
    boleto: 'bg-yellow-500/20 text-yellow-400',
    cash: 'bg-gray-500/20 text-gray-400',
  }

  useEffect(() => {
    fetchTransactions()
    fetchCategories()
  }, [year, month])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories')
      setCategories(response.data || [])
    } catch {}
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/transactions?year=${year}&month=${month}`)
      setTransactions(response.data || [])
    } catch {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const formatCurrency = (value) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const handleDelete = async (t) => {
    if (t.IsRecurring || t.RecurringOriginID) {
      setRecurringAction({ type: 'delete', transaction: t })
      return
    }
    if (!confirm('Deseja excluir esta transação?')) return
    try {
      await api.delete(`/transactions/${t.ID}?scope=single`)
      fetchTransactions()
    } catch {
      alert('Erro ao excluir transação')
    }
  }

  const confirmRecurringAction = async (scope) => {
    const { type, transaction, editData } = recurringAction
    setRecurringAction(null)

    try {
      if (type === 'delete') {
        await api.delete(`/transactions/${transaction.ID}?scope=${scope}`)
      } else {
        await api.put(`/transactions/${transaction.ID}?scope=${scope}`, editData)
      }
      fetchTransactions()
    } catch {
      alert('Erro ao realizar operação')
    }
  }

  const filteredTransactions = transactions
    .filter(t => filterType === 'ALL' || t.Type === filterType)
    .filter(t => filterCategory === '' || t.CategoryID === filterCategory)
    .filter(t => filterPayment === '' || t.Type === 'INCOME' || t.PaymentMethod === filterPayment)

  const totalIncome = filteredTransactions
    .filter(t => t.Type === 'INCOME')
    .reduce((acc, t) => acc + t.Amount, 0)

  const totalExpense = filteredTransactions
    .filter(t => t.Type === 'EXPENSE')
    .reduce((acc, t) => acc + t.Amount, 0)

  const balance = totalIncome - totalExpense

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const paidExpense = filteredTransactions
    .filter(t => t.Type === 'EXPENSE' && new Date(t.Date) <= today)
    .reduce((acc, t) => acc + t.Amount, 0)

  const unpaidExpense = filteredTransactions
    .filter(t => t.Type === 'EXPENSE' && new Date(t.Date) > today)
    .reduce((acc, t) => acc + t.Amount, 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white">

        {/* Header */}
        <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-violet-400">Gastando Menos</h1>

          <div className="flex items-center gap-4">
            <button onClick={() => setShowModal(true)}
              className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <span className="hidden sm:inline">+ Nova Transação</span>
              <span className="sm:hidden">+ Nova Transação</span>
            </button>

            {/* Links desktop */}
            <button onClick={() => navigate('/categories')}
              className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              Categorias
            </button>
            <button onClick={() => navigate('/report')}
              className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              Relatório
            </button>
            <button onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              Sair
            </button>

            {/* Menu mobile */}
            <select onChange={(e) => {
                const v = e.target.value
                if (v === 'categories') navigate('/categories')
                else if (v === 'report') navigate('/report')
                else if (v === 'logout') handleLogout()
                e.target.value = ''
              }}
              className="sm:hidden bg-gray-800 text-gray-300 text-sm rounded-lg px-2 py-2 border border-gray-700 focus:outline-none cursor-pointer w-12">
              <option value="" hidden>☰</option>
              <option value="categories">Categorias</option>
              <option value="report">Relatório</option>
              <option value="logout">Sair</option>
            </select>
          </div>
        </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Navegação de mês */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="text-gray-400 hover:text-white text-xl px-2">‹</button>
          <h2 className="text-lg font-semibold">{monthNames[month - 1]} {year}</h2>
          <button onClick={nextMonth} className="text-gray-400 hover:text-white text-xl px-2">›</button>
        </div>

        {/* Gráfico */}
        <CategoryChart transactions={transactions} categories={categories} />

        {/* Cards com toggle integrado */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {/* Toggle no topo do card */}
          <div className="flex border-b border-gray-800">
            {[['all', 'Geral'], ['paid', 'Pago'], ['unpaid', 'A pagar']].map(([value, label]) => (
              <button key={value} onClick={() => setViewMode(value)}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  viewMode === value
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="p-3 sm:p-4">
            <p className="text-xs text-gray-400 mb-1">
              {viewMode === 'unpaid' ? 'A receber' : 'Receitas'}
            </p>
            <p className="text-sm sm:text-lg font-bold text-green-400 truncate">
              {formatCurrency(
                viewMode === 'paid' ? paidIncome :
                viewMode === 'unpaid' ? unpaidIncome :
                totalIncome
              )}
            </p>
          </div>
          <div className="p-3 sm:p-4">
            <p className="text-xs text-gray-400 mb-1">Despesas</p>
            <p className="text-sm sm:text-lg font-bold text-red-400 truncate">
              {formatCurrency(
                viewMode === 'paid' ? paidExpense :
                viewMode === 'unpaid' ? unpaidExpense :
                totalExpense
              )}
            </p>
          </div>
          <div className="p-3 sm:p-4">
            <p className="text-xs text-gray-400 mb-1">
              {viewMode === 'unpaid' ? 'A pagar líquido' : 'Saldo'}
            </p>
            <p className={`text-sm sm:text-lg font-bold truncate ${
              (viewMode === 'paid' ? paidIncome - paidExpense :
              viewMode === 'unpaid' ? unpaidIncome - unpaidExpense :
              balance) >= 0 ? 'text-violet-400' : 'text-red-400'
            }`}>
              {formatCurrency(
                viewMode === 'paid' ? paidIncome - paidExpense :
                viewMode === 'unpaid' ? unpaidIncome - unpaidExpense :
                balance
              )}
            </p>
          </div>
        </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg overflow-hidden border border-gray-800">
            {[['ALL', 'Todos'], ['INCOME', 'Receitas'], ['EXPENSE', 'Despesas']].map(([value, label]) => (
              <button key={value} onClick={() => setFilterType(value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterType === value
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-900 text-gray-400 hover:text-white'
                }`}>
                {label}
              </button>
            ))}
          </div>

          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-gray-900 text-gray-300 text-xs rounded-lg px-3 py-1.5 border border-gray-800 focus:outline-none focus:border-violet-500">
            <option value="">Todas as categorias</option>
            {categories
              .filter(c => !c.ParentID && (filterType === 'ALL' || c.Type === filterType))
              .map(parent => {
                const children = categories.filter(c => c.ParentID === parent.ID)
                return children.length > 0
                  ? (
                    <optgroup key={parent.ID} label={parent.Name}>
                      {children.map(child => (
                        <option key={child.ID} value={child.ID}>{child.Name}</option>
                      ))}
                    </optgroup>
                  ) : (
                    <option key={parent.ID} value={parent.ID}>{parent.Name}</option>
                  )
              })}
          </select>

          <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}
            className="bg-gray-900 text-gray-300 text-xs rounded-lg px-3 py-1.5 border border-gray-800 focus:outline-none focus:border-violet-500">
            <option value="">Todos os meios</option>
            <option value="credit">Nubank</option>
            <option value="debit">Débito</option>
            <option value="pix">Pix</option>
            <option value="boleto">Boleto</option>
            <option value="cash">Dinheiro</option>
          </select>

          {(filterType !== 'ALL' || filterCategory !== '' || filterPayment !== '') && (
            <button onClick={() => { setFilterType('ALL'); setFilterCategory(''); setFilterPayment('') }}
              className="text-xs text-gray-500 hover:text-white transition-colors">
              Limpar filtros
            </button>
          )}
          
        </div>

        {/* Lista de transações */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300">Transações</h3>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">Carregando...</div>
          ) : transactions.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">Nenhuma transação neste mês</div>
          ) : (
            <ul className="divide-y divide-gray-800">
              {filteredTransactions.map(t => (
                  <li key={t.ID} className="px-4 py-3 flex items-center justify-between gap-3 group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium mb-0.5">{t.Description}</p>
                      <p className="text-xs text-gray-500">
                        {t.Date.split('T')[0].split('-').reverse().join('/')} · {t.CategoryName}
                        {t.IsRecurring && ' · Recorrente'}
                      </p>
                      {t.PaymentMethod && (
                        <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-xs font-medium ${paymentColors[t.PaymentMethod]}`}>
                          {paymentLabels[t.PaymentMethod]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-sm font-semibold whitespace-nowrap ${t.Type === 'INCOME' ? 'text-green-400' : 'text-red-400'}`}>
                        {t.Type === 'EXPENSE' ? '- ' : '+ '}{formatCurrency(t.Amount)}
                      </span>
                      <button onClick={() => setEditingTransaction(t)}
                        className="text-gray-600 hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100 text-sm">
                        ✎
                      </button>
                      <button onClick={() => handleDelete(t)}
                        className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-lg leading-none">
                        ×
                      </button>
                    </div>
                  </li>
              ))}
            </ul>
          )}
        </div>

      </main>
      {showModal && (
        <NewTransactionModal
            onClose={() => setShowModal(false)}
            onSuccess={fetchTransactions}
        />
        )}

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={(formData) => {
            if (editingTransaction.IsRecurring || editingTransaction.RecurringOriginID) {
              setEditingTransaction(null)
              setRecurringAction({ type: 'edit', transaction: editingTransaction, editData: formData })
            } else {
              fetchTransactions()
              setEditingTransaction(null)
            }
          }}
        />
      )}

      {recurringAction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
          <div className="bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-800 p-6 space-y-4">
            <h2 className="text-lg font-semibold">
              {recurringAction.type === 'delete' ? 'Excluir' : 'Editar'} transação recorrente
            </h2>
            <p className="text-sm text-gray-400">
              Esta é uma transação recorrente. O que deseja fazer?
            </p>
            <div className="space-y-2">
              <button onClick={() => confirmRecurringAction('single')}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg py-2.5 transition-colors">
                Apenas esta transação
              </button>
              <button onClick={() => confirmRecurringAction('future')}
                className="w-full bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg py-2.5 transition-colors">
                Esta e todas as futuras
              </button>
              <button onClick={() => setRecurringAction(null)}
                className="w-full text-gray-500 hover:text-white text-sm py-2 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}