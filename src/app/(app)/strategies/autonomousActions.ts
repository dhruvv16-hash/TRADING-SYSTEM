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

export async function getAutonomousFeed(_strategyId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const botUrl = process.env.FLASK_BOT_URL || 'http://127.0.0.1:5000'

  async function fetchBot(path: string) {
    const res = await fetch(`${botUrl}${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    }).catch(() => null)
    if (!res || !res.ok) return null
    return res.json().catch(() => null)
  }

  const [pnlData, logsData] = await Promise.all([
    fetchBot('/api/pnl'),
    fetchBot('/api/logs'),
  ])

  const isOnline = pnlData !== null

  // Map real open positions from /api/pnl
  const activePositions = (pnlData?.open_positions || []).map((p: any) => ({
    symbol: p.symbol || p.product_symbol || 'UNKNOWN',
    size: p.size || p.quantity || 0,
    entryPrice: p.entry_price || p.avg_entry_price || 0,
    currentPrice: p.mark_price || p.last_price || 0,
    pnl: p.unrealized_pnl != null ? `${p.unrealized_pnl >= 0 ? '+' : ''}${Number(p.unrealized_pnl).toFixed(2)}` : '0.00',
    side: p.side || (p.size > 0 ? 'LONG' : 'SHORT'),
  }))

  // Map real trade logs from /api/logs
  const recentEvents = (logsData || []).slice(0, 8).map((log: any) => ({
    time: log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Unknown',
    type: log.action?.toUpperCase() || 'LOG',
    msg: `${log.action || ''} ${log.ticker || ''} via ${log.source || 'webhook'}`.trim(),
  }))

  return {
    status: isOnline ? 'ONLINE' : 'OFFLINE',
    heartbeat: new Date().toISOString(),
    brokerConnection: isOnline ? 'Delta Exchange (Live)' : 'Bot Offline — Start the Flask server',
    latencyMs: isOnline ? null : null,
    activePositions,
    recentEvents,
    totalPnl: pnlData?.total_unrealized_pnl ?? null,
    botUrl,
  }
}

