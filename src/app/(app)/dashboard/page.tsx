// src/app/(app)/dashboard/page.tsx
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  BookOpen, FlaskConical, TrendingUp, Shield,
  Plus, ArrowRight, Activity, Clock
} from 'lucide-react'

export default async function DashboardPage() {
  const user = await currentUser()
  const userId = user?.id
  if (!userId) redirect('/login')

  const [strategyCount, backtestCount, optCount, robustCount] = await Promise.all([
    prisma.strategy.count({ where: { userId } }),
    prisma.backtest.count({
      where: { strategy: { userId } }
    }),
    prisma.strategy.count({
      where: { userId, phase: { in: ['optimize', 'robustness', 'autonomous'] } }
    }),
    prisma.strategy.count({
      where: { userId, phase: { in: ['robustness', 'autonomous'] } }
    }),
  ])

  const recentStrategies = await prisma.strategy.findMany({
    where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      })

  const firstName = user?.firstName || 'there'

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Welcome back, {firstName}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Your quantitative strategy development workspace
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <StatCard label="Strategies" value={strategyCount} icon={<BookOpen size={16} />} href="/strategies" />
        <StatCard label="Backtests Run" value={backtestCount} icon={<FlaskConical size={16} />} href="/backtest" />
        <StatCard label="Optimizations" value={optCount} icon={<TrendingUp size={16} />} href="/optimize" />
        <StatCard label="Robustness Tests" value={robustCount} icon={<Shield size={16} />} href="/robustness" />
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        {/* Recent strategies */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Strategies</h2>
            <Link href="/strategies/new" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500,
            }}>
              <Plus size={12} /> New Strategy
            </Link>
          </div>

          {recentStrategies.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{
                width: '40px', height: '40px',
                borderRadius: '8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <BookOpen size={18} color="var(--text-muted)" />
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>No strategies yet</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Create your first strategy to begin the pipeline
              </p>
              <Link href="/strategies/new" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px',
                background: 'var(--accent)', borderRadius: '5px',
                color: '#fff', fontSize: '12px', fontWeight: 500,
                textDecoration: 'none',
              }}>
                <Plus size={12} /> Create Strategy
              </Link>
            </div>
          ) : (
            <div>
              {recentStrategies.map((s) => (
                <Link key={s.id} href={`/strategies/${s.id}`} className="hover-row" style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border)',
                  textDecoration: 'none',
                  transition: 'background 0.1s',
                }}>
                  <div style={{
                    width: '32px', height: '32px',
                    borderRadius: '6px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Activity size={14} color="var(--accent)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.name}
                    </p>
                    <p style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {s.language === 'python' ? 'Python' : 'Pine Script'} · v{s.version} · {s.status}
                    </p>
                  </div>
                  <PhaseBadge phase={s.phase} />
                  <ArrowRight size={13} color="var(--text-muted)" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Workflow guide */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          height: 'fit-content',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Strategy Pipeline</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
              10-phase development workflow
            </p>
          </div>
          <div style={{ padding: '12px 0' }}>
            {PIPELINE_PHASES.map((phase, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: '20px', height: '20px',
                    borderRadius: '50%',
                    background: phase.available ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    border: `1px solid ${phase.available ? 'var(--accent)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontFamily: 'monospace', fontWeight: 600,
                    color: phase.available ? 'var(--accent)' : 'var(--text-muted)',
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  {i < PIPELINE_PHASES.length - 1 && (
                    <div style={{ width: '1px', height: '16px', background: 'var(--border)', marginTop: '2px' }} />
                  )}
                </div>
                <div style={{ paddingTop: '1px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: phase.available ? 'var(--text-primary)' : 'var(--text-muted)', marginBottom: '1px' }}>
                    {phase.label}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {phase.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────────── */
const PIPELINE_PHASES = [
  { label: '1. Strategy',          description: 'Write Python / Pine Script',    available: true },
  { label: '2. Constraints',       description: 'Set performance requirements',   available: true },
  { label: '3. AI Conversion',     description: 'Text → strategy via AI',         available: true },
  { label: '4. Parameter Discovery', description: 'Find tunable params',          available: true },
  { label: '5. Configuration',     description: 'Set parameter ranges',           available: true },
  { label: '6. Data Selection',    description: 'Asset + historical data',        available: true },
  { label: '7. Backtesting',       description: 'Run initial backtest',           available: true },
  { label: '8. Optimization',      description: 'Find best parameter set',        available: true },
  { label: '9. Robustness',        description: 'Walk-forward + Monte Carlo',     available: true },
  { label: '10. Autonomous',       description: 'Live autonomous execution',     available: true },
]

function StatCard({ label, value, icon, href }: { label: string; value: number; icon: React.ReactNode; href: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div className="hover-card" style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '16px 20px',
        transition: 'border-color 0.12s',
        cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
          <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        </div>
        <p style={{ fontSize: '28px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>
          {value}
        </p>
      </div>
    </Link>
  )
}

function PhaseBadge({ phase }: { phase: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    strategy:    { label: 'Strategy',    color: 'var(--accent)',   bg: 'var(--accent-dim)' },
    constraints: { label: 'Constraints', color: 'var(--accent)',   bg: 'var(--accent-dim)' },
    parameters:  { label: 'Parameters',  color: 'var(--info)',     bg: 'var(--info-dim)' },
    data:        { label: 'Data',        color: 'var(--warning)',  bg: 'var(--warning-dim)' },
    backtest:    { label: 'Backtest',    color: 'var(--success)',  bg: 'var(--success-dim)' },
    optimize:    { label: 'Optimize',    color: 'var(--success)',  bg: 'var(--success-dim)' },
    robustness:  { label: 'Robustness',  color: 'var(--success)',  bg: 'var(--success-dim)' },
    autonomous:  { label: 'Autonomous',  color: 'var(--error)',    bg: 'var(--error-dim)' },
  }
  const m = map[phase] ?? { label: phase, color: 'var(--text-muted)', bg: 'var(--bg-elevated)' }
  return (
    <span style={{
      fontSize: '10px', fontFamily: 'monospace', fontWeight: 600,
      color: m.color, background: m.bg,
      border: `1px solid ${m.color}30`,
      borderRadius: '3px', padding: '2px 6px',
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      {m.label}
    </span>
  )
}
