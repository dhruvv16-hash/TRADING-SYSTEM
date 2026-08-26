// src/app/(app)/strategies/[id]/page.tsx
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Play, Settings, Database, ArrowRight, TrendingUp, Shield, Bot } from 'lucide-react'
import { StrategyPipelineStepper } from '@/components/strategy/StrategyPipelineStepper'

export default async function StrategyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const strategy = await prisma.strategy.findUnique({
    where: { id },
    include: {
      constraints: true,
      parameters: true,
      backtests: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  })

  if (!strategy) notFound()

  const lastBacktest = strategy.backtests[0]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Persistent Strategy OS Stepper */}
      <StrategyPipelineStepper
        strategyId={strategy.id}
        strategyName={strategy.name}
        version={strategy.version}
        language={strategy.language}
        currentStage="strategy"
        currentPhase={strategy.phase}
        backtestId={lastBacktest?.status === 'completed' ? lastBacktest.id : undefined}
        constraintsPassed={lastBacktest?.constraintsPassed}
      />

      {/* Main Workspace Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Left: Source Code Viewer */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-base)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Strategy Source Code
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                {strategy.language === 'python' ? 'main.py' : 'strategy.pine'}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {strategy.code.split('\n').length} lines
            </span>
          </div>

          <div style={{ padding: '16px 20px', background: '#090B0E', overflowX: 'auto', flex: 1 }}>
            <pre style={{ margin: 0, fontSize: '12.5px', fontFamily: 'JetBrains Mono, monospace', color: '#D4D4D4', lineHeight: 1.6 }}>
              <code>{strategy.code}</code>
            </pre>
          </div>
        </div>

        {/* Right: Quick Action Pipeline Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Pipeline Next Action
            </h2>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              {strategy.phase === 'strategy' && 'Configure performance constraints (Min Trades, Max Drawdown %, Profit Factor) to set the baseline validation rules.'}
              {strategy.phase === 'constraints' && 'Run parameter discovery to identify tunable indicators (EMAs, RSI, MACD).'}
              {strategy.phase === 'parameters' && 'Select asset class and historical date range for initial validation.'}
              {strategy.phase === 'data' && 'Run the initial backtesting engine against historical data.'}
              {strategy.phase === 'backtest' && 'Review backtest performance and proceed to grid search optimization.'}
              {strategy.phase === 'optimize' && 'Run Monte Carlo stress tests to verify robustness.'}
              {strategy.phase === 'robustness' && 'Strategy is certified robust. Unlock Autonomous live execution.'}
              {strategy.phase === 'autonomous' && 'Autonomous execution is active. Monitor live telemetry.'}
            </p>

            {strategy.phase === 'strategy' && (
              <Link href={`/strategies/${strategy.id}/constraints`} style={btnPrimaryStyle}>
                Configure Constraints <ArrowRight size={14} />
              </Link>
            )}
            {strategy.phase === 'constraints' && (
              <Link href={`/strategies/${strategy.id}/parameters`} style={btnPrimaryStyle}>
                Discover Parameters <ArrowRight size={14} />
              </Link>
            )}
            {strategy.phase === 'parameters' && (
              <Link href={`/strategies/${strategy.id}/data`} style={btnPrimaryStyle}>
                Configure Data <ArrowRight size={14} />
              </Link>
            )}
            {strategy.phase === 'data' && (
              <Link href={`/strategies/${strategy.id}/run`} style={btnPrimaryStyle}>
                Run Initial Backtest <ArrowRight size={14} />
              </Link>
            )}
            {strategy.phase === 'backtest' && (
              <Link href={`/strategies/${strategy.id}/optimize`} style={btnPrimaryStyle}>
                Run Parameter Optimization <ArrowRight size={14} />
              </Link>
            )}
            {strategy.phase === 'optimize' && (
              <Link href={`/strategies/${strategy.id}/robustness`} style={btnPrimaryStyle}>
                Run Robustness Testing <ArrowRight size={14} />
              </Link>
            )}
            {(strategy.phase === 'robustness' || strategy.phase === 'autonomous') && (
              <Link href={`/strategies/${strategy.id}/autonomous`} style={btnPrimaryStyle}>
                Open Autonomous Center <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {/* Metadata Card */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px 20px',
          }}>
            <h3 style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
              Strategy Specs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Engine</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{strategy.language === 'python' ? 'Python (Pandas / VectorBT)' : 'Pine Script v5'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{strategy.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Parameters</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{strategy.parameters.length} Defined</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const btnPrimaryStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  background: 'var(--accent)',
  color: '#fff',
  padding: '10px 16px',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 500,
  textDecoration: 'none',
  width: '100%',
}
