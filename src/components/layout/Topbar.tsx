'use client'
// src/components/layout/Topbar.tsx
import { UserButton } from '@clerk/nextjs'
import { Bell, Search, Sun, Moon, Activity, HelpCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Analyze', href: '/backtest' },
  { label: 'Screener', href: '/strategies' },
  { label: 'Portfolio', href: '/dashboard' },
  { label: 'Cycle', href: '/optimize' },
  { label: 'Insights', href: '/ai-lab' },
]

export function Topbar({ user }: { user?: { name?: string | null; email?: string | null } }) {
  const [isDark, setIsDark] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  return (
    <header style={{
      height: '64px',
      background: 'var(--bg-base)',
      borderBottom: '0.8px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 32px',
      gap: '32px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
        <div style={{
          width: '24px', height: '24px',
          borderRadius: '4px',
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Activity size={14} color="#000" strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          StrategyOS
        </span>
      </Link>

      {/* Main Nav Links (SmartX Style) */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} style={{
              fontSize: '13px',
              fontWeight: 500,
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Right side tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Search */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--bg-surface)', border: '0.8px solid var(--border)', borderRadius: '6px',
          padding: '0 12px', height: '32px', color: 'var(--text-muted)', cursor: 'text'
        }}>
          <Search size={14} />
          <span style={{ fontSize: '12px' }}>Search...</span>
          <kbd style={{ fontSize: '10px', marginLeft: '16px' }}>⌘K</kbd>
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />

        {/* Theme Toggle */}
        <button onClick={toggleTheme} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px', borderRadius: '6px',
          color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer'
        }}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Help */}
        <button style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px', borderRadius: '6px',
          color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer'
        }}>
          <HelpCircle size={16} />
        </button>

        {/* Upgrade Button */}
        <Link href="/pricing" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '11px', fontWeight: 600, color: '#000', textDecoration: 'none',
          background: 'var(--accent)', padding: '6px 12px', borderRadius: '4px',
          letterSpacing: '0.05em'
        }}>
          UPGRADE
        </Link>

        {/* User dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
          <UserButton 
            appearance={{
              elements: {
                userButtonAvatarBox: "w-8 h-8 rounded-full border border-[var(--border)]",
                userButtonPopoverCard: "bg-[var(--bg-surface)] border border-[var(--border)]",
              }
            }}
          />
        </div>
      </div>
    </header>
  )
}
