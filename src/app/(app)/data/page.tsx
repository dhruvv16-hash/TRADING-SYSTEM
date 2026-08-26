// src/app/(app)/data/page.tsx
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Database, CheckCircle, Clock, Server, ArrowRight } from 'lucide-react'

const ASSET_CATALOG = [
  { symbol: 'AAPL', name: 'Apple Inc.', market: 'US Equities', bars: '1.25M', timeframe: '1m, 5m, 1h, 1d', status: 'SYNCHRONIZED' },
  { symbol: 'TSLA', name: 'Tesla Inc.', market: 'US Equities', bars: '980K', timeframe: '1m, 5m, 1h, 1d', status: 'SYNCHRONIZED' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', market: 'Index ETF', bars: '2.40M', timeframe: '1m, 5m, 1h, 1d', status: 'SYNCHRONIZED' },
  { symbol: 'EURUSD', name: 'Euro / US Dollar', market: 'Forex Spot', bars: '3.10M', timeframe: '1m, 5m, 1h, 1d', status: 'SYNCHRONIZED' },
  { symbol: 'BTCUSDT', name: 'Bitcoin / Tether', market: 'Crypto Spot', bars: '4.80M', timeframe: '1m, 5m, 1h, 1d', status: 'SYNCHRONIZED' },
  { symbol: 'ETHUSDT', name: 'Ethereum / Tether', market: 'Crypto Spot', bars: '3.60M', timeframe: '1m, 5m, 1h, 1d', status: 'SYNCHRONIZED' },
  { symbol: 'RELIANCE', name: 'Reliance Industries', market: 'NSE Equities', bars: '850K', timeframe: '1m, 5m, 1h, 1d', status: 'SYNCHRONIZED' },
]

export default async function GlobalDataPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Historical Data Catalog
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Phase 6: High-frequency tick, minute, and daily OHLCV historical time series (5–10 years coverage)
          </p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px',
          fontSize: '12px', fontFamily: 'monospace', color: 'var(--success)'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
          Market Data Feed: Online
        </div>
      </div>

      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: '8px', overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-base)' }}>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Asset Symbol</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Asset Name</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Market Class</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Timeframes</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stored Bars (10y)</th>
              <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sync Status</th>
            </tr>
          </thead>
          <tbody>
            {ASSET_CATALOG.map((item) => (
              <tr key={item.symbol} style={{ borderBottom: '1px solid var(--border)' }} className="hover-row">
                <td style={{ padding: '14px 20px', fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)' }}>
                  {item.symbol}
                </td>
                <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {item.name}
                </td>
                <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {item.market}
                </td>
                <td style={{ padding: '14px 20px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {item.timeframe}
                </td>
                <td style={{ padding: '14px 20px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                  {item.bars}
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <span style={{
                    fontSize: '10px', fontFamily: 'monospace', fontWeight: 600,
                    padding: '2px 8px', borderRadius: '4px',
                    background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid var(--success)40'
                  }}>
                    ● {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
