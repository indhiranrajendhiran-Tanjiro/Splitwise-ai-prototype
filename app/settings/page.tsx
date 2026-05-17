'use client'
// app/settings/page.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import Toast from '@/components/ui/Toast'

// ── All localStorage keys used across the app ──────────────────────────────────
const ALL_KEYS = ['sw_user', 'sw_profile', 'sw_expenses', 'sw_groups']

interface UserInfo { name: string; email: string; avatar: string; signedIn: boolean; joinedAt: string }

function loadUser(): UserInfo | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem('sw_user') ?? 'null') } catch { return null }
}

interface Setting {
  id:        string
  icon:      string
  iconBg:    string
  iconColor: string
  title:     string
  sub:       string
  defaultOn?: boolean
}

const SETTINGS: Setting[] = [
  { id: 'notifications', icon: 'ti-bell',     iconBg: '#FAEEDA', iconColor: '#854F0B', title: 'Push notifications',    sub: 'Expense added, settlement reminders',      defaultOn: true  },
  { id: 'ai',            icon: 'ti-sparkles', iconBg: '#EEEDFE', iconColor: '#534AB7', title: 'AI insights',           sub: 'Smart spending analysis powered by Claude', defaultOn: true  },
  { id: 'emails',        icon: 'ti-calendar', iconBg: '#EAF3DE', iconColor: '#3B6D11', title: 'Monthly summary emails', sub: 'Auto-generated financial report',           defaultOn: false },
  { id: 'darkmode',      icon: 'ti-moon',     iconBg: '#F1EFE8', iconColor: '#5F5E5A', title: 'Dark mode',             sub: 'Easier on the eyes at night',               defaultOn: false },
]

