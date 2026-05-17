'use client'
// components/ui/AddExpenseModal.tsx
import { useState, useEffect } from 'react'
import { CATEGORIES, Group } from '@/lib/db'

const LS_GROUPS = 'sw_groups'

function loadGroups(): Group[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_GROUPS) ?? '[]') } catch { return [] }
}

interface Props {
  open:    boolean
  onClose: () => void
  onAdd:   (expense: { description: string; amount: number; category: string; groupId: string; splitType: string; paidByUid: string }) => void
}

export default function AddExpenseModal({ open, onClose, onAdd }: Props) {
  const [description, setDescription] = useState('')
  const [amount,      setAmount]      = useState('')
  const [category,    setCategory]    = useState('food')
  const [groupId,     setGroupId]     = useState('')
  const [splitType,   setSplitType]   = useState<'equal' | 'percentage'>('equal')
  const [paidByUid,   setPaidByUid]   = useState('local-user')
  const [error,       setError]       = useState('')
  const [groups,      setGroups]      = useState<Group[]>([])

  // Load groups fresh whenever modal opens
  useEffect(() => {
    if (open) {
      const g = loadGroups()
      setGroups(g)
      if (g.length > 0 && !groupId) setGroupId(g[0].id)
    }
  }, [open])

  // Update paidBy options when group changes
  const selectedGroup = groups.find(g => g.id === groupId)
  const members = selectedGroup?.members ?? [{ uid: 'local-user', name: 'You', email: '', avatar: 'ME' }]

  if (!open) return null

  const handleSubmit = () => {
    if (!description.trim()) { setError('Please enter a description'); return }
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) { setError('Please enter a valid amount'); return }
    if (!groupId) { setError('Please create a group first before adding expenses'); return }
    onAdd({ description: description.trim(), amount: amt, category, groupId, splitType, paidByUid })
    // reset
    setDescription(''); setAmount(''); setCategory('food'); setError('')
    onClose()
  }

  const handleClose = () => {
    setDescription(''); setAmount(''); setCategory('food'); setError('')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-modal p-6 w-full max-w-md mx-4 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 id="modal-title" className="font-display font-600 text-[17px] text-gray-800">Add expense</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
            aria-label="Close dialog"
          >
            <i className="ti ti-x text-[17px]" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
            {error}
          </div>
        )}

        {/* No groups warning */}
        {groups.length === 0 && (
          <div className="mb-4 px-3 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[13px]">
            <div className="font-semibold mb-0.5">⚠️ No groups yet</div>
            <div>Go to <strong>Groups</strong> and create a group before adding expenses.</div>
          </div>
        )}

        {/* Description */}
        <div className="mb-4">
          <label className="block text-[12px] text-gray-500 font-medium mb-1.5" htmlFor="exp-desc">Description</label>
          <input
            id="exp-desc"
            className="form-input"
            type="text"
            placeholder="e.g. Dinner at Spice Garden"
            value={description}
            onChange={e => setDescription(e.target.value)}
            autoFocus
            autoComplete="off"
          />
        </div>

        {/* Amount + Group */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[12px] text-gray-500 font-medium mb-1.5" htmlFor="exp-amount">Amount (₹)</label>
            <input
              id="exp-amount"
              className="form-input"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[12px] text-gray-500 font-medium mb-1.5" htmlFor="exp-group">Group</label>
            <select
              id="exp-group"
              className="form-input"
              value={groupId}
              onChange={e => { setGroupId(e.target.value); setPaidByUid('local-user') }}
              disabled={groups.length === 0}
            >
              {groups.length === 0
                ? <option value="">— No groups —</option>
                : groups.map(g => <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>)
              }
            </select>
          </div>
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="block text-[12px] text-gray-500 font-medium mb-1.5">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`p-2 rounded-xl border text-center text-[11px] font-medium transition-all ${
                  category === cat.id
                    ? 'border-brand-400 bg-brand-50 text-brand-600'
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-brand-200'
                }`}
              >
                <div className="text-lg mb-0.5">{cat.emoji}</div>
                <div className="leading-tight">{cat.label.split(' ')[0]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Split type */}
        <div className="mb-4">
          <label className="block text-[12px] text-gray-500 font-medium mb-1.5">Split type</label>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Split type">
            {(['equal', 'percentage'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setSplitType(t)}
                className={`py-2.5 rounded-xl border text-[13px] font-medium transition-all ${
                  splitType === t
                    ? 'border-brand-400 bg-brand-50 text-brand-600'
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-brand-200'
                }`}
              >
                {t === 'equal' ? '⚖️ Equal split' : '📊 Custom %'}
              </button>
            ))}
          </div>
        </div>

        {/* Paid by */}
        <div className="mb-5">
          <label className="block text-[12px] text-gray-500 font-medium mb-1.5" htmlFor="exp-paid">Paid by</label>
          <select
            id="exp-paid"
            className="form-input"
            value={paidByUid}
            onChange={e => setPaidByUid(e.target.value)}
            disabled={members.length === 0}
          >
            {members.map(m => (
              <option key={m.uid} value={m.uid}>
                {m.name}{m.uid === 'local-user' ? ' (you)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="btn-secondary flex-1 justify-center" onClick={handleClose}>Cancel</button>
          <button
            className="btn-primary flex-1 justify-center"
            onClick={handleSubmit}
            disabled={groups.length === 0}
          >
            <i className="ti ti-check text-[15px]" aria-hidden="true" />
            Add expense
          </button>
        </div>
      </div>
    </div>
  )
}
