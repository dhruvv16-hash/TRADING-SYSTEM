// src/components/strategy/StrategyPipelineStepper.tsx
import Link from 'next/link'
import {
  Code, Sliders, Database, Play, TrendingUp, Shield, Bot, CheckCircle2, Lock, AlertTriangle
} from 'lucide-react'

export type PipelineStageKey =
  | 'strategy'
  | 'constraints'
  | 'parameters'
  | 'data'
  | 'backtest'
  | 'optimize'
  | 'robustness'
  | 'autonomous'
  | 'live_trading'

interface StageDef {
  key: PipelineStageKey
  label: string
  href: (id: string, backtestId?: string) => string
  icon: React.ElementType
}

const STAGES: StageDef[] = [
  { key: 'strategy',    label: '1. Strategy',    href: (id) => `/strategies/${id}`, icon: Code },
  { key: 'constraints', label: '2. Constraints', href: (id) => `/strategies/${id}/constraints`, icon: Sliders },
  { key: 'parameters',  label: '3. Parameters',  href: (id) => `/strategies/${id}/parameters`, icon: Sliders },
  { key: 'data',        label: '4. Data Config', href: (id) => `/strategies/${id}/data`, icon: Database },
  { key: 'backtest',    label: '5. Backtest',    href: (id, bId) => bId ? `/strategies/${id}/backtest/${bId}` : `/strategies/${id}/run`, icon: Play },
  { key: 'optimize',    label: '6. Optimization',href: (id) => `/strategies/${id}/optimize`, icon: TrendingUp },
  { key: 'robustness',  label: '7. Robustness',  href: (id) => `/strategies/${id}/robustness`, icon: Shield },
  { key: 'autonomous',  label: '8. Autonomous',  href: (id) => `/strategies/${id}/autonomous`, icon: Bot },
  { key: 'live_trading',label: '9. Algorithmic Trading', href: (id) => `/strategies/${id}/live_trading`, icon: Play }
]

const PHASE_ORDER: Record<string, number> = {
  strategy: 1,
  constraints: 2,
  parameters: 3,
  data: 4,
  backtest: 5,
  optimize: 6,
  robustness: 7,
  autonomous: 8,
}

interface StepperProps {
  strategyId: string
  strategyName: string
  version: number
  language: string
  currentStage: PipelineStageKey
  currentPhase: string
  backtestId?: string
  constraintsPassed?: boolean | null
}

export function StrategyPipelineStepper({
  strategyId,
  strategyName,
  version,
  language,
  currentStage,
  currentPhase,
  backtestId,
  constraintsPassed,
}: StepperProps) {
  const currentPhaseLevel = PHASE_ORDER[currentPhase] || 1

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      marginBottom: '24px',
      overflow: 'hidden',
    }}>
      {/* Strategy Meta Header */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-base)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Active Strategy
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {strategyName}
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
            v{version} · {language === 'python' ? 'Python' : 'Pine Script'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Workflow Pipeline:</span>
          <span style={{
            fontSize: '10px',
            fontFamily: 'monospace',
            fontWeight: 600,
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: '4px',
            background: currentPhase === 'autonomous' ? 'var(--error-dim)' : 'var(--accent-dim)',
            color: currentPhase === 'autonomous' ? 'var(--error)' : 'var(--accent)',
            border: `1px solid ${currentPhase === 'autonomous' ? 'var(--error)' : 'var(--accent)'}40`,
          }}>
            Phase: {currentPhase}
          </span>
        </div>
      </div>

      {/* Stepper Horizontal Flow */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(9, 1fr)',
      }}>
        {STAGES.map((stage, idx) => {
          const stageLevel = idx + 1
          const isActive = stage.key === currentStage
          const isUnlocked = true // Bypassing locks as requested
          const isPassed = stageLevel < currentPhaseLevel
          const isFailed = stage.key === 'backtest' && constraintsPassed === false

          const Icon = stage.icon

          let badgeColor = 'var(--text-muted)'
          let badgeBg = 'transparent'
          let borderColor = 'var(--border)'

          if (isActive) {
            badgeColor = 'var(--accent)'
            badgeBg = 'var(--accent-dim)'
            borderColor = 'var(--accent)'
          } else if (isFailed) {
            badgeColor = 'var(--error)'
            badgeBg = 'var(--error-dim)'
            borderColor = 'var(--error)'
          } else if (isPassed) {
            badgeColor = 'var(--success)'
            badgeBg = 'var(--success-dim)'
            borderColor = 'var(--success)'
          }

          const content = (
            <div style={{
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textAlign: 'center',
              background: isActive ? 'var(--bg-elevated)' : 'transparent',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: isUnlocked ? 'pointer' : 'not-allowed',
              opacity: isUnlocked ? 1 : 0.45,
              transition: 'background 0.15s',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: badgeBg,
                border: `1px solid ${borderColor}`,
                color: badgeColor,
              }}>
                {isPassed ? (
                  <CheckCircle2 size={13} />
                ) : isFailed ? (
                  <AlertTriangle size={13} />
                ) : !isUnlocked ? (
                  <Lock size={12} />
                ) : (
                  <Icon size={12} />
                )}
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-primary)' : isUnlocked ? 'var(--text-secondary)' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}>
                {stage.label}
              </span>
            </div>
          )

          if (isUnlocked) {
            return (
              <Link
                key={stage.key}
                href={stage.href(strategyId, backtestId)}
                style={{ textDecoration: 'none', borderRight: idx < 7 ? '1px solid var(--border)' : 'none' }}
              >
                {content}
              </Link>
            )
          }

          return (
            <div key={stage.key} style={{ borderRight: idx < 7 ? '1px solid var(--border)' : 'none' }} title="Stage locked. Complete previous requirements.">
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