export default function SettingsPage() {
  const router  = useRouter()
  const [user,     setUser]     = useState<UserInfo | null>(null)
  const [toggles,  setToggles]  = useState<Record<string, boolean>>(
    Object.fromEntries(SETTINGS.map(s => [s.id, s.defaultOn ?? false]))
  )
  const [toast,    setToast]    = useState('')
  const [currency, setCurrency] = useState('INR')
  const [editing,  setEditing]  = useState(false)
  const [tmpName,  setTmpName]  = useState('')
  const [tmpEmail, setTmpEmail] = useState('')
  const [showReset, setShowReset] = useState(false)

  useEffect(() => {
    const u = loadUser()
    setUser(u)
    if (!u?.signedIn) router.replace('/')
  }, [])

  const saveProfile = () => {
    if (!tmpName.trim()) return
    const initials = tmpName.trim().split(' ').map((w: string) => w[0]?.toUpperCase() ?? '').join('').slice(0, 2)
    const updated: UserInfo = {
      ...(user!),
      name:   tmpName.trim(),
      email:  tmpEmail.trim(),
      avatar: initials,
    }
    localStorage.setItem('sw_user',    JSON.stringify(updated))
    localStorage.setItem('sw_profile', JSON.stringify({ name: updated.name, email: updated.email, avatar: updated.avatar }))
    setUser(updated)
    setEditing(false)
    setToast('Profile updated ✅')
  }

  const flip = (id: string) => {
    setToggles(prev => {
      const next = !prev[id]
      setToast(next ? 'Setting enabled ✓' : 'Setting disabled')
      return { ...prev, [id]: next }
    })
  }

  const handleSignOut = () => {
    localStorage.removeItem('sw_user')
    localStorage.removeItem('sw_profile')
    router.push('/')
  }

  const handleResetEverything = () => {
    ALL_KEYS.forEach(k => localStorage.removeItem(k))
    setToast('All data cleared! Redirecting…')
    setTimeout(() => router.push('/'), 1500)
  }

  const handleExport = () => {
    try {
      const expenses = JSON.parse(localStorage.getItem('sw_expenses') ?? '[]')
      const groups   = JSON.parse(localStorage.getItem('sw_groups')   ?? '[]')
      if (expenses.length === 0) { setToast('No expenses to export yet'); return }
      const rows = [
        ['Description', 'Amount', 'Category', 'Group', 'Paid By', 'Date'],
        ...expenses.map((e: any) => [
          e.description, e.amount, e.category, e.groupName, e.paidBy?.name ?? 'You',
          e.date?.seconds ? new Date(e.date.seconds * 1000).toLocaleDateString() : 'Recent',
        ]),
      ]
      const csv = rows.map(r => r.map((v: any) => `"${v}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = 'splitwise-expenses.csv'; a.click()
      URL.revokeObjectURL(url)
      setToast('CSV downloaded! 📥')
    } catch { setToast('Export failed') }
  }

  if (!user) return null

  return (
    <AppShell title="Settings">
      <div className="max-w-xl">

        {/* ── Account section ──────────────────────────────────────────────── */}
        <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Account</div>
        <div className="stat-card mb-4">

          {editing ? (
            <div className="mb-4 pb-4 border-b border-brand-50 animate-slide-up">
              <div className="text-[13px] font-medium text-gray-700 mb-3">Edit profile</div>
              <label className="block text-[12px] text-gray-500 mb-1">Full name</label>
              <input
                className="form-input w-full mb-2"
                value={tmpName}
                onChange={e => setTmpName(e.target.value)}
                autoFocus
              />
              <label className="block text-[12px] text-gray-500 mb-1">Email</label>
              <input
                className="form-input w-full mb-3"
                type="email"
                value={tmpEmail}
                onChange={e => setTmpEmail(e.target.value)}
              />
              <div className="flex gap-2">
                <button className="btn-primary px-4" onClick={saveProfile}>Save</button>
                <button className="btn-secondary px-4" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-brand-50">
              <div
                className="avatar w-12 h-12 bg-brand-100 text-brand-800 text-[14px] flex-shrink-0"
                aria-hidden="true"
              >
                {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 truncate">{user.name}</div>
                <div className="text-[12.5px] text-gray-400 truncate">
                  {user.email || 'No email set'}{user.joinedAt ? ` · Member since ${user.joinedAt}` : ''}
                </div>
              </div>
              <button
                className="btn-secondary text-[12px] px-3 py-1.5"
                onClick={() => { setTmpName(user.name); setTmpEmail(user.email); setEditing(true) }}
              >
                <i className="ti ti-pencil text-[13px]" /> Edit
              </button>
            </div>
          )}

          {/* Currency */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#E1F5EE' }} aria-hidden="true">
              <i className="ti ti-currency-rupee text-[16px]" style={{ color: '#0F6E56' }} />
            </div>
            <div className="flex-1">
              <div className="text-[13.5px] font-medium text-gray-800">Default currency</div>
              <div className="text-[12px] text-gray-400">Used for all groups and expenses</div>
            </div>
            <select
              className="form-input w-auto text-[13px] py-2 px-3"
              value={currency}
              onChange={e => { setCurrency(e.target.value); setToast('Currency updated') }}
              aria-label="Default currency"
            >
              <option value="INR">₹ INR — Indian Rupee</option>
              <option value="USD">$ USD — US Dollar</option>
              <option value="EUR">€ EUR — Euro</option>
              <option value="GBP">£ GBP — British Pound</option>
            </select>
          </div>
        </div>

        {/* ── Preferences ──────────────────────────────────────────────────── */}
        <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-2 mt-5">Preferences</div>
        <div className="stat-card mb-4 !p-0 overflow-hidden">
          {SETTINGS.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-3 px-5 py-4 ${i < SETTINGS.length - 1 ? 'border-b border-brand-50' : ''}`}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.iconBg }} aria-hidden="true">
                <i className={`ti ${s.icon} text-[16px]`} style={{ color: s.iconColor }} />
              </div>
              <div className="flex-1">
                <div className="text-[13.5px] font-medium text-gray-800">{s.title}</div>
                <div className="text-[12px] text-gray-400 mt-0.5">{s.sub}</div>
              </div>
              <button
                className={`toggle ${toggles[s.id] ? 'on' : 'off'}`}
                onClick={() => flip(s.id)}
                aria-pressed={toggles[s.id]}
                aria-label={`${s.title}: ${toggles[s.id] ? 'on' : 'off'}`}
              />
            </div>
          ))}
        </div>

        {/* ── Data / Danger zone ───────────────────────────────────────────── */}
        <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-2 mt-5">Data</div>
        <div className="stat-card !p-0 overflow-hidden mb-4">

          {/* Export */}
          <button
            className="w-full flex items-center gap-3 px-5 py-4 border-b border-brand-50 hover:bg-gray-50 transition-colors text-left"
            onClick={handleExport}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-50" aria-hidden="true">
              <i className="ti ti-download text-[16px] text-green-700" />
            </div>
            <div className="flex-1">
              <div className="text-[13.5px] font-medium text-gray-800">Export all data</div>
              <div className="text-[12px] text-gray-400">Download CSV of all expenses</div>
            </div>
            <i className="ti ti-chevron-right text-gray-300" aria-hidden="true" />
          </button>

          {/* Reset everything */}
          <button
            className="w-full flex items-center gap-3 px-5 py-4 border-b border-brand-50 hover:bg-orange-50 transition-colors text-left"
            onClick={() => setShowReset(true)}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-orange-50" aria-hidden="true">
              <i className="ti ti-refresh-alert text-[16px] text-orange-500" />
            </div>
            <div className="flex-1">
              <div className="text-[13.5px] font-medium text-orange-600">Reset everything</div>
              <div className="text-[12px] text-gray-400">Delete all groups, expenses and profile data</div>
            </div>
            <i className="ti ti-chevron-right text-gray-300" aria-hidden="true" />
          </button>

          {/* Sign out */}
          <button
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 transition-colors text-left"
            onClick={handleSignOut}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50" aria-hidden="true">
              <i className="ti ti-logout text-[16px] text-red-500" />
            </div>
            <div className="flex-1">
              <div className="text-[13.5px] font-medium text-red-500">Sign out</div>
              <div className="text-[12px] text-gray-400">End your current session</div>
            </div>
          </button>
        </div>
      </div>

      {/* ── Reset confirmation modal ─────────────────────────────────────── */}
      {showReset && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          role="dialog" aria-modal="true"
        >
          <div className="bg-white rounded-2xl p-6 w-[380px] shadow-2xl animate-slide-up text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="font-display font-600 text-[18px] text-gray-800 mb-2">Reset everything?</h2>
            <p className="text-[13.5px] text-gray-500 mb-6 leading-relaxed">
              This will permanently delete <strong>all groups, expenses, and profile data</strong>.
              You will be signed out and returned to the login page.
              <br /><br />
              <span className="text-red-500 font-medium">This cannot be undone.</span>
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 btn-secondary justify-center"
                onClick={() => setShowReset(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-[14px] transition-colors"
                onClick={handleResetEverything}
              >
                <i className="ti ti-trash" /> Yes, reset all
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </AppShell>
  )
}
