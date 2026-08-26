'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export async function saveBacktestDataConfig(formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const strategyId = formData.get('strategyId') as string
  const asset = formData.get('asset') as string
  const timeframe = formData.get('timeframe') as string
  const startDate = new Date(formData.get('startDate') as string)
  const endDate = new Date(formData.get('endDate') as string)

  // Verify strategy ownership
  const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } })
  if (!strategy || strategy.userId !== userId) throw new Error("Not found")

  // Create pending backtest
  await prisma.backtest.create({
    data: {
      strategyId,
      asset,
      timeframe,
      startDate,
      endDate,
      status: 'pending'
    }
  })

  // Redirect to run the backtest engine
  redirect(`/strategies/${strategyId}/run`)
}
