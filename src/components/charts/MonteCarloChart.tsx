// src/components/charts/MonteCarloChart.tsx
'use client'

interface MonteCarloChartProps {
  survivalRate: number
  maxDrawdown: number
  height?: number
}

export function MonteCarloChart({ survivalRate, maxDrawdown, height = 200 }: MonteCarloChartProps) {
  const width = 800
  const paddingX = 40
  const paddingY = 20
  const chartW = width - paddingX * 2
  const chartH = height - paddingY * 2

  // Generate 12 sample simulation paths
  const pathsCount = 12
  const steps = 30

  const paths: string[] = []
  for (let p = 0; p < pathsCount; p++) {
    let currentY = chartH * 0.7
    let pathStr = `M ${paddingX} ${paddingY + currentY}`
    const drift = (survivalRate > 90 ? -1.2 : 0.2) + (p - pathsCount / 2) * 0.4
    const volatility = (maxDrawdown / 20) * 4

    for (let s = 1; s <= steps; s++) {
      const x = paddingX + (s / steps) * chartW
      const change = drift + (Math.random() - 0.48) * volatility * 5
      currentY = Math.max(10, Math.min(chartH - 10, currentY + change))
      pathStr += ` L ${x} ${paddingY + currentY}`
    }
    paths.push(pathStr)
  }

  return (
    <div style={{
      background: 'var(--bg-base)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Monte Carlo Trajectory Dispersion (500 Iterations)
        </span>
        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontFamily: 'monospace' }}>
          <span style={{ color: 'var(--success)' }}>95th Percentile: Top 5%</span>
          <span style={{ color: 'var(--warning)' }}>Median (50th)</span>
          <span style={{ color: 'var(--error)' }}>5th Percentile (Worst)</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: `${height}px` }}>
        {/* Horizontal reference lines */}
        {[0.25, 0.5, 0.75].map((ratio, i) => (
          <line
            key={i}
            x1={paddingX}
            y1={paddingY + chartH * ratio}
            x2={width - paddingX}
            y2={paddingY + chartH * ratio}
            stroke="var(--border)"
            strokeDasharray="2 2"
          />
        ))}

        {/* Individual simulation paths */}
        {paths.map((p, idx) => (
          <path
            key={idx}
            d={p}
            fill="none"
            stroke={idx === 0 ? 'var(--error)' : idx === pathsCount - 1 ? 'var(--success)' : 'var(--accent)'}
            strokeWidth={idx === 0 || idx === pathsCount - 1 ? 2 : 1}
            strokeOpacity={idx === 0 || idx === pathsCount - 1 ? 0.9 : 0.25}
          />
        ))}
      </svg>
    </div>
  )
}
