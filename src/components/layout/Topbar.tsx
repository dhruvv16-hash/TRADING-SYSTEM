'use client'
// src/components/layout/Topbar.tsx
import { UserButton } from '@clerk/nextjs'
import { Bell, Search, Circle } from 'lucide-react'

export function Topbar({ user }: { user?: { name?: string | null; email?: string | null } }) {
  return (
    <header style={{
      height: '56px',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: '16px',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      flexShrink: 0,
    }}>
      {/* Search */}
      <div style={{
        flex: 1,
        maxWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '0 12px',
        height: '32px',
      }}>
        <Search size={12} color="var(--text-muted)" />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          Search strategies, backtests...
        </span>
        <kbd style={{
          marginLeft: 'auto',
          fontSize: '10px',
          fontFamily: 'monospace',
          color: 'var(--text-muted)',
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border)',
          borderRadius: '3px',
          padding: '1px 5px',
        }}>⌘K</kbd>
      </div>

      <div style={{ flex: 1 }} />

      {/* System status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'var(--success)',
          boxShadow: '0 0 4px var(--success)',
        }} />
        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
          System OK
        </span>
      </div>

      {/* Notifications */}
      <button style={{
        position: 'relative',
        width: '32px', height: '32px',
        borderRadius: '5px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
      }}>
        <Bell size={13} />
      </button>

      {/* User dropdown via Clerk */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <UserButton 
          appearance={{
            elements: {
              userButtonAvatarBox: "w-8 h-8 rounded-md",
              userButtonPopoverCard: "bg-[var(--bg-surface)] border border-[var(--border)]",
            }
          }}
        />
      </div>
    </header>
  )
}
