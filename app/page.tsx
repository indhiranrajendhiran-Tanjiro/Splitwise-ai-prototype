'use client'
// app/page.tsx — Login / landing page
// Uses localStorage-based auth (no Firebase needed).
// Google button captures user's name/email via a simple modal.
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const LS_USER = 'sw_user'

interface UserInfo { name: string; email: string; avatar: string; signedIn: boolean; joinedAt: string }

function saveUser(u: UserInfo) {
  if (typeof window !== 'undefined') localStorage.setItem(LS_USER, JSON.stringify(u))
}

export default function LoginPage() {
  const router = useRouter()
  const [step,     setStep]     = useState<'landing' | 'google-modal'>('landing')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // If already signed in, redirect
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem(LS_USER) ?? 'null')
      if (u?.signedIn) router.replace('/dashboard')
    } catch {}
  }, [])

  const handleGoogleSignIn = () => {
    if (!name.trim()) { setError('Please enter your name'); return }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email'); return }
    setLoading(true)
    setTimeout(() => {
      const initials = name.trim().split(' ').map((w: string) => w[0]?.toUpperCase() ?? '').join('').slice(0, 2)
      const u: UserInfo = {
        name:     name.trim(),
        email:    email.trim(),
        avatar:   initials,
        signedIn: true,
        joinedAt: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      }
      saveUser(u)
      // Also seed profile for sidebar
      localStorage.setItem('sw_profile', JSON.stringify({ name: u.name, email: u.email, avatar: u.avatar }))
      router.push('/dashboard')
    }, 1000)
  }

  const handleDemo = () => {
    const u: UserInfo = {
      name: 'Guest User', email: 'guest@splitwise.ai', avatar: 'GU', signedIn: true,
      joinedAt: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    }
    saveUser(u)
    localStorage.setItem('sw_profile', JSON.stringify({ name: u.name, email: u.email, avatar: u.avatar }))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-brand-100/50 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-[-80px] left-[-80px] w-[350px] h-[350px] rounded-full bg-blue-100/40 blur-3xl" aria-hidden="true" />

      <div className="relative glass rounded-3xl p-12 w-full max-w-md mx-4 text-center shadow-modal animate-slide-up">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-3xl shadow-lg shadow-brand-400/30">
            <i className="ti ti-arrows-split" aria-hidden="true" />
          </div>
        </div>

        <h1 className="font-display font-700 text-[28px] text-brand-900 mb-2">SplitWise AI</h1>
        <p className="text-gray-500 text-[15px] mb-8 leading-relaxed">
          Smart expense splitting for trips, hostels,<br />and group activities — powered by AI.
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { emoji: '🏖️', text: 'Trip splits'    },
            { emoji: '🤖', text: 'AI insights'    },
            { emoji: '⚡', text: 'Instant settle' },
          ].map(f => (
            <div key={f.text} className="bg-brand-50 rounded-xl py-3 px-2">
              <div className="text-xl mb-1" aria-hidden="true">{f.emoji}</div>
              <div className="text-[11.5px] font-medium text-brand-700">{f.text}</div>
            </div>
          ))}
        </div>

        {/* Google sign-in modal / form */}
        {step === 'google-modal' ? (
          <div className="text-left animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => { setStep('landing'); setError('') }} className="text-gray-400 hover:text-gray-600">
                <i className="ti ti-arrow-left text-[18px]" />
              </button>
              <div className="font-semibold text-gray-700 text-[15px]">Sign in with Google</div>
            </div>

            {error && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[13px]">{error}</div>
            )}

            <label className="block text-[12px] text-gray-500 font-medium mb-1">Full name *</label>
            <input
              className="form-input w-full mb-3"
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              autoFocus
            />
            <label className="block text-[12px] text-gray-500 font-medium mb-1">Gmail address *</label>
            <input
              className="form-input w-full mb-5"
              placeholder="e.g. priya@gmail.com"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleGoogleSignIn()}
            />

            <button
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-gray-200 bg-white text-[14px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-card disabled:opacity-60"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <><i className="ti ti-loader-2 animate-spin text-[16px] text-brand-500" /> Signing in…</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path fill="#4285F4" d="M17.64 9.2a10.3 10.3 0 00-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.91a8.78 8.78 0 002.69-6.62z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26a5.55 5.55 0 01-8.26-2.91H.77v2.33A9 9 0 009 18z"/>
                    <path fill="#FBBC05" d="M3.79 10.65A5.42 5.42 0 013.5 9c0-.57.1-1.12.29-1.65V5.02H.77A9 9 0 000 9c0 1.45.35 2.82.77 4.03l3.02-2.38z"/>
                    <path fill="#EA4335" d="M9 3.58a4.86 4.86 0 013.44 1.35l2.58-2.58A8.65 8.65 0 009 0 9 9 0 00.77 5.02l3.02 2.33A5.37 5.37 0 019 3.58z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Sign in buttons */}
            <button
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-gray-200 bg-white text-[14px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all mb-3 shadow-card"
              onClick={() => setStep('google-modal')}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2a10.3 10.3 0 00-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.91a8.78 8.78 0 002.69-6.62z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26a5.55 5.55 0 01-8.26-2.91H.77v2.33A9 9 0 009 18z"/>
                <path fill="#FBBC05" d="M3.79 10.65A5.42 5.42 0 013.5 9c0-.57.1-1.12.29-1.65V5.02H.77A9 9 0 000 9c0 1.45.35 2.82.77 4.03l3.02-2.38z"/>
                <path fill="#EA4335" d="M9 3.58a4.86 4.86 0 013.44 1.35l2.58-2.58A8.65 8.65 0 009 0 9 9 0 00.77 5.02l3.02 2.33A5.37 5.37 0 019 3.58z"/>
              </svg>
              Continue with Google
            </button>

            <button
              className="btn-primary w-full justify-center py-3.5 text-[14px]"
              onClick={handleDemo}
            >
              <i className="ti ti-arrow-right" aria-hidden="true" />
              Try demo — no sign-in needed
            </button>

            <p className="text-[11px] text-gray-400 mt-5">
              By continuing you agree to our Terms of Service and Privacy Policy.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
