// src/app/(app)/autonomous/page.tsx
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Bot, Power, Activity, ArrowRight, ShieldCheck, Plus } from 'lucide-react'

export default async function GlobalAutonomousPage() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const autonomousStrategies = userId
    ? await prisma.strategy.findMany({
        where: {
          userId,
          OR: [
            { phase: 'autonomous' },
            { status: 'active' }
          ]
        },
        include: { constraints: true, backtests: { orderBy: { createdAt: 'desc' }, take: 1 } },
        orderBy: { updatedAt: 'desc' }
      })
    : []

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Autonomous Operations Center
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Phase 10: Real-time autonomous trading agents and execution telemetry
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: 'var(--success)'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
            System Heartbeat: Active
          </div>
        </div>
      </div>

      {autonomousStrategies.length === 0 ? (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '60px 24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '48px', height: '48px',
            borderRadius: '50%',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--text-muted)'
          }}>
            <Bot size={22} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Active Autonomous Agents
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Autonomous agents are unlocked when a strategy successfully completes the pipeline (Backtest $\rightarrow$ Parameter Optimization $\rightarrow$ Robustness Stress Test).
          </p>
          <Link href="/strategies" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--accent)',
            color: '#fff',
            padding: '9px 18px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            textDecoration: 'none'
          }}>
            View Strategies Repository
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {autonomousStrategies.map((s) => {
            const isActive = s.status === 'active'
            const lastBacktest = s.backtests[0]

            return (
              <div key={s.id} style={{
                background: 'var(--bg-surface)',
                border: `1px solid ${isActive ? 'var(--border-emphasis)' : 'var(--border)'}`,
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Bot size={16} color={isActive ? 'var(--success)' : 'var(--text-muted)'} />
                      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</h3>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isActive ? 'var(--success-dim)' : 'var(--bg-elevated)',
                      color: isActive ? 'var(--success)' : 'var(--text-muted)',
                      border: `1px solid ${isActive ? 'var(--success)' : 'var(--border)'}`,
                    }}>
                      {isActive ? '● RUNNING' : '○ PAUSED'}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', fontFamily: 'monospace' }}>
                    {s.language === 'python' ? 'Python' : 'Pine Script'} · v{s.version} · Hard DD Limit: {s.constraints?.maxDrawdown || 15}%
                  </p>

                  {lastBacktest && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '10px',
                      marginBottom: '16px',
                    }}>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Return</span>
                        <p style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--success)' }}>
                          +{lastBacktest.totalReturn?.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Max DD</span>
                        <p style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {lastBacktest.maxDrawdown?.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Profit Factor</span>
                        <p style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {lastBacktest.profitFactor?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link href={`/strategies/${s.id}/autonomous`} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--accent)',
                    textDecoration: 'none'
                  }}>
                    Manage Autonomous Agent
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
