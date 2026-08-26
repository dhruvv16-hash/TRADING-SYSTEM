// src/app/(app)/strategies/[id]/live_trading/page.tsx
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { StrategyPipelineStepper } from '@/components/strategy/StrategyPipelineStepper'

export default async function StrategyLiveTradingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const strategy = await prisma.strategy.findUnique({
    where: { id },
    include: {
      constraints: true,
      backtests: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  })

  if (!strategy) notFound()

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <StrategyPipelineStepper
        strategyId={strategy.id}
        strategyName={strategy.name}
        version={strategy.version}
        language={strategy.language}
        currentStage="live_trading"
        currentPhase={strategy.phase}
        backtestId={strategy.backtests[0]?.id}
        constraintsPassed={strategy.backtests[0]?.constraintsPassed}
      />

      <div style={{ flex: 1, marginTop: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <iframe 
          src="http://127.0.0.1:5000" 
          style={{ width: '100%', height: '100%', border: 'none', minHeight: '800px' }}
          title="Algorithmic Trading System"
        />
      </div>
    </div>
  )
}
