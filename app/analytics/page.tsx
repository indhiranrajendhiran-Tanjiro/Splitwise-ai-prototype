'use client'
// app/analytics/page.tsx
import { useState, useMemo, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { Expense, getCategoryMeta, CATEGORIES } from '@/lib/db'
import { format } from 'date-fns'

const LS_EXPENSES = 'sw_expenses'

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}

export default function AnalyticsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => { setExpenses(loadJSON(LS_EXPENSES, [])) }, [])

  // ── Monthly spend (last 6 months) ────────────────────────────────────────────
  const monthlySpend = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach(exp => {
      const date = exp.date && typeof exp.date.toDate === 'function' ? exp.date.toDate() : new Date()
      const key = format(date, 'MMM yy')
      map[key] = (map[key] ?? 0) + exp.amount
    })
    // Last 6 months order
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      months.push(format(d, 'MMM yy'))
    }
    return months.map(m => ({ month: m.split(' ')[0], fullKey: m, amount: map[m] ?? 0 }))
  }, [expenses])

  // ── Category breakdown ───────────────────────────────────────────────────────
  const categorySpend = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach(exp => { map[exp.category] = (map[exp.category] ?? 0) + exp.amount })
    return CATEGORIES
      .map(cat => ({ name: cat.label, value: map[cat.id] ?? 0, color: cat.color }))
      .filter(c => c.value > 0)
  }, [expenses])

  const totalSpent   = expenses.reduce((s, e) => s + e.amount, 0)
  const avgPerMonth  = monthlySpend.length ? (totalSpent / monthlySpend.filter(m => m.amount > 0).length || 0) : 0
  const topCategory  = categorySpend.sort((a, b) => b.value - a.value)[0]
  const thisMonth    = monthlySpend[monthlySpend.length - 1]?.amount ?? 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-brand-100 rounded-xl px-3 py-2 shadow-card text-[12px]">
        <div className="font-semibold text-gray-700">{label}</div>
        <div className="text-brand-500">₹{payload[0].value.toLocaleString('en-IN')}</div>
      </div>
    )
  }

  return (
    <AppShell title="Analytics">
      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center text-gray-400">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-[18px] font-medium text-gray-600 mb-2">No data yet</div>
          <div className="text-[14px] max-w-sm">
            Add some expenses first — your spending charts and analytics will appear here automatically.
          </div>
        </div>
      ) : (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-2 gap-5 mb-5">
            {/* Bar chart */}
            <section className="stat-card" aria-label="Monthly spending bar chart">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-600 text-[15px] text-gray-800">Monthly spend</h2>
                <span className="tag tag-purple">{format(new Date(), 'MMM yyyy')}</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlySpend} barSize={22}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F3FF' }} />
                  <Bar dataKey="amount" radius={[5, 5, 0, 0]}>
                    {monthlySpend.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={i === monthlySpend.length - 1 ? '#7F77DD' : '#CECBF6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between mt-2 text-[12px]">
                <span className="text-gray-400">Avg: ₹{Math.round(avgPerMonth).toLocaleString('en-IN')}/mo</span>
                <span className="text-brand-600 font-semibold">This month: ₹{thisMonth.toLocaleString('en-IN')}</span>
              </div>
            </section>

            {/* Donut chart */}
            <section className="stat-card" aria-label="Spending by category pie chart">
              <h2 className="font-display font-600 text-[15px] text-gray-800 mb-4">Spend by category</h2>
              {categorySpend.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-[13px]">No category data yet</div>
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={130} height={130}>
                    <PieChart>
                      <Pie
                        data={categorySpend}
                        cx="50%" cy="50%"
                        innerRadius={38} outerRadius={58}
                        dataKey="value"
                        strokeWidth={2} stroke="white"
                      >
                        {categorySpend.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2.5" role="list" aria-label="Category breakdown">
                    {categorySpend.map(cat => (
                      <div key={cat.name} className="flex items-center gap-2.5" role="listitem">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} aria-hidden="true" />
                        <span className="flex-1 text-[12.5px] text-gray-500">{cat.name}</span>
                        <span className="text-[12.5px] font-semibold text-gray-700">₹{cat.value.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Summary stats */}
          <section aria-label="Summary statistics" className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total expenses',    value: expenses.length.toString(),            sub: 'All time' },
              { label: 'Total spent',       value: `₹${totalSpent.toLocaleString('en-IN')}`, sub: 'All groups combined' },
              { label: 'Avg per month',     value: `₹${Math.round(avgPerMonth).toLocaleString('en-IN')}`, sub: 'Based on active months' },
              { label: 'Top category',      value: topCategory?.name ?? '—',              sub: topCategory ? `₹${topCategory.value.toLocaleString('en-IN')}` : 'No data' },
            ].map(s => (
              <div key={s.label} className="stat-card text-center">
                <div className="text-[12px] text-gray-400 mb-1">{s.label}</div>
                <div className="text-[18px] font-display font-600 text-gray-800 break-words">{s.value}</div>
                <div className="text-[11.5px] text-gray-400 mt-1">{s.sub}</div>
              </div>
            ))}
          </section>
        </>
      )}
    </AppShell>
  )
}
