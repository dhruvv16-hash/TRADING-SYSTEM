// src/app/(app)/strategies/autonomousActions.ts
'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function toggleAutonomousMode(strategyId: string, enabled: boolean) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId }
  })

  if (!strategy || strategy.userId !== userId) throw new Error("Not found")

  // Ensure strategy has passed robustness (phase must be autonomous or robustness)
  // Bypassed as requested
  // if (strategy.phase !== 'robustness' && strategy.phase !== 'autonomous') {
  //   throw new Error("Strategy must complete robustness testing before enabling Autonomous mode.")
  // }

  await prisma.strategy.update({
    where: { id: strategyId },
    data: {
      status: enabled ? 'active' : 'draft',
      phase: enabled ? 'autonomous' : strategy.phase,
    }
  })

  revalidatePath(`/strategies/${strategyId}/autonomous`)
  revalidatePath(`/strategies/${strategyId}`)
  revalidatePath(`/autonomous`)
  revalidatePath(`/dashboard`)

  return { success: true, enabled }
}

export async function getAutonomousFeed(strategyId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  // Return realistic mock execution tick and simulated order router events
  return {
    status: 'ONLINE',
    heartbeat: new Date().toISOString(),
    brokerConnection: 'Simulated Paper Broker (Direct FIX 4.4)',
    latencyMs: 1.24,
    activePositions: [
      { symbol: 'AAPL', size: 150, entryPrice: 224.50, currentPrice: 226.15, pnl: '+1.18%', side: 'LONG' }
    ],
    recentEvents: [
      { time: 'Just now', type: 'SIGNAL', msg: 'SMA(26) Cross Detected on 1d. Order routed to execution pool.' },
      { time: '2m ago', type: 'RISK', msg: 'Drawdown governor check: 3.42% / 15.0% allowed. Green.' },
      { time: '15m ago', type: 'FILL', msg: 'BUY 150 AAPL @ 224.50 (Slippage: 0.01%)' },
      { time: '1h ago', type: 'HEARTBEAT', msg: 'Strategy OS Risk Daemon active. Volatility regime normal.' },
    ]
  }
}
