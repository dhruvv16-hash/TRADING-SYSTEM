// src/app/(app)/strategies/[id]/parameters/page.tsx
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Sparkles, Settings2, Save, ArrowRight } from 'lucide-react'
import { discoverParameters, saveParameterConfig } from '../../parameterActions'
import { StrategyPipelineStepper } from '@/components/strategy/StrategyPipelineStepper'

export default async function ParametersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const strategy = await prisma.strategy.findUnique({
    where: { id },
    include: {
      parameters: true,
      backtests: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  })

  if (!strategy) notFound()

  const lastBacktest = strategy.backtests[0]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <StrategyPipelineStepper
        strategyId={strategy.id}
        strategyName={strategy.name}
        version={strategy.version}
        language={strategy.language}
        currentStage="parameters"
        currentPhase={strategy.phase}
        backtestId={lastBacktest?.status === 'completed' ? lastBacktest.id : undefined}
        constraintsPassed={lastBacktest?.constraintsPassed}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Phase 4 & 5: Parameter Discovery & Configuration
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Extract indicators from your source code and establish Min/Max/Step search spaces for grid optimization.
          </p>
        </div>

        <form action={async () => {
          'use server'
          await discoverParameters(strategy.id)
        }}>
          <button type="submit" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
            color: 'var(--text-primary)', cursor: 'pointer'
          }}>
            <Sparkles size={14} color="var(--accent)" />
            Auto-Discover with AI
          </button>
        </form>
      </div>

      {strategy.parameters.length === 0 ? (
        <div style={{
          background: 'var(--bg-surface)', border: '1px dashed var(--border)',
          borderRadius: '8px', padding: '48px', textAlign: 'center'
        }}>
          <Settings2 size={32} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No parameters discovered yet
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Click <strong>Auto-Discover with AI</strong> to parse indicator settings (e.g. SMA windows, RSI thresholds, stop-loss ratios) from your strategy code.
          </p>
        </div>
      ) : (
        <form action={saveParameterConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input type="hidden" name="strategyId" value={strategy.id} />

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Parameter Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Default</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Min Value</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Max Value</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Grid Step</th>
                </tr>
              </thead>
              <tbody>
                {strategy.parameters.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px' }}>
                      <input type="hidden" name="paramId" value={p.id} />
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{p.description}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-secondary)', background: 'var(--bg-base)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        {p.defaultVal}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <input type="number" name={`min_${p.id}`} defaultValue={p.minVal || ''} placeholder="Min" style={inputStyle} />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <input type="number" name={`max_${p.id}`} defaultValue={p.maxVal || ''} placeholder="Max" style={inputStyle} />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <input type="number" name={`step_${p.id}`} defaultValue={p.step || ''} placeholder="Step" style={inputStyle} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button type="submit" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer'
            }}>
              <Save size={16} />
              Save Configuration & Proceed
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

const inputStyle = {
  width: '100px',
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  padding: '6px 10px',
  borderRadius: '4px',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
}
