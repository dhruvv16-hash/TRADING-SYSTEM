'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  language: z.enum(['python', 'pine']),
  code: z.string().min(1, "Code is required"),
})

export async function createStrategy(formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const data = {
    name: formData.get('name') as string,
    language: formData.get('language') as 'python' | 'pine',
    code: formData.get('code') as string,
  }

  const parsed = schema.parse(data)

  const strategy = await prisma.strategy.create({
    data: {
      name: parsed.name,
      language: parsed.language,
      code: parsed.code,
      userId: userId,
      version: 1,
      phase: 'strategy',
      status: 'draft',
    },
  })

  redirect(`/strategies/${strategy.id}`)
}

export async function saveConstraints(formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const strategyId = formData.get('strategyId') as string
  const minProfitableTrades = Number(formData.get('minTrades'))
  const maxDrawdown = Number(formData.get('maxDrawdown'))
  const minProfitFactor = Number(formData.get('minProfitFactor'))

  // Verify ownership
  const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } })
  if (!strategy || strategy.userId !== userId) throw new Error("Not found")

  await prisma.constraint.upsert({
    where: { strategyId },
    update: { minProfitableTrades, maxDrawdown, minProfitFactor },
    create: { strategyId, minProfitableTrades, maxDrawdown, minProfitFactor }
  })
  
  // Advance phase if it was just 'strategy'
  if (strategy.phase === 'strategy') {
    await prisma.strategy.update({
      where: { id: strategyId },
      data: { phase: 'constraints' }
    })
  }

  redirect(`/strategies/${strategyId}`)
}
