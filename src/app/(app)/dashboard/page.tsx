export const dynamic = 'force-dynamic';
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  BookOpen, FlaskConical, TrendingUp, Shield,
  Plus, ArrowRight, Activity, Clock, ChevronRight
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
    <div className="animate-fade-in-up" style={{ padding: '8px' }}>
      {/* Smart X Terminal Style Breadcrumb / Header */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        <span>STRATEGY EXPLORER</span>
        <span>·</span>
        <span style={{ color: 'var(--text-primary)' }}>PORTFOLIO OVERVIEW</span>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Welcome back, {firstName}.
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
          Your quantitative strategy development workspace and macro cycle backdrop.
        </p>
      </div>

      {/* PILLAR AVERAGES / Stats Row (SmartX Style) */}
      <div style={{ marginBottom: '16px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        SYSTEM AVERAGES
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '48px' }}>
        <StatCard label="Strategies" value={strategyCount} icon={<BookOpen size={16} />} href="/strategies" suffix="/ 25" />
        <StatCard label="Backtests" value={backtestCount} icon={<FlaskConical size={16} />} href="/backtest" suffix="RUN" />
        <StatCard label="Optimizations" value={optCount} icon={<TrendingUp size={16} />} href="/optimize" suffix="TUNED" />
        <StatCard label="Robustness" value={robustCount} icon={<Shield size={16} />} href="/robustness" suffix="PASSED" />
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        
        {/* Recent strategies */}
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              RECENT STRATEGIES
            </span>
            <Link href="/strategies/new" className="hover-card" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '11px', fontWeight: 600, color: 'var(--bg-base)', textDecoration: 'none',
              background: 'var(--accent)', padding: '6px 12px', borderRadius: '40px',
              letterSpacing: '0.02em'
            }}>
              <Plus size={12} /> NEW STRATEGY
            </Link>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '0.8px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {recentStrategies.length === 0 ? (
              <div style={{ padding: '64px 20px', textAlign: 'center' }}>
                <Activity size={32} color="var(--border-emphasis)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>No strategies yet</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Create your first quantitative algorithm to get started.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentStrategies.map((s, i) => (
                  <Link key={s.id} href={`/strategies/${s.id}`} className="hover-row" style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px 20px',
                    borderBottom: i === recentStrategies.length - 1 ? 'none' : '0.8px solid var(--border)',
                    textDecoration: 'none'
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-primary)'
                    }}>
                      <BookOpen size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-overlay)', 
                          color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 
                        }}>
                          {s.phase}
                        </span>
                        <span>·</span>
                        <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity & Health */}
        <div>
           <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              SYSTEM ACTIVITY
            </span>
          </div>
          
          <div style={{
            background: 'var(--bg-surface)',
            border: '0.8px solid var(--border)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Fake activity item 1 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ marginTop: '2px' }}><Clock size={14} color="var(--accent)" /></div>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '2px' }}>
                    Automated Backtest Complete
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>2 hours ago</p>
                </div>
              </div>
              {/* Fake activity item 2 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ marginTop: '2px' }}><Activity size={14} color="var(--success)" /></div>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '2px' }}>
                    Market data synchronized
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>5 hours ago</p>
                </div>
              </div>
              {/* Fake activity item 3 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ marginTop: '2px' }}><Shield size={14} color="var(--info)" /></div>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '2px' }}>
                    Robustness sweep finished successfully across 10 instruments.
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>1 day ago</p>
                </div>
              </div>
            </div>
            
            <Link href="/activity" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              marginTop: '24px', paddingTop: '16px', borderTop: '0.8px solid var(--border)',
              fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none',
            }}>
              View all activity <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, href, suffix }: any) {
  return (
    <Link href={href} className="hover-card" style={{
      background: 'var(--bg-surface)',
      border: '0.8px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
      textDecoration: 'none',
      display: 'block'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        {icon}
        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <div style={{ fontSize: '28px', fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {value}
        </div>
        {suffix && (
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {suffix}
          </div>
        )}
      </div>
    </Link>
  )
}

