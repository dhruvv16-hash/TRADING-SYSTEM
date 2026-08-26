'use client'
// src/app/(auth)/forgot-password/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { Activity, ArrowLeft, Loader2, MailCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Enter a valid email address')
      return
    }
    setLoading(true)
    // Simulate sending reset email (backend endpoint to be implemented)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ marginBottom: '36px' }}>
          <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Strategy<span style={{ color: 'var(--accent)' }}>OS</span>
            </span>
          </Link>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--success-dim, rgba(34,197,94,0.12))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <MailCheck size={24} color="var(--success)" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Check your inbox</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              If <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> is registered,<br />
              you&apos;ll receive a reset link shortly.
            </p>
            <Link
              href="/login"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
            >
              <ArrowLeft size={13} /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '24px' }}>
              <ArrowLeft size={12} /> Back to sign in
            </Link>

            <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Reset your password
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '28px' }}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="alice@strategyos.dev"
                  style={{
                    width: '100%', padding: '8px 12px',
                    background: 'var(--bg-elevated)',
                    border: `1px solid ${error ? 'var(--error)' : 'var(--border-strong)'}`,
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                {error && <p style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px' }}>{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '9px 16px',
                  background: 'var(--accent)', border: 'none', borderRadius: '6px',
                  color: '#fff', fontSize: '13px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
