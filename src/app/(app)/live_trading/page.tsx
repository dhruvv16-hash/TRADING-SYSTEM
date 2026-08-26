import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export default async function GlobalLiveTradingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  // Find the most recently created strategy for this user
  const latestStrategy = await prisma.strategy.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })

  if (latestStrategy) {
    redirect(`/strategies/${latestStrategy.id}/live_trading`)
  } else {
    // Fallback if no strategy exists yet
    redirect('/strategies/new')
  }
}
