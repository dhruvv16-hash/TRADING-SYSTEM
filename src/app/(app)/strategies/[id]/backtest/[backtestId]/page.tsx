// src/app/(app)/strategies/[id]/backtest/[backtestId]/page.tsx
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, BrainCircuit, ArrowRight, ShieldCheck } from 'lucide-react'
import { StrategyPipelineStepper } from '@/components/strategy/StrategyPipelineStepper'
import { EquityCurveChart } from '@/components/charts/EquityCurveChart'

export default async function BacktestResultPage({ params }: { params: Promise<{ id: string, backtestId: string }> }) {
  const { id, backtestId } = await params

  const backtest = await prisma.backtest.findUnique({
    where: { id: backtestId },
    include: { strategy: { include: { constraints: true } } }
  })

  if (!backtest) notFound()
  if (backtest.status !== 'completed') return <div>Backtest not completed.</div>

  const s = backtest.strategy
  const c = s.constraints
  const passed = backtest.constraintsPassed

  const ddFailed = c?.maxDrawdown !== undefined && (backtest.maxDrawdown || 0) > c.maxDrawdown
  const pfFailed = c?.minProfitFactor !== undefined && (backtest.profitFactor || 0) < c.minProfitFactor
  const tradesFailed = c?.minProfitableTrades !== undefined && (backtest.totalTrades || 0) < c.minProfitableTrades

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <StrategyPipelineStepper
        strategyId={s.id}
        strategyName={s.name}
        version={s.version}
        language={s.language}
        currentStage="backtest"
        currentPhase={s.phase}
        backtestId={backtest.id}
        constraintsPassed={passed}
      />

      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Phase 7: Quantitative Backtest Report
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            {backtest.asset} · {backtest.timeframe} · {backtest.startDate?.toLocaleDateString()} to {backtest.endDate?.toLocaleDateString()}
          </p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: passed ? 'var(--success-dim)' : 'var(--error-dim)',
          color: passed ? 'var(--success)' : 'var(--error)',
          border: `1px solid ${passed ? 'var(--success)' : 'var(--error)'}40`,
          padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: 'monospace'
        }}>
          {passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {passed ? 'USER CONSTRAINTS PASSED' : 'CONSTRAINTS FAILED'}
        </div>
      </div>

      {/* SVG Equity Curve Chart */}
      <div style={{ marginBottom: '20px' }}>
        <EquityCurveChart
          totalReturn={backtest.totalReturn || 0}
          maxDrawdown={backtest.maxDrawdown || 0}
        />
      </div>

      {/* AI Analysis & Recommendations Box (SmartX Style) */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start',
      }}>
        <div style={{
          background: 'var(--bg-elevated)',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          color: 'var(--accent)',
          flexShrink: 0
        }}>
          <BrainCircuit size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              AI Quantitative Diagnostics
            </h3>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
              Model: StrategyOS-Quant-LLM
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
            {backtest.aiAnalysis}
          </p>

          <div style={{
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '12px',
            color: 'var(--text-primary)',
          }}>
            <strong>Recommendation: </strong>
            {passed
              ? 'Strategy passes hurdle rates. Proceed directly to Phase 9 Robustness Stress Testing to verify slippage resilience.'
              : 'Drawdown exceeded the 15% hurdle constraint. Run Phase 8 Parameter Optimization (Grid Search) to calibrate indicator bounds and dampen drawdown.'}
          </div>
        </div>
      </div>

      {/* Metrics & Constraint Verification Matrix (Zuperior Density) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <MetricCard label="Total Net Return" value={`${backtest.totalReturn}%`} trend={backtest.totalReturn! > 0 ? 'up' : 'down'} />
        <MetricCard label="Max Drawdown" value={`${backtest.maxDrawdown}%`} limit={c?.maxDrawdown} limitLabel="Max" isFailed={ddFailed} />
        <MetricCard label="Profit Factor" value={backtest.profitFactor?.toString()} limit={c?.minProfitFactor} limitLabel="Min" isFailed={pfFailed} />
        <MetricCard label="Win Rate" value={`${backtest.winRate}%`} />
        <MetricCard label="Total Trades" value={backtest.totalTrades?.toString()} limit={c?.minProfitableTrades} limitLabel="Min" isFailed={tradesFailed} />
        <MetricCard label="Sharpe Ratio" value={backtest.sharpeRatio?.toString()} />
      </div>

      {/* Bottom Call to Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {passed ? (
          <Link href={`/strategies/${s.id}/robustness`} style={btnPrimary}>
            Proceed to Robustness Testing <ArrowRight size={14} />
          </Link>
        ) : (
          <Link href={`/strategies/${s.id}/optimize`} style={btnPrimary}>
            Proceed to Parameter Optimization <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value, trend, limit, limitLabel, isFailed }: {
  label: string
  value: any
  trend?: 'up' | 'down'
  limit?: number
  limitLabel?: string
  isFailed?: boolean
}) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: `1px solid ${isFailed ? 'rgba(239, 68, 68, 0.4)' : 'var(--border)'}`,
      borderRadius: '8px',
      padding: '16px 20px',
    }}>
      <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        {limit !== undefined && (
          <span style={{ color: isFailed ? 'var(--error)' : 'var(--text-muted)' }}>
            Hurdle: {limitLabel} {limit}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 600, color: isFailed ? 'var(--error)' : 'var(--text-primary)' }}>
          {value}
        </span>
        {trend === 'up' && <TrendingUp size={16} color="var(--success)" />}
        {trend === 'down' && <TrendingDown size={16} color="var(--error)" />}
      </div>
    </div>
  )
}

const btnPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: 'var(--accent)',
  color: '#fff',
  padding: '11px 24px',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 500,
  textDecoration: 'none',
}
