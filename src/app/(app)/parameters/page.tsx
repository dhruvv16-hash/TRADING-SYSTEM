// src/app/(app)/parameters/page.tsx
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { SlidersHorizontal, ArrowRight, Settings2 } from 'lucide-react'

export default async function GlobalParametersPage() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const strategies = userId
    ? await prisma.strategy.findMany({
        where: { userId },
        include: { parameters: true },
        orderBy: { updatedAt: 'desc' }
      })
    : []

  const totalParams = strategies.reduce((acc, s) => acc + s.parameters.length, 0)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Parameters Repository
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Phase 4 & 5: Centralized registry of all discovered indicator variables and optimization bounds
          </p>
        </div>

        <div style={{
          fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)',
          background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: '6px'
        }}>
          {totalParams} Total Variables Registered
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
            <SlidersHorizontal size={22} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Parameters Configured
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Create a strategy to automatically extract indicator parameters (SMAs, RSI, MACD, Lookback periods).
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {strategies.map((s) => (
            <div key={s.id} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '8px', overflow: 'hidden'
            }}>
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--bg-base)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {s.parameters.length} Parameters · Phase: {s.phase}
                  </span>
                </div>

                <Link href={`/strategies/${s.id}/parameters`} style={{
                  fontSize: '12px', fontWeight: 500, color: 'var(--accent)', textDecoration: 'none'
                }}>
                  Configure Bounds →
                </Link>
              </div>

              {s.parameters.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                  No parameters discovered yet. Run Auto-Discover on this strategy.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                      <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Name</th>
                      <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
                      <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Default Value</th>
                      <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Min Bound</th>
                      <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Max Bound</th>
                      <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Step</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.parameters.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover-row">
                        <td style={{ padding: '12px 20px', fontSize: '13px', fontFamily: 'monospace', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {p.name}
                        </td>
                        <td style={{ padding: '12px 20px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {p.type}
                        </td>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--accent)' }}>
                          {p.defaultVal}
                        </td>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                          {p.minVal || '—'}
                        </td>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                          {p.maxVal || '—'}
                        </td>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                          {p.step || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
