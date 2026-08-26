// src/app/(app)/strategies/[id]/robustness/page.tsx
'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldAlert, Play, CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react'
import { runRobustnessChecks } from '../../robustnessActions'
import { StrategyPipelineStepper } from '@/components/strategy/StrategyPipelineStepper'
import { MonteCarloChart } from '@/components/charts/MonteCarloChart'

type RobustnessResult = {
  passed: boolean
  metrics: {
    monteCarloSurvivalRate: string
    maxSimulatedDrawdown: string
    varianceWithSlippage: string
  }
}

export default function RobustnessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [result, setResult] = useState<RobustnessResult | null>(null)

  const handleRun = async () => {
    setStatus('running')
    try {
      const res = await runRobustnessChecks(id)
      setResult(res)
      setStatus('done')
    } catch (e) {
      console.error(e)
      setStatus('idle')
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <StrategyPipelineStepper
        strategyId={id}
        strategyName="Active Strategy"
        version={1}
        language="python"
        currentStage="robustness"
        currentPhase={status === 'done' && result?.passed ? 'autonomous' : 'robustness'}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Phase 9: Robustness & Monte Carlo Stress Testing
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Certify that the strategy survives path permutation, variable market slippage, and regime shifts.
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
              Executing 1,000 Monte Carlo Paths & Slippage Variance...
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Simulating adverse execution friction and order fill latency.
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
            <ShieldCheck size={22} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Ready for Quantitative Stress Testing
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            We will randomize the historical trade sequencing (Monte Carlo) and apply 3x variable spread and slippage penalties to verify that the strategy isn't overfit to historical noise.
          </p>
          <button onClick={handleRun} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--accent)', color: '#fff', border: 'none',
            padding: '10px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer'
          }}>
            <Play size={14} fill="currentColor" /> Run Stress Test
          </button>
        </div>
      )}

      {status === 'done' && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Result Card */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderRadius: '8px',
            background: result.passed ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)',
            border: `1px solid ${result.passed ? 'var(--success)' : 'var(--error)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {result.passed ? <CheckCircle2 size={24} color="var(--success)" /> : <XCircle size={24} color="var(--error)" />}
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: result.passed ? 'var(--success)' : 'var(--error)', marginBottom: '2px' }}>
                  {result.passed ? 'Strategy Passed Robustness Verification' : 'Strategy Failed Stress Test'}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {result.passed
                    ? 'The strategy maintained acceptable drawdown across 99%+ of Monte Carlo permutations.'
                    : 'The strategy degraded severely under simulated friction. Re-calibration recommended.'}
                </p>
              </div>
            </div>

            {result.passed && (
              <span style={{
                fontSize: '11px', fontFamily: 'monospace', fontWeight: 600,
                color: 'var(--success)', background: 'var(--success-dim)',
                padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--success)40'
              }}>
                PHASE 10 UNLOCKED
              </span>
            )}
          </div>

          {/* SVG Monte Carlo Visualization */}
          <MonteCarloChart
            survivalRate={parseFloat(result.metrics.monteCarloSurvivalRate)}
            maxDrawdown={parseFloat(result.metrics.maxSimulatedDrawdown)}
          />

          {/* Metrics Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: '8px' }}>
                MC Survival Rate (Hurdle: ≥80%)
              </div>
              <div style={{ fontSize: '24px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--success)' }}>
                {result.metrics.monteCarloSurvivalRate}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Max Simulated Drawdown
              </div>
              <div style={{ fontSize: '24px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                {result.metrics.maxSimulatedDrawdown}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Slippage Penalty Drag
              </div>
              <div style={{ fontSize: '24px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {result.metrics.varianceWithSlippage}
              </div>
            </div>
          </div>

          {/* Bottom Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            {result.passed ? (
              <Link href={`/strategies/${id}/autonomous`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'var(--accent)', color: '#fff', border: 'none',
                padding: '11px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, textDecoration: 'none'
              }}>
                Proceed to Phase 10: Autonomous Mode <ArrowRight size={14} />
              </Link>
            ) : (
              <Link href={`/strategies/${id}/optimize`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)',
                padding: '11px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, textDecoration: 'none'
              }}>
                Return to Parameter Optimization
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
