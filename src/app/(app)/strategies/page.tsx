// src/app/(app)/strategies/page.tsx
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Plus, Activity, ArrowRight } from 'lucide-react'

export default async function StrategiesPage() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  const strategies = userId
    ? await prisma.strategy.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } })
    : []

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Strategies</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{strategies.length} strategies in your workspace</p>
        </div>
        <Link href="/strategies/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 14px',
          background: 'var(--accent)', borderRadius: '5px',
          color: '#fff', fontSize: '13px', fontWeight: 500,
          textDecoration: 'none',
        }}>
          <Plus size={14} /> New Strategy
        </Link>
      </div>

      {strategies.length === 0 ? (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '64px', textAlign: 'center',
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Activity size={22} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No strategies yet</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Create your first strategy to start the development pipeline
          </p>
          <Link href="/strategies/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', background: 'var(--accent)', borderRadius: '5px',
            color: '#fff', fontSize: '13px', fontWeight: 500, textDecoration: 'none',
          }}>
            <Plus size={14} /> Create your first strategy
          </Link>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          {strategies.map((s, i) => (
            <Link key={s.id} href={`/strategies/${s.id}`} className="hover-row" style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '14px 20px',
              borderBottom: i < strategies.length - 1 ? '1px solid var(--border)' : 'none',
              textDecoration: 'none',
              transition: 'background 0.1s',
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '7px', background: 'var(--accent-dim)', border: '1px solid var(--accent)30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Activity size={16} color="var(--accent)" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>{s.name}</p>
                <p style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {s.language === 'python' ? 'Python' : 'Pine Script'} · v{s.version} · Updated {new Date(s.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <span style={{
                fontSize: '10px', fontFamily: 'monospace', fontWeight: 600,
                color: s.status === 'active' ? 'var(--success)' : 'var(--text-muted)',
                background: s.status === 'active' ? 'var(--success-dim)' : 'var(--bg-elevated)',
                border: `1px solid ${s.status === 'active' ? 'var(--success)30' : 'var(--border)'}`,
                borderRadius: '3px', padding: '2px 6px',
                textTransform: 'uppercase',
              }}>
                {s.status}
              </span>
              <ArrowRight size={14} color="var(--text-muted)" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
