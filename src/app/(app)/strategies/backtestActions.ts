'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { runPythonBacktester } from '@/lib/backtester/backtestEngine'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export async function runBacktestAction(strategyId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    include: { constraints: true }
  })
  if (!strategy || strategy.userId !== userId) throw new Error("Not found")

  let backtest = await prisma.backtest.findFirst({
    where: { strategyId },
    orderBy: { createdAt: 'desc' }
  })
  
  if (!backtest) throw new Error("No pending backtest found")

  // Mark as running
  await prisma.backtest.update({ where: { id: backtest.id }, data: { status: 'running' } })

  // Extract parameters if configured
  const paramMap: Record<string, any> = {}
  const parameters = await prisma.parameter.findMany({ where: { strategyId } })
  parameters.forEach(p => {
    paramMap[p.name] = parseFloat(p.defaultVal) || p.defaultVal
  })

  // Execute real Python backtesting engine from BACKTESTING directory
  const pyResult = await runPythonBacktester('backtest', {
    code: strategy.code,
    params: paramMap,
    asset: backtest.asset || 'STOCK',
  })

  const { totalReturn, maxDrawdown, profitFactor, totalTrades, winRate, sharpeRatio } = pyResult.metrics

  const profitableTrades = Math.floor(totalTrades * (winRate / 100))

  // Check constraints
  let constraintsPassed = true
  if (strategy.constraints) {
    if (profitableTrades < strategy.constraints.minProfitableTrades) constraintsPassed = false
    if (maxDrawdown > strategy.constraints.maxDrawdown) constraintsPassed = false
    if (profitFactor < strategy.constraints.minProfitFactor) constraintsPassed = false
  }

  // AI Analysis
  let aiAnalysis = "Backtest complete. Adjust parameters to improve profit factor and reduce drawdown."
  if (process.env.OPENAI_API_KEY) {
    try {
      const { text } = await generateText({
        model: openai('gpt-4o'),
        prompt: `You are an AI trading assistant. Analyze these backtest results.
Code: ${strategy.name} (${strategy.language})
Metrics: Return: ${totalReturn}%, Drawdown: ${maxDrawdown}%, Profit Factor: ${profitFactor}, Win Rate: ${winRate}%
Constraints Passed: ${constraintsPassed}

Write a 2-sentence highly technical analysis of what went wrong or right, and suggest ONE parameter to optimize next. No markdown, just plain text.`
      })
      aiAnalysis = text
    } catch (e) {
      console.error("AI Analysis failed:", e)
    }
  }

  // Save results
  await prisma.backtest.update({
    where: { id: backtest.id },
    data: {
      status: 'completed',
      totalReturn,
      maxDrawdown,
      profitFactor,
      totalTrades,
      winRate,
      sharpeRatio,
      constraintsPassed,
      aiAnalysis
    }
  })

  // Update strategy phase to optimize if failed, or robustness if passed
  const nextPhase = constraintsPassed ? 'robustness' : 'optimize'
  await prisma.strategy.update({
    where: { id: strategyId },
    data: { phase: nextPhase }
  })

  return backtest.id
}
