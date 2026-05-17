'use client'
// app/groups/page.tsx
import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import Toast from '@/components/ui/Toast'
import { Group, Member } from '@/lib/db'

const LS_GROUPS = 'sw_groups'

function loadGroups(): Group[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_GROUPS) ?? '[]') } catch { return [] }
}
function saveGroups(gs: Group[]) {
  localStorage.setItem(LS_GROUPS, JSON.stringify(gs))
}

const AVATAR_COLORS = [
  { bg: '#CECBF6', text: '#3C3489' },
  { bg: '#9FE1CB', text: '#085041' },
  { bg: '#F5C4B3', text: '#712B13' },
  { bg: '#B5D4F4', text: '#0C447C' },
  { bg: '#FAC775', text: '#633806' },
  { bg: '#F4C0D1', text: '#4B1528' },
]

const EMOJIS = ['🌍','🏖️','🏠','🚗','🍱','🎯','🎉','✈️','🏕️','🎵']

export default function GroupsPage() {
  const [groups,   setGroups]   = useState<Group[]>([])
  const [toast,    setToast]    = useState('')
  const [creating, setCreating] = useState(false)
  const [newName,  setNewName]  = useState('')
  const [newEmoji, setNewEmoji] = useState('🌍')
  const [newDesc,  setNewDesc]  = useState('')

  // Member-add modal state
  const [memberGroupId,  setMemberGroupId]  = useState<string | null>(null)
  const [memberName,     setMemberName]     = useState('')
  const [memberEmail,    setMemberEmail]    = useState('')

  useEffect(() => { setGroups(loadGroups()) }, [])

  const createGroup = () => {
    if (!newName.trim()) return
    const g: Group = {
      id:          `g${Date.now()}`,
      name:        newName.trim(),
      emoji:       newEmoji,
      description: newDesc.trim() || 'No description',
      members:     [{ uid: 'local-user', name: 'You', email: '', avatar: 'ME' }],
      createdBy:   'local-user',
      createdAt:   { toDate: () => new Date() } as any,
    }
    const updated = [...groups, g]
    setGroups(updated)
    saveGroups(updated)
    setNewName(''); setNewDesc(''); setCreating(false)
    setToast('Group created! 🎉')
  }

  const deleteGroup = (id: string) => {
    const updated = groups.filter(g => g.id !== id)
    setGroups(updated)
    saveGroups(updated)
    setToast('Group deleted')
  }

  const addMember = () => {
    if (!memberName.trim() || !memberGroupId) return
    const initials = memberName.trim().split(' ').map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2)
    const member: Member = {
      uid:    `m${Date.now()}`,
      name:   memberName.trim(),
      email:  memberEmail.trim(),
      avatar: initials,
    }
    const updated = groups.map(g =>
      g.id === memberGroupId ? { ...g, members: [...g.members, member] } : g
    )
    setGroups(updated)
    saveGroups(updated)
    setMemberName(''); setMemberEmail('')
    setToast(`${member.name} added! 👤`)
  }

  const removeMember = (groupId: string, uid: string) => {
    if (uid === 'local-user') { setToast("Can't remove yourself"); return }
    const updated = groups.map(g =>
      g.id === groupId ? { ...g, members: g.members.filter(m => m.uid !== uid) } : g
    )
    setGroups(updated)
    saveGroups(updated)
    setToast('Member removed')
  }

  const activeGroup = groups.find(g => g.id === memberGroupId)

  return (
    <AppShell title="My groups">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-[14px] text-gray-400">
          {groups.length} group{groups.length !== 1 ? 's' : ''} · {groups.reduce((a, g) => a + g.members.length, 0)} members total
        </p>
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <i className="ti ti-plus text-[15px]" aria-hidden="true" /> New group
        </button>
      </div>

      {/* New group inline form */}
      {creating && (
        <div className="mb-5 p-4 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50 animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <select
              className="text-2xl bg-transparent border border-brand-200 rounded-lg px-2 py-1"
              value={newEmoji}
              onChange={e => setNewEmoji(e.target.value)}
              aria-label="Group emoji"
            >
              {EMOJIS.map(e => <option key={e}>{e}</option>)}
            </select>
            <input
              className="form-input flex-1"
              placeholder="Group name…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createGroup()}
              autoFocus
              aria-label="Group name"
            />
          </div>
          <input
            className="form-input w-full mb-3"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            aria-label="Group description"
          />
          <div className="flex gap-2">
            <button className="btn-primary px-4" onClick={createGroup}>Create</button>
            <button className="btn-secondary px-4" onClick={() => { setCreating(false); setNewName(''); setNewDesc('') }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {groups.length === 0 && !creating && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">👥</div>
          <div className="text-[16px] font-medium text-gray-600 mb-2">No groups yet</div>
          <div className="text-[13px]">Create your first group to start splitting expenses</div>
        </div>
      )}

      {/* Group grid */}
      {groups.length > 0 && (
        <div className="grid grid-cols-3 gap-4" role="list" aria-label="Your groups">
          {groups.map(group => (
            <div key={group.id} className="group-card h-full relative" role="listitem">
              {/* Delete btn */}
              <button
                onClick={() => deleteGroup(group.id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-300 hover:text-red-500 transition-all"
                aria-label={`Delete group ${group.name}`}
              >
                <i className="ti ti-trash text-[12px]" />
              </button>

              <div className="text-[30px] mb-3" aria-hidden="true">{group.emoji}</div>
              <div className="font-display font-600 text-[15px] text-gray-800">{group.name}</div>
              <div className="text-[12px] text-gray-400 mt-1">{group.members.length} member{group.members.length !== 1 ? 's' : ''} · {group.description}</div>

              {/* Member avatars */}
              {group.members.length > 0 && (
                <div className="member-stack mt-3" aria-label={`Members: ${group.members.map(m => m.name).join(', ')}`}>
                  {group.members.slice(0, 4).map((m, i) => (
                    <button
                      key={m.uid}
                      className="avatar w-7 h-7 text-[10px] relative group/av"
                      style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length].bg, color: AVATAR_COLORS[i % AVATAR_COLORS.length].text }}
                      onClick={() => removeMember(group.id, m.uid)}
                      title={m.uid === 'local-user' ? m.name : `Remove ${m.name}`}
                      aria-label={m.uid === 'local-user' ? m.name : `Remove ${m.name}`}
                    >
                      {m.avatar}
                    </button>
                  ))}
                  {group.members.length > 4 && (
                    <div className="avatar w-7 h-7 text-[10px] bg-gray-100 text-gray-500">+{group.members.length - 4}</div>
                  )}
                </div>
              )}

              {/* Add member */}
              <button
                className="mt-3 text-[11.5px] text-brand-500 hover:text-brand-700 flex items-center gap-1"
                onClick={() => setMemberGroupId(group.id)}
              >
                <i className="ti ti-user-plus text-[13px]" /> Add member
              </button>
            </div>
          ))}

          {/* Add new card */}
          <button
            onClick={() => setCreating(true)}
            className="group-card flex flex-col items-center justify-center gap-2 border-2 border-dashed !border-brand-100 !bg-transparent hover:!border-brand-300 hover:!bg-brand-50 min-h-[180px]"
            aria-label="Create new group"
          >
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-brand-200 flex items-center justify-center text-brand-300">
              <i className="ti ti-plus text-[20px]" aria-hidden="true" />
            </div>
            <span className="text-[13px] text-gray-400 font-medium">Create new group</span>
          </button>
        </div>
      )}

      {/* Add member modal */}
      {memberGroupId && activeGroup && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Add member"
        >
          <div className="bg-white rounded-2xl p-6 w-[380px] shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-600 text-[16px] text-gray-800">
                Add member to {activeGroup.emoji} {activeGroup.name}
              </h2>
              <button onClick={() => { setMemberGroupId(null); setMemberName(''); setMemberEmail('') }} className="text-gray-400 hover:text-gray-600">
                <i className="ti ti-x text-[18px]" />
              </button>
            </div>

            <label className="block text-[12px] text-gray-500 mb-1 font-medium">Name *</label>
            <input
              className="form-input w-full mb-3"
              placeholder="e.g. Priya Sharma"
              value={memberName}
              onChange={e => setMemberName(e.target.value)}
              autoFocus
            />
            <label className="block text-[12px] text-gray-500 mb-1 font-medium">Email (optional)</label>
            <input
              className="form-input w-full mb-4"
              placeholder="e.g. priya@email.com"
              value={memberEmail}
              onChange={e => setMemberEmail(e.target.value)}
            />

            {/* Current members */}
            <div className="mb-4">
              <div className="text-[11.5px] text-gray-400 font-medium mb-2">Current members</div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {activeGroup.members.map((m, i) => (
                  <div key={m.uid} className="flex items-center gap-2 text-[12.5px]">
                    <div
                      className="avatar w-6 h-6 text-[9px] flex-shrink-0"
                      style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length].bg, color: AVATAR_COLORS[i % AVATAR_COLORS.length].text }}
                    >
                      {m.avatar}
                    </div>
                    <span className="flex-1 text-gray-700">{m.name}</span>
                    {m.uid !== 'local-user' && (
                      <button onClick={() => removeMember(activeGroup.id, m.uid)} className="text-gray-300 hover:text-red-400">
                        <i className="ti ti-x text-[12px]" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="btn-primary flex-1"
                onClick={() => { addMember() }}
                disabled={!memberName.trim()}
              >
                <i className="ti ti-user-plus" /> Add
              </button>
              <button className="btn-secondary px-4" onClick={() => { setMemberGroupId(null); setMemberName(''); setMemberEmail('') }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </AppShell>
  )
}
