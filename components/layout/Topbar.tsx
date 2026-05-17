'use client'
// components/layout/Topbar.tsx
import { useState } from 'react'

interface TopbarProps {
  title:        string
  onAddExpense?: () => void
}

export default function Topbar({ title, onAddExpense }: TopbarProps) {
  const [search, setSearch] = useState('')

  return (
    <header className="topbar" role="banner">
      <h1 className="font-display font-600 text-[18px] text-gray-800 flex-1">{title}</h1>

      {/* Search */}
      <label className="flex items-center gap-2 bg-white border border-brand-100/60 rounded-xl px-3 py-2 text-sm text-gray-400 cursor-text hover:border-brand-300 transition-colors w-52">
        <i className="ti ti-search text-[15px]" aria-hidden="true" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search expenses…"
          className="bg-transparent outline-none text-gray-700 placeholder-gray-400 w-full text-[13px]"
          aria-label="Search expenses"
        />
      </label>

      {/* Notification */}
      <button
        className="w-9 h-9 rounded-xl bg-white border border-brand-100/60 flex items-center justify-center text-gray-400 hover:text-brand-400 hover:border-brand-300 transition-colors relative"
        aria-label="Notifications"
      >
        <i className="ti ti-bell text-[17px]" aria-hidden="true" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-400" aria-label="2 unread notifications" />
      </button>

      {/* Add expense */}
      {onAddExpense && (
        <button className="btn-primary" onClick={onAddExpense}>
          <i className="ti ti-plus text-[15px]" aria-hidden="true" />
          Add expense
        </button>
      )}
    </header>
  )
}
