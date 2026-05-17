'use client'
// app/expenses/page.tsx
import { useState, useMemo, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import AddExpenseModal from '@/components/ui/AddExpenseModal'
import Toast from '@/components/ui/Toast'
import { getCategoryMeta, Expense, Group } from '@/lib/db'
import { format } from 'date-fns'

const LS_EXPENSES = 'sw_expenses'
const LS_GROUPS   = 'sw_groups'

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function saveJSON(key: string, val: unknown) {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(val))
}

const TAG_COLORS = ['tag-purple', 'tag-red', 'tag-amber', 'tag-teal', 'tag-green']

export default function ExpensesPage() {
  const [expenses,    setExpenses]    = useState<Expense[]>([])
  const [groups,      setGroups]      = useState<Group[]>([])
  const [modalOpen,   setModalOpen]   = useState(false)
  const [toast,       setToast]       = useState('')
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterCat,   setFilterCat]   = useState('all')

  useEffect(() => {
    setExpenses(loadJSON(LS_EXPENSES, []))
    setGroups(loadJSON(LS_GROUPS, []))
  }, [])

  const filtered = useMemo(() => expenses.filter(e => {
    if (filterGroup !== 'all' && e.groupId !== filterGroup) return false
    if (filterCat   !== 'all' && e.category !== filterCat)  return false
    return true
  }), [expenses, filterGroup, filterCat])

  const handleAdd = (data: any) => {
    const group   = groups.find(g => g.id === data.groupId)
    const paidBy  = group?.members.find(m => m.uid === data.paidByUid)
               ?? { uid: 'local-user', name: 'You', email: '', avatar: 'ME' }
    const amt = Number(data.amount)
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

  const handleDelete = (id: string) => {
    const updated = expenses.filter(e => e.id !== id)
    setExpenses(updated)
    saveJSON(LS_EXPENSES, updated)
    setToast('Expense deleted')
  }

  const total = filtered.reduce((sum, e) => sum + e.amount, 0)

  return (
    <AppShell title="Expenses" onAddExpense={() => setModalOpen(true)}>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <select
          className="form-input w-auto text-[13px] py-2 px-3"
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
          aria-label="Filter by group"
        >
          <option value="all">All groups</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>
          ))}
        </select>
        <select
          className="form-input w-auto text-[13px] py-2 px-3"
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          <option value="food">🍽️ Food</option>
          <option value="accommodation">🏠 Accommodation</option>
          <option value="transport">🚗 Transport</option>
          <option value="activities">🎡 Activities</option>
          <option value="groceries">🛒 Groceries</option>
          <option value="utilities">💡 Utilities</option>
          <option value="other">🧾 Other</option>
        </select>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-[13px] text-gray-500">
            <span className="font-semibold text-gray-800">{filtered.length}</span> expense{filtered.length !== 1 ? 's' : ''} ·{' '}
            <span className="font-semibold text-brand-600">₹{total.toLocaleString('en-IN')}</span> total
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="stat-card overflow-hidden !p-0" role="region" aria-label="Expense list">
        {/* Header */}
        <div className="grid expense-row border-b border-brand-50 px-5 !py-3 bg-gray-50/80 rounded-t-2xl" aria-hidden="true">
          <div className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide">Expense</div>
          <div className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide">Group</div>
          <div className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide">Split</div>
          <div className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide">Date</div>
          <div className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide text-right">Amount</div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🧾</div>
            <div className="text-[14px] font-medium text-gray-500 mb-1">
              {expenses.length === 0 ? 'No expenses yet' : 'No expenses match your filters'}
            </div>
            <div className="text-[12px]">
              {expenses.length === 0 ? 'Click "+ Add Expense" to record your first one' : 'Try changing the filters above'}
            </div>
          </div>
        ) : (
          <div className="px-5">
            {filtered.map((exp, idx) => {
              const cat = getCategoryMeta(exp.category)
              const isMe = exp.paidBy.uid === 'local-user'
              const dateStr = exp.date && typeof exp.date.toDate === 'function'
                ? format(exp.date.toDate(), 'MMM d')
                : 'Recent'
              const tagColor = TAG_COLORS[groups.findIndex(g => g.id === exp.groupId) % TAG_COLORS.length] ?? 'tag-purple'

              return (
                <div key={exp.id} className="expense-row group/row px-0 hover:px-2 -mx-0 hover:-mx-2">
                  {/* Desc */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-[16px] flex-shrink-0"
                      style={{ background: cat.color + '20' }}
                      aria-hidden="true"
                    >
                      {cat.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-gray-800 truncate">{exp.description}</div>
                      <div className="text-[11.5px] text-gray-400">
                        Paid by {isMe ? 'you' : exp.paidBy.name.split(' ')[0]}
                      </div>
                    </div>
                  </div>

                  {/* Group */}
                  <div>
                    <span className={`tag ${tagColor}`}>
                      {exp.groupName.split(' ')[0]}
                    </span>
                  </div>

                  {/* Split */}
                  <div>
                    <span className={`tag ${exp.splitType === 'equal' ? 'tag-green' : 'tag-amber'}`}>
                      {exp.splitType === 'equal' ? 'Equal' : 'Custom %'}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="text-[12.5px] text-gray-400">{dateStr}</div>

                  {/* Amount + delete */}
                  <div className="flex items-center justify-end gap-2">
                    <span className={`text-[14px] font-semibold ${isMe ? 'amount-positive' : 'amount-negative'}`}>
                      {isMe ? '+' : '-'}₹{exp.amount.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="opacity-0 group-hover/row:opacity-100 w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-all"
                      aria-label={`Delete ${exp.description}`}
                    >
                      <i className="ti ti-trash text-[14px]" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AddExpenseModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </AppShell>
  )
}
