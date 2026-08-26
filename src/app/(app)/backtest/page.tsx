// src/app/(app)/backtest/page.tsx
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { FlaskConical, CheckCircle2, XCircle, ArrowRight, Play } from 'lucide-react'

export default async function GlobalBacktestPage() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const backtests = userId
    ? await prisma.backtest.findMany({
        where: { strategy: { userId } },
        include: { strategy: true },
        orderBy: { createdAt: 'desc' }
      })
    : []

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Backtesting Command Center
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Phase 7: Central ledger of all historical quantitative strategy simulations
          </p>
        </div>
      </div>

      {backtests.length === 0 ? (
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
            <FlaskConical size={22} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Backtests Run Yet
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            To run a backtest, navigate to a strategy in your workspace and advance through Constraints, Parameters, and Data selection.
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
            Select Strategy to Backtest
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Strategy</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Asset & Timeframe</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Return</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Max Drawdown</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Profit Factor</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {backtests.map((b) => {
                const passed = b.constraintsPassed
                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover-row">
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{b.strategy.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>v{b.strategy.version} · {b.strategy.language}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {b.asset} · {b.timeframe}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, color: (b.totalReturn || 0) > 0 ? 'var(--success)' : 'var(--error)' }}>
                      {(b.totalReturn || 0) > 0 ? `+${b.totalReturn}%` : `${b.totalReturn}%`}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {b.maxDrawdown}%
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {b.profitFactor}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        fontSize: '10px', fontFamily: 'monospace', fontWeight: 600,
                        padding: '2px 8px', borderRadius: '4px',
                        background: passed ? 'var(--success-dim)' : 'var(--error-dim)',
                        color: passed ? 'var(--success)' : 'var(--error)',
                        border: `1px solid ${passed ? 'var(--success)' : 'var(--error)'}40`
                      }}>
                        {passed ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <Link href={`/strategies/${b.strategy.id}/backtest/${b.id}`} style={{
                        fontSize: '12px', fontWeight: 500, color: 'var(--accent)', textDecoration: 'none'
                      }}>
                        View Report →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
