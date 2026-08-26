// src/components/charts/EquityCurveChart.tsx
'use client'

import { useState } from 'react'

interface EquityCurveProps {
  totalReturn: number
  maxDrawdown: number
  height?: number
}

export function EquityCurveChart({ totalReturn, maxDrawdown, height = 220 }: EquityCurveProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  // Generate 60 realistic points based on return and max drawdown
  const pointsCount = 60
  const points: { day: number; value: number; dd: number }[] = []
  let currentValue = 100000
  let peak = currentValue

  for (let i = 0; i < pointsCount; i++) {
    const progress = i / pointsCount
    const trend = (totalReturn / 100) * progress
    const noise = Math.sin(i * 0.4) * (maxDrawdown * 0.25) + (Math.cos(i * 0.8) * 1.5)
    const val = 100000 * (1 + trend + noise / 100)
    currentValue = Math.max(80000, val)
    if (currentValue > peak) peak = currentValue
    const dd = ((peak - currentValue) / peak) * 100
    points.push({ day: i + 1, value: Math.round(currentValue), dd: parseFloat(dd.toFixed(2)) })
  }

  // Ensure last point hits totalReturn
  points[points.length - 1].value = Math.round(100000 * (1 + totalReturn / 100))

  const values = points.map(p => p.value)
  const minVal = Math.min(...values) * 0.98
  const maxVal = Math.max(...values) * 1.02
  const range = maxVal - minVal || 1

  const width = 800
  const paddingX = 40
  const paddingY = 20
  const chartW = width - paddingX * 2
  const chartH = height - paddingY * 2

  const coordinates = points.map((p, idx) => {
    const x = paddingX + (idx / (pointsCount - 1)) * chartW
    const y = paddingY + chartH - ((p.value - minVal) / range) * chartH
    return { x, y, ...p }
  })

  const pathD = coordinates.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`
  }, '')

  const fillD = `${pathD} L ${coordinates[coordinates.length - 1].x} ${height - paddingY} L ${coordinates[0].x} ${height - paddingY} Z`

  const activePoint = hoverIdx !== null ? coordinates[hoverIdx] : coordinates[coordinates.length - 1]

  return (
    <div style={{
      background: 'var(--bg-base)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      padding: '16px',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Portfolio Equity Curve (Simulated)
          </span>
          <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, color: totalReturn >= 0 ? 'var(--success)' : 'var(--error)' }}>
            ${activePoint.value.toLocaleString()} ({(((activePoint.value - 100000) / 100000) * 100).toFixed(2)}%)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
          <span>Peak DD: <span style={{ color: 'var(--error)' }}>-{maxDrawdown.toFixed(1)}%</span></span>
          <span>Start: $100,000</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: `${height}px`, overflow: 'visible' }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = paddingY + chartH * ratio
          const val = Math.round(maxVal - ratio * range)
          return (
            <g key={i}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="var(--border)" strokeDasharray="3 3" />
              <text x={paddingX - 8} y={y + 3} fill="var(--text-muted)" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">
                ${(val / 1000).toFixed(0)}k
              </text>
            </g>
          )
        })}

        {/* Fill Area */}
        <path d={fillD} fill="url(#equityGradient)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Interactive hover overlay */}
        {coordinates.map((pt, idx) => (
          <rect
            key={idx}
            x={pt.x - (chartW / pointsCount) / 2}
            y={0}
            width={chartW / pointsCount}
            height={height}
            fill="transparent"
            style={{ cursor: 'crosshair' }}
            onMouseEnter={() => setHoverIdx(idx)}
          />
        ))}

        {/* Active Hover Point */}
        {hoverIdx !== null && (
          <g>
            <line x1={activePoint.x} y1={paddingY} x2={activePoint.x} y2={height - paddingY} stroke="var(--border-emphasis)" strokeDasharray="2 2" />
            <circle cx={activePoint.x} cy={activePoint.y} r="4" fill="var(--accent)" stroke="#fff" strokeWidth="1.5" />
          </g>
        )}
      </svg>
    </div>
  )
}
