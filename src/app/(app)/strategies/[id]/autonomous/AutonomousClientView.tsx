// src/app/(app)/strategies/[id]/autonomous/AutonomousClientView.tsx
'use client'

import { useState } from 'react'
import {
  Bot, Activity, Zap, RefreshCw, Power, CheckCircle, ShieldAlert, Sliders, Terminal
} from 'lucide-react'
import { toggleAutonomousMode } from '../../autonomousActions'

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
  const [logs, setLogs] = useState([
    { time: '14:28:01', type: 'SYS', text: 'Strategy OS Risk Engine initialized. Heartbeat synced.' },
    { time: '14:28:03', type: 'RISK', text: `Drawdown limit armed at ${strategy.constraints?.maxDrawdown || 15}%. Auto kill-switch ready.` },
    { time: '14:28:05', type: 'AI', text: 'AI Supervisor: Market regime low-volatility. Execution priority normal.' },
  ])

  async function handleToggle() {
    setLoading(true)
    try {
      const nextState = !isActive
      await toggleAutonomousMode(strategy.id, nextState)
      setIsActive(nextState)
      const newLog = {
        time: new Date().toTimeString().split(' ')[0],
        type: nextState ? 'ACTIVATE' : 'HALT',
        text: nextState
          ? 'AUTONOMOUS EXECUTION ARMED. Routing orders to simulated broker.'
          : 'AUTONOMOUS EXECUTION PAUSED. All open orders safely parked.',
      }
      setLogs(prev => [newLog, ...prev])
    } catch (e: any) {
      alert(e.message || 'Failed to toggle autonomous state')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Order Router</span>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)' }}>
                Direct FIX 4.4 Simulation
              </span>
            </div>
          </div>
        </div>

        {/* AI Supervisor Panel (SmartX inspiration) */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Zap size={16} color="var(--warning)" />
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              AI Supervisor Diagnostics
            </h3>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
            "The autonomous supervisor is monitoring signal generation for <strong>{strategy.name}</strong>. Current market volatility is within calibrated tolerances established during Phase 9 Robustness testing."
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
            <span>Regime: <strong style={{ color: 'var(--success)' }}>Trend Stable</strong></span>
            <span>·</span>
            <span>Confidence Score: <strong style={{ color: 'var(--accent)' }}>94.2%</strong></span>
          </div>
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
              Autonomous Execution Log
            </span>
          </div>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
            Real-time Feed · Local FIX Simulator
          </span>
        </div>

        <div style={{ padding: '16px 20px', background: '#090B0E', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span>
              <span style={{
                color: log.type === 'ACTIVATE' ? 'var(--success)' : log.type === 'HALT' ? 'var(--error)' : log.type === 'RISK' ? 'var(--warning)' : 'var(--accent)',
                fontWeight: 600
              }}>
                {log.type}:
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{log.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
