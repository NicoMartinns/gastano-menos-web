import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'

const formatCurrency = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function CategoryChart({ transactions, categories }) {
  const [view, setView] = useState('EXPENSE')
  const [selected, setSelected] = useState(null)

  const mainColor = view === 'EXPENSE' ? '#ef4444' : '#10b981'
  const subColors = view === 'EXPENSE'
    ? ['#ef4444', '#f87171', '#fca5a5', '#dc2626', '#b91c1c', '#fee2e2']
    : ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857', '#d1fae5']

  const parents = categories.filter(c => !c.ParentID && c.Type === view)
  const getChildren = (parentId) => categories.filter(c => c.ParentID === parentId)

  const getCategoryAndChildren = (parentId) => {
    const children = getChildren(parentId)
    return children.length === 0 ? [parentId] : children.map(c => c.ID)
  }

  const chartData = parents.map(parent => {
    const ids = getCategoryAndChildren(parent.ID)
    const total = transactions
      .filter(t => t.Type === view && ids.includes(t.CategoryID))
      .reduce((acc, t) => acc + t.Amount, 0)
    return { name: parent.Name, total, id: parent.ID }
  }).filter(d => d.total > 0)

  const drillData = selected
    ? (() => {
        const children = getChildren(selected.id)
        if (children.length === 0) return []
        return children.map(child => {
          const total = transactions
            .filter(t => t.CategoryID === child.ID)
            .reduce((acc, t) => acc + t.Amount, 0)
          return { name: child.Name, total }
        }).filter(d => d.total > 0)
      })()
    : []

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs">
          <p className="text-white font-medium">{payload[0].payload.name}</p>
          <p style={{ color: mainColor }}>{formatCurrency(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  const handleBarClick = (data) => {
    if (!data) return
    setSelected(selected?.id === data.id ? null : data)
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Gastos por categoria</h3>
        <div className="flex rounded-lg overflow-hidden border border-gray-800">
          {[['EXPENSE', 'Despesas'], ['INCOME', 'Receitas']].map(([value, label]) => (
            <button key={value} onClick={() => { setView(value); setSelected(null) }}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === value ? 'bg-violet-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-sm">Nenhum dado para exibir</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} style={{ outline: 'none' }}>
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => {
                    if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`
                    return `R$${v}`
                }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} cursor="pointer"
                onClick={(data) => handleBarClick(data)}
                style={{ outline: 'none' }}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={mainColor}
                    opacity={selected && selected.id !== entry.id ? 0.3 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {!selected && (
            <p className="text-xs text-gray-600 text-center">
              Clique em uma coluna para ver o detalhamento por subcategoria
            </p>
          )}

          {selected && (
            <div className="border-t border-gray-800 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-300">
                  {selected.name} — {formatCurrency(selected.total)}
                </p>
                <button onClick={() => setSelected(null)}
                  className="text-xs text-gray-500 hover:text-white transition-colors">
                  Fechar ×
                </button>
              </div>

              {drillData.length === 0 ? (
                <p className="text-xs text-gray-500">Sem subcategorias com lançamentos</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={drillData} dataKey="total" nameKey="name"
                      cx="50%" cy="50%" outerRadius={60} paddingAngle={3}
                      style={{ outline: 'none' }}>
                      {drillData.map((entry, i) => (
                        <Cell key={i} fill={subColors[i % subColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(value) => <span className="text-xs text-gray-400">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}