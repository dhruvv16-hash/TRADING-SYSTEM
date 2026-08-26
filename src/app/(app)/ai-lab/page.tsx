// src/app/(app)/ai-lab/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Cpu, Sparkles, Code, Play, ArrowRight, Layers } from 'lucide-react'

export default function AILabPage() {
  const router = useRouter()
  const [provider, setProvider] = useState('openai')
  const [model, setModel] = useState('gpt-4o')
  const [language, setLanguage] = useState('python')
  const [prompt, setPrompt] = useState(
    'Create an adaptive mean-reversion strategy using 2-standard-deviation Bollinger Bands and a 14-period RSI filter on 1-hour timeframe.'
  )
  const [generating, setGenerating] = useState(false)
  const [codeOutput, setCodeOutput] = useState('')

  async function handleGenerate() {
    setGenerating(true)
    setCodeOutput('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, language }),
      })

      if (!res.ok) throw new Error('Generation failed')
      const text = await res.text()
      setCodeOutput(text)
    } catch (e: any) {
      setCodeOutput(`# Simulation fallback code generation\nimport pandas as pd\nimport numpy as np\n\ndef strategy(df):\n    # Adaptive Bollinger Bands + RSI\n    df['sma20'] = df['close'].rolling(20).mean()\n    df['std20'] = df['close'].rolling(20).std()\n    df['upper'] = df['sma20'] + 2 * df['std20']\n    df['lower'] = df['sma20'] - 2 * df['std20']\n    return df`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Quantitative AI Research Lab
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Phase 3: Text-to-Strategy synthesis sandbox across multi-model LLM architectures
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px' }}>
        {/* Controls */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              AI Model Provider
            </label>
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value)
                if (e.target.value === 'anthropic') setModel('claude-3-5-sonnet')
                else if (e.target.value === 'gemini') setModel('gemini-1.5-pro')
                else if (e.target.value === 'deepseek') setModel('deepseek-r1')
                else setModel('gpt-4o')
              }}
              style={selectStyle}
            >
              <option value="openai">OpenAI (GPT-4o / O3-Mini)</option>
              <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
              <option value="gemini">Google (Gemini 1.5 Pro / Flash)</option>
              <option value="deepseek">DeepSeek (DeepSeek R1 / V3)</option>
              <option value="openrouter">OpenRouter (Multi-Model Gateway)</option>
              <option value="local">Local Ollama (Llama 3.3 70B / Qwen 2.5)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              Target Code Language
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setLanguage('python')}
                style={{
                  padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
                  background: language === 'python' ? 'var(--accent)' : 'var(--bg-base)',
                  color: language === 'python' ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border)', cursor: 'pointer'
                }}
              >
                Python (VectorBT)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('pinescript')}
                style={{
                  padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
                  background: language === 'pinescript' ? 'var(--accent)' : 'var(--bg-base)',
                  color: language === 'pinescript' ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border)', cursor: 'pointer'
                }}
              >
                Pine Script (v5)
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              Strategy Specification Prompt
            </label>
            <textarea
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{
                width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border)',
                padding: '10px 12px', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px',
                outline: 'none', resize: 'none', lineHeight: 1.5, fontFamily: 'inherit'
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: 'var(--accent)', color: '#fff', border: 'none',
              padding: '11px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
              cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1
            }}
          >
            <Sparkles size={16} />
            {generating ? 'Generating Quantitative Code...' : 'Synthesize Strategy Code'}
          </button>
        </div>

        {/* Output Code Panel */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-base)'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Synthesized Code Output
            </span>
            {codeOutput && (
              <button
                onClick={() => router.push('/strategies/new')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)40',
                  padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Create Strategy with Code <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div style={{ flex: 1, padding: '20px', background: '#090B0E', overflowY: 'auto' }}>
            {codeOutput ? (
              <pre style={{ margin: 0, fontSize: '12.5px', fontFamily: 'JetBrains Mono, monospace', color: '#D4D4D4', lineHeight: 1.6 }}>
                <code>{codeOutput}</code>
              </pre>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '8px' }}>
                <Code size={28} />
                <p style={{ fontSize: '13px' }}>Click "Synthesize Strategy Code" to run the LLM compiler</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const selectStyle = {
  width: '100%',
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  padding: '10px 12px',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
}
