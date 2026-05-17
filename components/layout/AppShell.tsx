'use client'
// components/layout/AppShell.tsx
import Sidebar from './Sidebar'
import Topbar from './Topbar'

interface AppShellProps {
  title:        string
  onAddExpense?: () => void
  children:     React.ReactNode
}

export default function AppShell({ title, onAddExpense, children }: AppShellProps) {
  return (
    <>
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} onAddExpense={onAddExpense} />
        <main className="p-7 page-enter" aria-label={title}>
          {children}
        </main>
      </div>
    </>
  )
}
