'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { runBacktestAction } from '../../backtestActions'
import { Loader2, Activity } from 'lucide-react'

export default function RunBacktestPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    async function run() {
      try {
        const backtestId = await runBacktestAction(id)
        if (mounted) {
          router.push(`/strategies/${id}/backtest/${backtestId}`)
        }
      } catch (e: any) {
        if (mounted) setError(e.message)
      }
    }

    run()
    
    return () => { mounted = false }
  }, [id, router])

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
        <div style={{ color: 'var(--error)' }}>Error: {error}</div>
        <button onClick={() => router.push(`/strategies/${id}`)} style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          padding: '8px 16px', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer'
        }}>Go Back</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '24px' }}>
      <div style={{ position: 'relative' }}>
        <Activity size={48} color="var(--accent)" style={{ opacity: 0.5 }} />
        <Loader2 size={48} color="var(--accent)" className="animate-spin" style={{ position: 'absolute', top: 0, left: 0, animation: 'spin 1.5s linear infinite' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Executing Backtest Engine...</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Compiling strategy, fetching historical data, and simulating trades.</p>
      </div>
    </div>
  )
}
