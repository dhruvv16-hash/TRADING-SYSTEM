// src/app/(app)/strategies/[id]/constraints/page.tsx
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Save } from 'lucide-react'
import { saveConstraints } from '../../actions'
import { StrategyPipelineStepper } from '@/components/strategy/StrategyPipelineStepper'

export default async function ConstraintsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const strategy = await prisma.strategy.findUnique({
    where: { id },
    include: {
      constraints: true,
      backtests: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  })

  if (!strategy) notFound()

  const lastBacktest = strategy.backtests[0]
  const constraints = strategy.constraints || {
    minProfitableTrades: 100,
    maxDrawdown: 15,
    minProfitFactor: 1.5
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <StrategyPipelineStepper
        strategyId={strategy.id}
        strategyName={strategy.name}
        version={strategy.version}
        language={strategy.language}
        currentStage="constraints"
        currentPhase={strategy.phase}
        backtestId={lastBacktest?.status === 'completed' ? lastBacktest.id : undefined}
        constraintsPassed={lastBacktest?.constraintsPassed}
      />

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Phase 2: Performance Constraints
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Define the strict mathematical hurdle rates that downstream phases (Backtest, Optimization, Robustness) must satisfy.
          </p>
        </div>

        <form action={saveConstraints} style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <input type="hidden" name="strategyId" value={strategy.id} />

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Minimum Trades
            </label>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Require enough trades for statistical significance.
            </p>
            <input type="number" name="minTrades" defaultValue={constraints.minProfitableTrades} required style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Maximum Drawdown (%)
            </label>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Reject the strategy if historical drawdown exceeds this value.
            </p>
            <input type="number" name="maxDrawdown" defaultValue={constraints.maxDrawdown} step="0.1" required style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Minimum Profit Factor
            </label>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Gross profit divided by gross loss (e.g. 1.5 means making 50% more than losing).
            </p>
            <input type="number" name="minProfitFactor" defaultValue={constraints.minProfitFactor} step="0.01" required style={inputStyle} />
          </div>

          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--accent)', color: '#fff', border: 'none',
              padding: '10px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer'
            }}>
              <Save size={16} />
              Save Constraints & Proceed
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  padding: '10px 12px',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
}
