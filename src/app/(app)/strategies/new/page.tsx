'use client'

import { useState, useEffect } from 'react'
import { createStrategy } from '../actions'
import { ArrowLeft, Code2, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useCompletion } from '@ai-sdk/react'

const defaultPython = `def strategy(data):
    # Calculate 20-period SMA
    sma = data['close'].rolling(window=20).mean()
    
    # Generate signals
    signals = []
    for i in range(len(data)):
        if data['close'].iloc[i] > sma.iloc[i]:
            signals.append(1)  # Buy
        else:
            signals.append(-1) # Sell
            
    return signals`

const defaultPine = `//@version=5
strategy("Simple SMA", overlay=true)

sma = ta.sma(close, 20)
plot(sma)

if close > sma
    strategy.entry("Long", strategy.long)
else
    strategy.entry("Short", strategy.short)`

export default function NewStrategyPage() {
  const [lang, setLang] = useState<'python' | 'pine'>('python')
  
  const { completion, setCompletion, input, handleInputChange, handleSubmit, isLoading } = useCompletion({
    api: '/api/generate',
    body: { language: lang },
    initialCompletion: defaultPython,
    onError: (err) => alert(err.message)
  })

  useEffect(() => {
    if (completion === defaultPython || completion === defaultPine || completion === '') {
      setCompletion(lang === 'python' ? defaultPython : defaultPine)
    }
  }, [lang, setCompletion, completion])
  
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/strategies" className="hover-card" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px', borderRadius: '6px',
          border: '1px solid var(--border)', background: 'var(--bg-surface)',
          color: 'var(--text-secondary)', textDecoration: 'none'
        }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>New Strategy</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Write or paste your trading algorithm</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Left Side: Generation Panel */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <form onSubmit={handleSubmit} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                <Sparkles size={14} color="var(--accent)" />
                AI Strategy Generator
              </label>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Describe the strategy you want to build.</p>
            </div>
            <textarea
              name="prompt"
              value={input}
              onChange={handleInputChange}
              placeholder="e.g., A mean reversion strategy using Bollinger Bands and RSI. Buy when price hits lower band and RSI < 30."
              required
              style={{
                width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border)',
                padding: '12px', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px',
                outline: 'none', resize: 'none', height: '120px', fontFamily: 'inherit'
              }}
            />
            <button type="submit" disabled={isLoading} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: 'var(--accent)', color: '#fff', border: 'none',
              padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1
            }}>
              {isLoading ? <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
              {isLoading ? 'Generating...' : 'Generate Code'}
            </button>
          </form>
        </div>

        {/* Right Side: Manual Form & Editor */}
        <form action={createStrategy} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>Strategy Name</label>
              <input name="name" required placeholder="e.g. Mean Reversion Alpha" style={{
                width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)',
                padding: '10px 12px', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px',
                outline: 'none'
              }} />
            </div>
            <div style={{ width: '200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>Language</label>
              <select name="language" value={lang} onChange={e => setLang(e.target.value as 'python' | 'pine')} style={{
                width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)',
                padding: '10px 12px', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px',
                outline: 'none', appearance: 'none'
              }}>
                <option value="python">Python</option>
                <option value="pine">Pine Script</option>
              </select>
            </div>
          </div>

          <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code2 size={16} color="var(--text-secondary)" />
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{lang === 'python' ? 'strategy.py' : 'strategy.pine'}</span>
            </div>
            
            <textarea
              name="code"
              value={completion}
              onChange={e => setCompletion(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1, width: '100%', padding: '16px', background: '#1E1E1E', color: '#D4D4D4',
                border: 'none', resize: 'none', outline: 'none',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', lineHeight: 1.5,
                whiteSpace: 'pre'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button type="submit" style={{
              background: 'var(--accent)', color: '#fff', border: 'none',
              padding: '10px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer'
            }}>
              Save Strategy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
