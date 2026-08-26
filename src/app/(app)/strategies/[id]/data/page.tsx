// src/app/(app)/strategies/[id]/data/page.tsx
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Database, Search } from 'lucide-react'
import { saveBacktestDataConfig } from '../../dataActions'
import { StrategyPipelineStepper } from '@/components/strategy/StrategyPipelineStepper'

export default async function DataPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const strategy = await prisma.strategy.findUnique({
    where: { id },
    include: {
      backtests: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  })

  if (!strategy) notFound()

  const lastBacktest = strategy.backtests[0]

  // Default dates: past 5 years
  const defaultEnd = new Date().toISOString().split('T')[0]
  const defaultStart = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <StrategyPipelineStepper
        strategyId={strategy.id}
        strategyName={strategy.name}
        version={strategy.version}
        language={strategy.language}
        currentStage="data"
        currentPhase={strategy.phase}
        backtestId={lastBacktest?.status === 'completed' ? lastBacktest.id : undefined}
        constraintsPassed={lastBacktest?.constraintsPassed}
      />

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Phase 6: Asset & Historical Data Selection
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Select the asset class, timeframe, and historical lookback window (5–10 years) for quantitative backtesting.
          </p>
        </div>

        <form action={saveBacktestDataConfig} style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <input type="hidden" name="strategyId" value={strategy.id} />

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <Database size={14} /> Asset Class / Ticker
              </label>
              <select name="asset" required style={selectStyle}>
                <option value="AAPL">US Equities: AAPL (Apple Inc.)</option>
                <option value="TSLA">US Equities: TSLA (Tesla Inc.)</option>
                <option value="SPY">Index ETF: SPY (S&P 500)</option>
                <option value="EURUSD">Forex: EUR/USD</option>
                <option value="BTCUSDT">Crypto: BTC/USDT</option>
                <option value="ETHUSDT">Crypto: ETH/USDT</option>
                <option value="RELIANCE">Indian Equities: RELIANCE</option>
              </select>
            </div>

            <div style={{ width: '180px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Timeframe
              </label>
              <select name="timeframe" required defaultValue="1d" style={selectStyle}>
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">1 Day</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Lookback Start Date (5-10 yrs)
              </label>
              <input type="date" name="startDate" defaultValue={defaultStart} required style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                End Date
              </label>
              <input type="date" name="endDate" defaultValue={defaultEnd} required style={inputStyle} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', margin: '4px -24px 0', paddingTop: '20px', paddingLeft: '24px', paddingRight: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--accent)', color: '#fff', border: 'none',
              padding: '10px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer'
            }}>
              <Search size={16} />
              Fetch Data & Proceed to Backtest
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const selectStyle = {
  width: '100%',
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  padding: '10px 12px',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  fontSize: '13.5px',
  outline: 'none',
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  padding: '10px 12px',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  fontSize: '13.5px',
  outline: 'none',
}
