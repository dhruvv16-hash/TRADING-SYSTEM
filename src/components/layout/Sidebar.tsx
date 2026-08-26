'use client'
// src/components/layout/Sidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity, LayoutDashboard, BookOpen, SlidersHorizontal,
  Database, FlaskConical, TrendingUp, Shield, Bot,
  Cpu, Settings, ChevronRight, Play,
} from 'lucide-react'

type NavItem = {
  icon: React.ElementType
  label: string
  href: string
  group: 'workspace' | 'pipeline' | 'tools'
  phase?: number
}

const NAV: NavItem[] = [
  // Workspace
  { icon: LayoutDashboard, label: 'Overview',     href: '/dashboard',   group: 'workspace' },
  { icon: BookOpen,        label: 'Strategies',   href: '/strategies',  group: 'workspace' },
  // Pipeline
  { icon: SlidersHorizontal, label: 'Parameters', href: '/parameters',  group: 'pipeline', phase: 4 },
  { icon: Database,          label: 'Data',        href: '/data',        group: 'pipeline', phase: 6 },
  { icon: FlaskConical,      label: 'Backtesting', href: '/backtest',    group: 'pipeline', phase: 7 },
  { icon: TrendingUp,        label: 'Optimization',href: '/optimize',    group: 'pipeline', phase: 8 },
  { icon: Shield,            label: 'Robustness',  href: '/robustness',  group: 'pipeline', phase: 9 },
  { icon: Bot,               label: 'Autonomous',  href: '/autonomous',  group: 'pipeline', phase: 10 },
  { icon: Play,              label: 'Algo Trading',href: '/live_trading',group: 'pipeline', phase: 11 },
  // Tools
  { icon: Cpu,               label: 'AI Lab',      href: '/ai-lab',      group: 'tools' },
  { icon: Settings,          label: 'Settings',    href: '/settings',    group: 'tools' },
]

export function Sidebar({ user }: { user?: { name?: string | null; email?: string | null } }) {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid var(--border)',
        gap: '10px',
        flexShrink: 0,
      }}>
        <div style={{
          width: '28px', height: '28px',
          borderRadius: '6px',
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Activity size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          Strategy<span style={{ color: 'var(--accent)' }}>OS</span>
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        <NavGroup label="WORKSPACE">
          {NAV.filter(n => n.group === 'workspace').map(item => (
            <NavLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(item.href + '/')} />
          ))}
        </NavGroup>

        <NavGroup label="PIPELINE">
          {NAV.filter(n => n.group === 'pipeline').map(item => (
            <NavLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(item.href + '/')} />
          ))}
        </NavGroup>

        <NavGroup label="TOOLS">
          {NAV.filter(n => n.group === 'tools').map(item => (
            <NavLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(item.href + '/')} />
          ))}
        </NavGroup>
      </nav>

      {/* User */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '28px', height: '28px',
          borderRadius: '50%',
          background: 'var(--accent-dim)',
          border: '1px solid var(--border-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 600,
          color: 'var(--accent)',
          flexShrink: 0,
        }}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.name || 'User'}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.email}
          </p>
        </div>
      </div>
    </aside>
  )
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <p style={{
        fontSize: '10px',
        fontFamily: 'monospace',
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        padding: '8px 16px 4px',
      }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 16px',
        margin: '1px 8px',
        borderRadius: '5px',
        background: active ? 'var(--accent-dim)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        fontSize: '13px',
        fontWeight: active ? 500 : 400,
        textDecoration: 'none',
        transition: 'background 0.12s, color 0.12s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'var(--bg-elevated)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }
      }}
    >
      <Icon size={14} strokeWidth={active ? 2 : 1.7} />
      <span style={{ flex: 1 }}>{item.label}</span>
    </Link>
  )
}
