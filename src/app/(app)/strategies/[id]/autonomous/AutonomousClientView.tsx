// src/app/(app)/strategies/[id]/autonomous/AutonomousClientView.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Bot, Activity, Zap, RefreshCw, Power, CheckCircle, ShieldAlert, Sliders, Terminal, WifiOff
} from 'lucide-react'
import { toggleAutonomousMode, getAutonomousFeed } from '../../autonomousActions'

interface ViewProps {
  strategy: {
    id: string
    name: string
    status: string
    phase: string
    language: string
    version: number
    constraints?: {
      maxDrawdown: number
      minProfitFactor: number
      minProfitableTrades: number
    } | null
  }
}

export function AutonomousClientView({ strategy }: ViewProps) {
  const [isActive, setIsActive] = useState(strategy.status === 'active')
  const [loading, setLoading] = useState(false)
  const [feed, setFeed] = useState<any>(null)
  const [feedLoading, setFeedLoading] = useState(true)

  const refreshFeed = useCallback(async () => {
    try {
      const data = await getAutonomousFeed(strategy.id)
      setFeed(data)
    } catch (e) {
      console.error('Feed error:', e)
    } finally {
      setFeedLoading(false)
    }
  }, [strategy.id])

  // Poll every 8 seconds for live updates
  useEffect(() => {
    refreshFeed()
    const interval = setInterval(refreshFeed, 8000)
    return () => clearInterval(interval)
  }, [refreshFeed])

  const logs = feed?.recentEvents || []
  const positions = feed?.activePositions || []
  const botOnline = feed?.status === 'ONLINE'

  async function handleToggle() {
    setLoading(true)
    try {
      const nextState = !isActive
      await toggleAutonomousMode(strategy.id, nextState)
      setIsActive(nextState)
      await refreshFeed()
    } catch (e: any) {
      alert(e.message || 'Failed to toggle autonomous state')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Bot Offline Banner */}
      {!feedLoading && !botOnline && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: 'var(--error)',
        }}>
          <WifiOff size={16} />
          <span><strong>Bot Offline:</strong> The Flask trading bot is not running. Start it with <code style={{ fontFamily: 'monospace', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '3px' }}>python app.py</code> in the <code style={{ fontFamily: 'monospace', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '3px' }}>algo-trading-bot</code> folder.</span>
        </div>
      )}

      {/* Top Banner Control */}
      <div style={{
        background: isActive ? 'rgba(34, 197, 94, 0.08)' : 'var(--bg-surface)',
        border: `1px solid ${isActive ? 'var(--success)' : 'var(--border)'}`,
        borderRadius: '8px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px',
            borderRadius: '8px',
            background: isActive ? 'var(--success-dim)' : 'var(--bg-elevated)',
            border: `1px solid ${isActive ? 'var(--success)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isActive ? 'var(--success)' : 'var(--text-muted)',
          }}>
            <Bot size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Autonomous Execution Engine
              </h2>
              <span style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: isActive ? 'var(--success-dim)' : 'var(--bg-elevated)',
                color: isActive ? 'var(--success)' : 'var(--text-muted)',
                border: `1px solid ${isActive ? 'var(--success)' : 'var(--border)'}`,
              }}>
                {isActive ? '● LIVE ACTIVE' : '○ STANDBY'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {isActive
                ? 'Strategy is actively monitoring incoming market data and evaluating entry/exit triggers.'
                : 'Execution is currently paused. Activate to enable live signal processing.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: isActive ? 'var(--error)' : 'var(--success)',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.15s',
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Power size={16} />
          {loading ? 'Updating...' : isActive ? 'Deactivate Autonomous Mode' : 'Enable Autonomous Execution'}
        </button>
      </div>

      {/* Grid: Risk Controls + AI Supervisor + Execution Terminal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Risk Governor Panel */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <ShieldAlert size={16} color="var(--accent)" />
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Active Risk Governor
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Hard Drawdown Kill-Switch</span>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--warning)' }}>
                {strategy.constraints?.maxDrawdown || 15.0}% Max
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Slippage Guard</span>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                ≤ 0.05% per trade
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bot Connection</span>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: botOnline ? 'var(--success)' : 'var(--error)' }}>
                {botOnline ? '● Live (Delta Exchange)' : '○ Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Positions Panel */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color="var(--warning)" />
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Live Positions
              </h3>
            </div>
            {feed?.totalPnl != null && (
              <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: feed.totalPnl >= 0 ? 'var(--success)' : 'var(--error)' }}>
                Total PnL: {feed.totalPnl >= 0 ? '+' : ''}{Number(feed.totalPnl).toFixed(2)}
              </span>
            )}
          </div>

          {feedLoading ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Loading live data...</p>
          ) : positions.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {botOnline ? 'No open positions.' : 'Bot offline — cannot fetch positions.'}
            </p>
          ) : positions.map((pos: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{pos.symbol}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>{pos.side} · {pos.size}</span>
              </div>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: pos.pnl?.startsWith('+') ? 'var(--success)' : 'var(--error)' }}>
                {pos.pnl}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Terminal Feed */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-base)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={14} color="var(--text-muted)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Trade Log
            </span>
          </div>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: botOnline ? 'var(--success)' : 'var(--text-muted)' }}>
            {botOnline ? '● Live Feed · Polling every 8s' : '○ Bot Offline'}
          </span>
        </div>

        <div style={{ padding: '16px 20px', background: '#090B0E', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
          {feedLoading ? (
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>Connecting to bot...</span>
          ) : logs.length === 0 ? (
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{botOnline ? 'No trade logs yet.' : 'Bot is offline. No logs available.'}</span>
          ) : logs.map((log: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span>
              <span style={{
                color: log.type === 'BUY' ? 'var(--success)' : log.type === 'SELL' ? 'var(--error)' : log.type === 'RISK' ? 'var(--warning)' : 'var(--accent)',
                fontWeight: 600
              }}>
                {log.type}:
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{log.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

