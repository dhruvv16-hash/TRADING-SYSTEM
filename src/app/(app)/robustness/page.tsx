// src/app/(app)/robustness/page.tsx
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Shield, ArrowRight, ShieldCheck } from 'lucide-react'

export default async function GlobalRobustnessPage() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const strategies = userId
    ? await prisma.strategy.findMany({
        where: { userId },
        include: {
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
            Robustness Verification Ledger
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Phase 9: Monte Carlo path perturbation, slippage stress tests, and overfit prevention
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
            <Shield size={22} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Robustness Tests Logged
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Advance strategies through the pipeline to run Monte Carlo simulations and verify out-of-sample resilience.
          </p>
          <Link href="/strategies" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--accent)', color: '#fff', padding: '9px 18px',
            borderRadius: '6px', fontSize: '13px', fontWeight: 500, textDecoration: 'none'
          }}>
            View Strategies
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {strategies.map((s) => {
            const isRobust = s.phase === 'robustness' || s.phase === 'autonomous'

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={16} color={isRobust ? 'var(--success)' : 'var(--text-muted)'} />
                      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</h3>
                    </div>
                    <span style={{
                      fontSize: '10px', fontFamily: 'monospace', fontWeight: 600,
                      padding: '2px 6px', borderRadius: '4px',
                      background: isRobust ? 'var(--success-dim)' : 'var(--bg-elevated)',
                      color: isRobust ? 'var(--success)' : 'var(--text-muted)',
                      border: `1px solid ${isRobust ? 'var(--success)' : 'var(--border)'}`
                    }}>
                      {isRobust ? 'PASSED' : 'PENDING'}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: '16px' }}>
                    Phase: {s.phase} · Hurdle Drawdown: {s.constraints?.maxDrawdown || 15}%
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link href={`/strategies/${s.id}/robustness`} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '12px', fontWeight: 500, color: 'var(--accent)', textDecoration: 'none'
                  }}>
                    Run Stress Test <ArrowRight size={13} />
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
