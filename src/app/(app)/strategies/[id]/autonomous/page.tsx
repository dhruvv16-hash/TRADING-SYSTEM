// src/app/(app)/strategies/[id]/autonomous/page.tsx
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock, Shield, ArrowRight } from 'lucide-react'
import { StrategyPipelineStepper } from '@/components/strategy/StrategyPipelineStepper'
import { AutonomousClientView } from './AutonomousClientView'

export default async function StrategyAutonomousPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const strategy = await prisma.strategy.findUnique({
    where: { id },
    include: {
      constraints: true,
      backtests: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  })

  if (!strategy) notFound()

  // Phase Gating Check: Bypassed as requested
  const isUnlocked = true // strategy.phase === 'robustness' || strategy.phase === 'autonomous'

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Persistent Strategy Pipeline Stepper */}
      <StrategyPipelineStepper
        strategyId={strategy.id}
        strategyName={strategy.name}
        version={strategy.version}
        language={strategy.language}
        currentStage="autonomous"
        currentPhase={strategy.phase}
        backtestId={strategy.backtests[0]?.id}
        constraintsPassed={strategy.backtests[0]?.constraintsPassed}
      />

      {/* Main Content Area */}
      {!isUnlocked ? (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '60px 24px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '40px auto 0',
        }}>
          <div style={{
            width: '48px', height: '48px',
            borderRadius: '50%',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--text-muted)',
          }}>
            <Lock size={20} />
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Phase 10: Autonomous Mode Locked
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
            To unlock autonomous algorithmic trading, this strategy must first pass <strong>Phase 9 (Robustness Testing)</strong> to guarantee stress survival under real-world slippage and Monte Carlo path variation.
          </p>

          <Link
            href={`/strategies/${strategy.id}/robustness`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--accent)',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <Shield size={14} />
            Go to Robustness Testing
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <AutonomousClientView strategy={strategy} />
      )}
    </div>
  )
}
