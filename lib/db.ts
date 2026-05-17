// lib/db.ts
// ─────────────────────────────────────────────────────────────────────────────
// Thin Firestore helpers — one function per operation.
// All functions are generic enough to be reused across pages.
// ─────────────────────────────────────────────────────────────────────────────
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ── Types ────────────────────────────────────────────────────────────────────

export interface Member {
  uid:    string
  name:   string
  email:  string
  avatar: string   // initials, e.g. "AK"
}

export interface Group {
  id:          string
  name:        string
  emoji:       string
  description: string
  members:     Member[]
  createdBy:   string
  createdAt:   Timestamp
}

export interface Expense {
  id:          string
  groupId:     string
  groupName:   string
  description: string
  amount:      number
  category:    string
  paidBy:      Member
  splitType:   'equal' | 'percentage' | 'exact'
  splits:      { member: Member; share: number }[]
  date:        Timestamp
  createdBy:   string
}

// ── Groups ───────────────────────────────────────────────────────────────────

/** Create a new group and return its Firestore ID */
export async function createGroup(data: Omit<Group, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'groups'), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

/** Fetch all groups where the current user is a member */
export async function fetchGroups(uid: string): Promise<Group[]> {
  const q = query(
    collection(db, 'groups'),
    where('members', 'array-contains-any', [{ uid }]),
  )
  // Note: Firestore array-contains-any on objects is limited.
  // For production, store member UIDs in a separate flat array field.
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Group))
}

/** Fetch a single group by ID */
export async function fetchGroup(id: string): Promise<Group | null> {
  const snap = await getDoc(doc(db, 'groups', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Group
}

/** Update a group */
export async function updateGroup(id: string, data: Partial<Group>) {
  await updateDoc(doc(db, 'groups', id), data)
}

/** Delete a group */
export async function deleteGroup(id: string) {
  await deleteDoc(doc(db, 'groups', id))
}

// ── Expenses ─────────────────────────────────────────────────────────────────

/** Add an expense to a group */
export async function addExpense(data: Omit<Expense, 'id'>) {
  const ref = await addDoc(collection(db, 'expenses'), {
    ...data,
    date: serverTimestamp(),
  })
  return ref.id
}

/** Fetch all expenses for a group, newest first */
export async function fetchExpenses(groupId: string): Promise<Expense[]> {
  const q = query(
    collection(db, 'expenses'),
    where('groupId', '==', groupId),
    orderBy('date', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense))
}

/** Fetch all expenses across all groups for a user */
export async function fetchAllExpenses(uid: string): Promise<Expense[]> {
  const q = query(
    collection(db, 'expenses'),
    where('createdBy', '==', uid),
    orderBy('date', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense))
}

/** Delete an expense */
export async function deleteExpense(id: string) {
  await deleteDoc(doc(db, 'expenses', id))
}

// ── Balance calculation ───────────────────────────────────────────────────────

export interface Balance {
  from:   Member
  to:     Member
  amount: number
}

/**
 * Calculate the minimum set of transactions needed to settle balances.
 * Uses a simple greedy algorithm: biggest creditor pays biggest debtor first.
 */
export function calculateBalances(expenses: Expense[], currentUid: string): Balance[] {
  // net[uid] = positive means owed money, negative means owes money
  const net: Record<string, { member: Member; net: number }> = {}

  for (const exp of expenses) {
    // The payer is owed money
    const payerUid = exp.paidBy.uid
    if (!net[payerUid]) net[payerUid] = { member: exp.paidBy, net: 0 }
    net[payerUid].net += exp.amount

    // Each splitter owes their share
    for (const split of exp.splits) {
      const uid = split.member.uid
      if (!net[uid]) net[uid] = { member: split.member, net: 0 }
      net[uid].net -= split.share
    }
  }

  const creditors = Object.values(net).filter(n => n.net > 0.01).sort((a, b) => b.net - a.net)
  const debtors   = Object.values(net).filter(n => n.net < -0.01).sort((a, b) => a.net - b.net)
  const balances: Balance[] = []

  let i = 0, j = 0
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor   = debtors[j]
    const amount   = Math.min(creditor.net, -debtor.net)

    if (amount > 0.01) {
      balances.push({ from: debtor.member, to: creditor.member, amount })
    }

    creditor.net -= amount
    debtor.net   += amount
    if (creditor.net < 0.01) i++
    if (-debtor.net < 0.01) j++
  }

  return balances
}

// ── Category helpers ──────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: 'food',          label: 'Food & dining',   emoji: '🍽️',  color: '#7F77DD' },
  { id: 'accommodation', label: 'Accommodation',   emoji: '🏠',  color: '#5DCAA5' },
  { id: 'transport',     label: 'Transport',       emoji: '🚗',  color: '#EF9F27' },
  { id: 'activities',   label: 'Activities',      emoji: '🎡',  color: '#E24B4A' },
  { id: 'groceries',    label: 'Groceries',       emoji: '🛒',  color: '#378ADD' },
  { id: 'utilities',    label: 'Utilities',       emoji: '💡',  color: '#3B6D11' },
  { id: 'other',        label: 'Other',           emoji: '🧾',  color: '#888780' },
]

export function getCategoryMeta(id: string) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}
