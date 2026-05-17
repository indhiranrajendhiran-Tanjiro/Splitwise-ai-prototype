'use client'
// components/ui/Toast.tsx
import { useEffect } from 'react'

interface Props {
  message:  string
  onClose:  () => void
  duration?: number
}

export default function Toast({ message, onClose, duration = 3000 }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  )
}
