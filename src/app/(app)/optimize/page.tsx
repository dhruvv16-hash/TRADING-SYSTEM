// src/app/(app)/optimize/page.tsx
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { TrendingUp, Cpu, ArrowRight, CheckCircle2 } from 'lucide-react'

export default async function GlobalOptimizePage() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const strategies = userId
    ? await prisma.strategy.findMany({
        where: { userId },
        include: {
          parameters: true,
          constraints: true,
          backtests: { orderBy: { createdAt: 'desc' }, take: 1 }
        },
        orderBy: { updatedAt: 'desc' }
      })
    : []

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Parameter Optimization Laboratory
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Phase 8: Systematic grid search sweeps and parameter sensitivity analysis
          </p>
        </div>
      </div>

      {strategies.length === 0 ? (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '60px 24px', textAlign: 'center',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', color: 'var(--text-muted)'
          }}>
            <TrendingUp size={22} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Strategies in Optimization Stage
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Create and backtest a strategy to discover parameter bounds and run grid searches.
          </p>
          <Link href="/strategies/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--accent)', color: '#fff', padding: '9px 18px',
            borderRadius: '6px', fontSize: '13px', fontWeight: 500, textDecoration: 'none'
          }}>
            Create Strategy
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {strategies.map((s) => {
            const hasBacktest = s.backtests.length > 0
            const lastBacktest = s.backtests[0]
            const isReady = s.phase === 'backtest' || s.phase === 'optimize' || s.phase === 'robustness' || s.phase === 'autonomous'

            return (
              <div key={s.id} style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</h3>
                    <span style={{
                      fontSize: '10px', fontFamily: 'monospace', fontWeight: 600,
                      padding: '2px 6px', borderRadius: '4px',
                      background: 'var(--bg-elevated)', color: 'var(--accent)', border: '1px solid var(--border)'
                    }}>
                      Phase: {s.phase}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: '16px' }}>
                    {s.parameters.length} Parameters · Hurdle DD: {s.constraints?.maxDrawdown || 15}% · PF: {s.constraints?.minProfitFactor || 1.5}
                  </p>

                  {hasBacktest && (
                    <div style={{
                      background: 'var(--bg-base)', border: '1px solid var(--border)',
                      borderRadius: '6px', padding: '12px', marginBottom: '16px', fontSize: '12px', fontFamily: 'monospace'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Last Return:</span>
                        <span style={{ color: 'var(--success)' }}>+{lastBacktest.totalReturn}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Last Max DD:</span>
                        <span style={{ color: 'var(--text-primary)' }}>{lastBacktest.maxDrawdown}%</span>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link href={`/strategies/${s.id}/optimize`} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '12px', fontWeight: 500, color: 'var(--accent)', textDecoration: 'none'
                  }}>
                    Open Optimization Lab <ArrowRight size={13} />
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
