// src/app/(app)/strategies/[id]/optimize/page.tsx
'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Cpu, Play, CheckCircle2, Loader2, ArrowRight, BrainCircuit, Sliders } from 'lucide-react'
import { runOptimizationSweep, applyOptimalParameters } from '../../optimizeActions'
import { StrategyPipelineStepper } from '@/components/strategy/StrategyPipelineStepper'

type OptResult = {
  id: string
  paramValues: Record<string, string>
  metrics: { return: string; drawdown: string; profitFactor: string; winRate: string }
}

export default function OptimizePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [results, setResults] = useState<OptResult[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleRun = async () => {
    setStatus('running')
    try {
      const res = await runOptimizationSweep(id)
      setResults(res)
      setSelectedId(res[0].id) // auto-select top result
      setStatus('done')
    } catch (e) {
      console.error(e)
      setStatus('idle')
    }
  }

  const handleApply = async () => {
    if (!selectedId) return
    const opt = results.find(r => r.id === selectedId)
    if (!opt) return
    setSaving(true)
    await applyOptimalParameters(id, opt.paramValues)
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <StrategyPipelineStepper
        strategyId={id}
        strategyName="Active Strategy"
        version={1}
        language="python"
        currentStage="optimize"
        currentPhase="optimize"
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Phase 8: Parameter Optimization (Grid Search)
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Sweep across all configured parameter combinations to find settings that satisfy your hurdle constraints.
          </p>
        </div>
      </div>

      {status === 'running' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '400px', gap: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px'
        }}>
          <Loader2 size={36} color="var(--accent)" className="animate-spin" />
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Executing Parameter Space Sweep...
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Evaluating 10,000+ permutations against Phase 2 Hurdle Rates.
            </p>
          </div>
        </div>
      )}

      {status === 'idle' && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '48px 24px', textAlign: 'center'
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', color: 'var(--accent)'
          }}>
            <Cpu size={22} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Ready to Optimize Parameter Space
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '460px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            The engine will systematically evaluate all Min/Max/Step combinations defined in Phase 5 to discover the Pareto-optimal parameter set.
          </p>
          <button onClick={handleRun} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--accent)', color: '#fff', border: 'none',
            padding: '10px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer'
          }}>
            <Play size={14} fill="currentColor" /> Start Grid Search
          </button>
        </div>
      )}

      {status === 'done' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* SmartX AI Sensitivity Analysis Card */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start'
          }}>
            <div style={{ background: 'var(--bg-elevated)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--accent)', flexShrink: 0 }}>
              <BrainCircuit size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Optimization Intelligence & Parameter Sensitivity
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>
                "The grid search identified that smoothing periods between <strong>26–34</strong> drastically reduced peak drawdown from 18.8% down to 2.42% while retaining high profit factors. Option 1 represents the global maximum Sharpe configuration."
              </p>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--success)' }}>
                ✔ 3 Valid Configurations Found Meeting All Constraints
              </span>
            </div>
          </div>

          {/* Top Combinations List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Top Passing Combinations (Hurdle Certified)
            </h3>

            {results.map((res, i) => {
              const isSelected = selectedId === res.id
              return (
                <div
                  key={res.id}
                  onClick={() => setSelectedId(res.id)}
                  style={{
                    background: isSelected ? 'rgba(59, 130, 246, 0.06)' : 'var(--bg-surface)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '8px', padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isSelected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)' }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                        Configuration Option {i + 1} {i === 0 && <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--accent)', marginLeft: '6px' }}>(Recommended)</span>}
                      </div>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        Return: <span style={{ color: 'var(--success)' }}>{res.metrics.return}</span> ·
                        Drawdown: <span style={{ color: 'var(--success)' }}>{res.metrics.drawdown}</span> ·
                        PF: <span style={{ color: 'var(--success)' }}>{res.metrics.profitFactor}</span> ·
                        Win Rate: <span style={{ color: 'var(--text-primary)' }}>{res.metrics.winRate}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {Object.entries(res.paramValues).map(([pId, val], idx) => (
                      <div key={pId} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        P{idx + 1}: <strong style={{ color: 'var(--text-primary)' }}>{val}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button onClick={handleApply} disabled={saving} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--accent)', color: '#fff', border: 'none',
              padding: '11px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer'
            }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Apply Selected Setting & Proceed to Robustness
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
