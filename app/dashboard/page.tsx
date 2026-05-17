'use client'
// app/dashboard/page.tsx
import { useState, useMemo } from 'react'
import AppShell from '@/components/layout/AppShell'
import AddExpenseModal from '@/components/ui/AddExpenseModal'
import Toast from '@/components/ui/Toast'
import { getCategoryMeta } from '@/lib/db'
import { Expense, Group, Balance } from '@/lib/db'

// ── Local-storage keys ────────────────────────────────────────────────────────
const LS_EXPENSES = 'sw_expenses'
const LS_GROUPS   = 'sw_groups'

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}

function saveJSON(key: string, val: unknown) {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(val))
}

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [toast,     setToast]     = useState('')
  const [expenses,  setExpenses]  = useState<Expense[]>(() => loadJSON(LS_EXPENSES, []))
  const [groups,    setGroups]    = useState<Group[]>(()  => loadJSON(LS_GROUPS, []))

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalSpent   = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses])
  const activeGroups = groups.length

  const totalMembers = useMemo(() => {
    const all = new Set<string>()
    groups.forEach(g => g.members.forEach(m => all.add(m.uid)))
    return all.size
  }, [groups])

  // What "you" owe vs are owed (based on paidBy === 'local-user')
  const { youOwe, owedToYou } = useMemo(() => {
    let owedToYou = 0
    let youOwe    = 0
    expenses.forEach(exp => {
      const perPerson = exp.splits.length ? exp.amount / exp.splits.length : exp.amount
      if (exp.paidBy.uid === 'local-user') {
        // others owe you
        owedToYou += exp.amount - perPerson
      } else {
        // you owe your share
        youOwe += perPerson
      }
    })
    return { youOwe, owedToYou }
  }, [expenses])

  const stats = [
    { label: 'Total spent',   value: `₹${totalSpent.toLocaleString('en-IN')}`,    delta: `${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`, icon: 'ti-wallet',          color: '#7F77DD', bg: '#EEEDFE' },
    { label: 'You owe',       value: `₹${Math.round(youOwe).toLocaleString('en-IN')}`,   delta: 'Your share across groups', icon: 'ti-arrow-up-circle',  color: '#A32D2D', bg: '#FCEBEB' },
    { label: 'Owed to you',   value: `₹${Math.round(owedToYou).toLocaleString('en-IN')}`, delta: 'Others\' shares you covered', icon: 'ti-arrow-down-circle', color: '#3B6D11', bg: '#EAF3DE' },
    { label: 'Active groups', value: `${activeGroups}`,                            delta: `${totalMembers} member${totalMembers !== 1 ? 's' : ''} total`, icon: 'ti-users',           color: '#0F6E56', bg: '#E1F5EE' },
  ]

  // ── Add expense handler ──────────────────────────────────────────────────────
  const handleAdd = (data: any) => {
    const group   = groups.find(g => g.id === data.groupId)
    const paidBy  = group?.members.find(m => m.uid === data.paidByUid)
               ?? { uid: 'local-user', name: 'You', email: '', avatar: 'ME' }
    const amt     = Number(data.amount)
    const newExp: Expense = {
      id:          `e${Date.now()}`,
      groupId:     data.groupId,
      groupName:   group?.name ?? 'Ungrouped',
      description: data.description,
      amount:      amt,
      category:    data.category,
      paidBy,
      splitType:   data.splitType,
      splits:      group
        ? group.members.map(m => ({ member: m, share: amt / group.members.length }))
        : [{ member: paidBy, share: amt }],
      date:        { toDate: () => new Date() } as any,
      createdBy:   'local-user',
    }
    const updated = [newExp, ...expenses]
    setExpenses(updated)
    saveJSON(LS_EXPENSES, updated)
    setToast('Expense added! ✅')
  }

  const recent = expenses.slice(0, 5)

  return (
    <AppShell title="Dashboard" onAddExpense={() => setModalOpen(true)}>
      {/* Stat cards */}
      <section aria-label="Overview statistics" className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                <i className={`ti ${s.icon} text-[16px]`} style={{ color: s.color }} aria-hidden="true" />
              </div>
              <span className="text-[12px] text-gray-500 font-medium">{s.label}</span>
            </div>
            <div className="text-[24px] font-semibold text-gray-800">{s.value}</div>
            <div className="text-[12px] text-gray-400 mt-1">{s.delta}</div>
          </div>
        ))}
      </section>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-5">
        {/* Recent expenses */}
        <section className="stat-card" aria-label="Recent expenses">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-600 text-[15px] text-gray-800">Recent expenses</h2>
            <a href="/expenses" className="text-[12px] text-brand-500 font-medium hover:text-brand-700">View all →</a>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-3xl mb-2">🧾</div>
              <div className="text-[13px]">No expenses yet — add your first one!</div>
            </div>
          ) : (
            <div>
              {recent.map(exp => {
                const cat = getCategoryMeta(exp.category)
                const isPaidByMe = exp.paidBy.uid === 'local-user'
                return (
                  <div key={exp.id} className="flex items-center gap-3 py-2.5 border-b border-brand-50 last:border-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[16px] flex-shrink-0" style={{ background: cat.color + '20' }}>
                      {cat.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium text-gray-800 truncate">{exp.description}</div>
                      <div className="text-[11.5px] text-gray-400">{exp.groupName}</div>
                    </div>
                    <div className={`text-[14px] font-semibold ${isPaidByMe ? 'amount-positive' : 'amount-negative'}`}>
                      {isPaidByMe ? '+' : '-'}₹{exp.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Quick summary / empty state for balances */}
        <section className="stat-card" aria-label="Balance overview">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-600 text-[15px] text-gray-800">Balance overview</h2>
            <a href="/expenses" className="text-[12px] text-brand-500 font-medium hover:text-brand-700">Details →</a>
          </div>
          {expenses.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-3xl mb-2">⚖️</div>
              <div className="text-[13px]">Balances will appear after you add expenses</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* You owe summary */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50">
                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
                  <i className="ti ti-arrow-up text-[18px]" />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-gray-700">You owe</div>
                  <div className="text-[11.5px] text-gray-400">Your share of others' payments</div>
                </div>
                <div className="text-[16px] font-semibold text-red-500">₹{Math.round(youOwe).toLocaleString('en-IN')}</div>
              </div>
              {/* Owed to you */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                  <i className="ti ti-arrow-down text-[18px]" />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-gray-700">Owed to you</div>
                  <div className="text-[11.5px] text-gray-400">Others' shares of your payments</div>
                </div>
                <div className="text-[16px] font-semibold text-green-600">₹{Math.round(owedToYou).toLocaleString('en-IN')}</div>
              </div>
              {/* Net */}
              <div className="flex items-center justify-between pt-2 border-t border-brand-50">
                <span className="text-[13px] text-gray-500 font-medium">Net balance</span>
                <span className={`text-[16px] font-semibold ${owedToYou - youOwe >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {owedToYou - youOwe >= 0 ? '+' : ''}₹{Math.round(owedToYou - youOwe).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </section>
      </div>

      <AddExpenseModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </AppShell>
  )
}
