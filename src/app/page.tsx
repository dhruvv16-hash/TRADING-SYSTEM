export const dynamic = 'force-dynamic';
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { ArrowRight, Terminal, BarChart2, Shield, Zap, Moon, Sun } from 'lucide-react'

// Exact clone of the Smart X Terminal button
const SmartXButton = ({ children, onClick, className = "", isPrimary = false }: any) => {
  return (
    <button 
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 px-7 py-3.5 text-base ${isPrimary ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-[0_0_24px_var(--accent-dim)]' : 'bg-transparent text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-elevated)]'} ${className}`}
    >
      {isPrimary && (
        <span 
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-[sheen_1.1s_ease-in-out]" 
          style={{
            background: 'linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%)',
            backgroundSize: '250% 100%'
          }}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
    </button>
  )
}

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col items-center overflow-x-hidden relative transition-colors duration-300">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none z-0"></div>
      
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-2">
          <Terminal className="text-[var(--accent)] w-6 h-6" />
          <span className="font-bold text-xl tracking-wider text-[var(--text-primary)]">Strategy<span className="text-[var(--accent)]">OS</span></span>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-secondary)]">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <SignedIn>
            <Link href="/dashboard">
              <SmartXButton>Portfolio</SmartXButton>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <div><SmartXButton>Log in</SmartXButton></div>
            </SignInButton>
            <SignUpButton mode="modal">
              <div><SmartXButton isPrimary={true}>Sign Up</SmartXButton></div>
            </SignUpButton>
          </SignedOut>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center py-32 z-10 relative">
        <div className="inline-block px-4 py-1.5 rounded-full border border-[var(--accent-dim)] bg-[var(--accent-dim)] text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Next-Gen Trading Terminal
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-center leading-tight tracking-tight mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Own algorithms built to last.<br/>
          <span className="text-[var(--text-secondary)] text-4xl md:text-6xl mt-4 block">Execute with precision.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-[var(--text-secondary)] text-center max-w-2xl mb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          The ultimate quantitative trading platform. Backtest algorithms, optimize parameters, and deploy autonomous bots directly from your browser.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <SignedIn>
            <Link href="/dashboard">
              <SmartXButton isPrimary={true}>
                Launch Terminal <ArrowRight className="w-5 h-5" />
              </SmartXButton>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignUpButton mode="modal">
              <div>
                <SmartXButton isPrimary={true}>
                  Analyze my first strategy <ArrowRight className="w-5 h-5" />
                </SmartXButton>
              </div>
            </SignUpButton>
          </SignedOut>
        </div>
      </main>
    </div>
  )
}

