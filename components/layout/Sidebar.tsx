'use client'
// components/layout/Sidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import clsx from 'clsx'

const NAV = [
  { href: '/dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard'  },
  { href: '/groups',    icon: 'ti-users-group',       label: 'Groups'     },
  { href: '/expenses',  icon: 'ti-receipt',            label: 'Expenses'   },
  { href: '/analytics', icon: 'ti-chart-bar',          label: 'Analytics'  },
  { href: '/settings',  icon: 'ti-settings',           label: 'Settings'   },
]

const LS_PROFILE = 'sw_profile'

interface Profile { name: string; email: string; avatar: string }

function loadProfile(): Profile {
  if (typeof window === 'undefined') return { name: 'You', email: '', avatar: 'ME' }
  try {
    const p = JSON.parse(localStorage.getItem(LS_PROFILE) ?? 'null')
    return p ?? { name: 'You', email: '', avatar: 'ME' }
  } catch { return { name: 'You', email: '', avatar: 'ME' } }
}

export default function Sidebar() {
  const path    = usePathname()
  const [profile, setProfile] = useState<Profile>({ name: 'You', email: '', avatar: 'ME' })
  const [editing, setEditing] = useState(false)
  const [tmpName,  setTmpName]  = useState('')
  const [tmpEmail, setTmpEmail] = useState('')

  useEffect(() => { setProfile(loadProfile()) }, [])

  const saveProfile = () => {
    const initials = tmpName.trim().split(' ').map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || 'ME'
    const p: Profile = { name: tmpName.trim() || 'You', email: tmpEmail.trim(), avatar: initials }
    localStorage.setItem(LS_PROFILE, JSON.stringify(p))
    setProfile(p)
    setEditing(false)
  }

  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-brand-100/30">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-lg shadow-md shadow-brand-400/30">
          <i className="ti ti-arrows-split" aria-hidden="true" />
        </div>
        <div>
          <div className="font-display font-700 text-[15px] text-brand-800">SplitWise AI</div>
          <div className="text-[11px] text-brand-400 mt-px">Smart expense splitting</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(item => {
          const active = path.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} className="block" aria-current={active ? 'page' : undefined}>
              <div className={clsx('nav-item', active && 'active')}>
                <i className={clsx('ti', item.icon, 'text-[18px]')} aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 py-4 border-t border-brand-100/30">
        {editing ? (
          <div className="px-2 space-y-2">
            <input
              className="w-full text-[12px] border border-brand-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand-400"
              placeholder="Your name"
              value={tmpName}
              onChange={e => setTmpName(e.target.value)}
              autoFocus
            />
            <input
              className="w-full text-[12px] border border-brand-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand-400"
              placeholder="Email (optional)"
              value={tmpEmail}
              onChange={e => setTmpEmail(e.target.value)}
            />
            <div className="flex gap-1.5">
              <button
                className="flex-1 text-[11px] bg-brand-500 text-white rounded-lg py-1.5 hover:bg-brand-600 transition-colors"
                onClick={saveProfile}
              >Save</button>
              <button
                className="flex-1 text-[11px] bg-gray-100 text-gray-600 rounded-lg py-1.5 hover:bg-gray-200 transition-colors"
                onClick={() => setEditing(false)}
              >Cancel</button>
            </div>
          </div>
        ) : (
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-brand-50 transition-colors text-left"
            onClick={() => { setTmpName(profile.name === 'You' ? '' : profile.name); setTmpEmail(profile.email); setEditing(true) }}
            title="Click to edit your profile"
          >
            <div className="avatar w-8 h-8 bg-brand-100 text-brand-800 flex-shrink-0" aria-hidden="true">{profile.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-medium text-gray-800 truncate">{profile.name}</div>
              <div className="text-[11px] text-gray-400 truncate">{profile.email || 'Click to set up profile'}</div>
            </div>
            <i className="ti ti-pencil text-gray-300 text-[13px]" aria-hidden="true" />
          </button>
        )}
      </div>
    </aside>
  )
}
