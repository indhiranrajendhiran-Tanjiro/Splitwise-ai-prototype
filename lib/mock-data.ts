// lib/mock-data.ts
// No demo data — all data is entered manually by the user at runtime.
import { Group, Expense, Member, Balance } from './db'

export const DEMO_USER: Member = {
  uid:    'local-user',
  name:   'You',
  email:  '',
  avatar: 'ME',
}

export const DEMO_MEMBERS: Member[] = [DEMO_USER]

export const DEMO_GROUPS: Group[] = []

export const DEMO_EXPENSES: Expense[] = []

export const DEMO_BALANCES: Balance[] = []

export const MONTHLY_SPEND: { month: string; amount: number }[] = []

export const CATEGORY_SPEND: { name: string; value: number; color: string }[] = []
