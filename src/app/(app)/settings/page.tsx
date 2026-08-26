// src/app/(app)/settings/page.tsx
import { currentUser } from '@clerk/nextjs/server'
import { Key, ShieldAlert, User, Cpu, Server, Save } from 'lucide-react'

export default async function SettingsPage() {
  const user = await currentUser()

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Platform Settings & API Configurations
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Manage your AI model endpoints, risk parameters, and paper execution environment
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* User Profile */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <User size={16} color="var(--accent)" />
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Quantitative Researcher Account
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Full Name</label>
              <input type="text" defaultValue={user?.firstName ? `${user.firstName} ${user.lastName || ''}` : ''} readOnly style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Address</label>
              <input type="text" defaultValue={user?.primaryEmailAddress?.emailAddress || ''} readOnly style={inputStyle} />
            </div>
          </div>
        </div>

        {/* AI Provider Keys */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Key size={16} color="var(--accent)" />
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              AI Model API Keys
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
            Configure custom API keys for text-to-strategy generation and parameter extraction.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>OpenAI API Key</label>
              <input type="password" defaultValue="sk-proj-••••••••••••••••••••••••" placeholder="sk-..." style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Anthropic API Key</label>
              <input type="password" placeholder="sk-ant-..." style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Google Gemini API Key</label>
              <input type="password" placeholder="AIzaSy..." style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>OpenRouter / DeepSeek API Key</label>
              <input type="password" placeholder="sk-or-..." style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Global Risk Governor Limits */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <ShieldAlert size={16} color="var(--warning)" />
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Global Risk Governor & Execution Rules
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
            Default thresholds automatically enforced across all deployed Autonomous Mode trading agents.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Account Daily Max Drawdown (%)
              </label>
              <input type="number" defaultValue="5.0" step="0.5" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Emergency Kill Switch Trigger
              </label>
              <select defaultValue="auto-halt" style={inputStyle}>
                <option value="auto-halt">Auto-Halt All Agents + Flatten Positions</option>
                <option value="alert-only">Alert Only (No auto-liquidation)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  padding: '10px 12px',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
}
