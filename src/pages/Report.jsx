import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid
} from 'recharts'
import api from '../api/client'

const formatCurrency = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function Report() {
  const navigate = useNavigate()
  const [year, setYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [year])

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/transactions/summary?year=${year}`)
      setSummary(response.data || [])
    } catch {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const chartData = summary.map(s => ({
    name: MONTH_NAMES[s.Month - 1],
    Receitas: s.Income,
    Despesas: s.Expense,
    Saldo: s.Income - s.Expense,
  }))

  const totalIncome  = summary.reduce((acc, s) => acc + s.Income, 0)
  const totalExpense = summary.reduce((acc, s) => acc + s.Expense, 0)
  const totalBalance = totalIncome - totalExpense

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs space-y-1">
          <p className="text-white font-medium mb-1">{label}</p>
          {payload.map(p => (
            <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
          ))}
        </div>
      )
    }
    return null
  }

  const yearOptions = [2024, 2025, 2026, 2027, 2028]

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-violet-400">Gastando Menos</h1>
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Voltar
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Título e seletor de ano */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Relatório Anual</h2>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
            className="bg-gray-900 text-gray-300 text-sm rounded-lg px-3 py-2 border border-gray-800 focus:outline-none focus:border-violet-500">
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Cards de totais */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Total Receitas</p>
            <p className="text-lg font-bold text-green-400">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Total Despesas</p>
            <p className="text-lg font-bold text-red-400">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Saldo do Ano</p>
            <p className={`text-lg font-bold ${totalBalance >= 0 ? 'text-violet-400' : 'text-red-400'}`}>
              {formatCurrency(totalBalance)}
            </p>
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">Receitas x Despesas por mês</h3>
          {loading ? (
            <div className="py-8 text-center text-gray-500 text-sm">Carregando...</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend formatter={(value) => <span className="text-xs text-gray-400">{value}</span>} />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tabela mensal */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300">Detalhamento mensal</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Mês</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Receitas</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Despesas</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {summary.map(s => {
                const balance = s.Income - s.Expense
                return (
                  <tr key={s.Month} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-gray-300">{MONTH_NAMES[s.Month - 1]}</td>
                    <td className="px-4 py-3 text-right text-green-400">{formatCurrency(s.Income)}</td>
                    <td className="px-4 py-3 text-right text-red-400">{formatCurrency(s.Expense)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${balance >= 0 ? 'text-violet-400' : 'text-red-400'}`}>
                      {formatCurrency(balance)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  )
}