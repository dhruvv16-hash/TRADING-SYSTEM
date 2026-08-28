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

  // Read from env — localhost for dev, real URL in production
  const botUrl = process.env.FLASK_BOT_URL || 'http://127.0.0.1:5000'
  // Only show the offline warning if we are actually deployed to Vercel without a configured URL.
  // This allows local `npm run start` (which sets NODE_ENV=production) to still connect to localhost.
  const isVercelDeployed = process.env.VERCEL === '1' && !process.env.FLASK_BOT_URL

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
        {isVercelDeployed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '12px', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Flask Bot Not Configured</p>
            <p style={{ fontSize: '13px', textAlign: 'center', maxWidth: '400px' }}>
              To embed the live trading bot in production, set the <code style={{ fontFamily: 'monospace', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '3px' }}>FLASK_BOT_URL</code> environment variable in Vercel to your deployed bot URL.
            </p>
          </div>
        ) : (
          <iframe
            src={botUrl}
            style={{ width: '100%', height: '100%', border: 'none', minHeight: '800px' }}
            title="Algorithmic Trading System"
          />
        )}
      </div>
    </div>
  )
}

