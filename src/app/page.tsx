import Link from 'next/link'
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { ArrowRight, Terminal, BarChart2, Shield, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col items-center overflow-x-hidden relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none z-0"></div>
      
      {/* Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10 relative border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Terminal className="text-[var(--accent)] w-6 h-6" />
          <span className="font-bold text-xl tracking-wider text-[var(--text-primary)]">Strategy<span className="text-[var(--accent)]">OS</span></span>
        </div>
        <div className="flex gap-4">
          <SignedIn>
            <Link href="/dashboard" className="px-5 py-2 text-sm font-medium border border-[var(--border)] rounded-md hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
              Go to Dashboard
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-5 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                Log In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-5 py-2 text-sm font-medium bg-[var(--accent)] text-black rounded-md hover:bg-[var(--accent-hover)] transition-colors animate-glow">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center py-32 z-10 relative">
        <div className="inline-block px-4 py-1.5 rounded-full border border-[var(--accent-dim)] bg-[var(--accent-dim)] text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Next-Gen Trading Terminal
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-center leading-tight tracking-tight mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Automate Your Edge.<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[#00ff88]">Execute with Precision.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-[var(--text-secondary)] text-center max-w-2xl mb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          The ultimate quantitative trading platform. Backtest algorithms, optimize parameters, and deploy autonomous trading bots directly from your browser.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <SignedIn>
            <Link href="/dashboard" className="flex items-center justify-center gap-2 px-8 py-4 bg-[var(--accent)] text-black font-bold rounded-md hover:bg-[var(--accent-hover)] transition-all transform hover:scale-105 animate-glow">
              Launch Terminal <ArrowRight className="w-5 h-5" />
            </Link>
          </SignedIn>
          <SignedOut>
            <SignUpButton mode="modal">
              <button className="flex items-center justify-center gap-2 px-8 py-4 bg-[var(--accent)] text-black font-bold rounded-md hover:bg-[var(--accent-hover)] transition-all transform hover:scale-105 w-full">
                Get Started <ArrowRight className="w-5 h-5" />
              </button>
            </SignUpButton>
          </SignedOut>
        </div>

        {/* Mockup Dashboard UI Graphic */}
        <div className="mt-24 w-full max-w-5xl rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-[0_0_50px_rgba(0,229,255,0.1)] overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="h-10 bg-[var(--bg-elevated)] border-b border-[var(--border)] flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div className="h-64 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] relative overflow-hidden">
                {/* Simulated Chart */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--accent-dim)] to-transparent opacity-20"></div>
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <path d="M0,150 L50,120 L100,160 L150,90 L200,130 L250,60 L300,100 L350,40 L400,80 L500,20 L600,60 L800,10" fill="none" stroke="var(--accent)" strokeWidth="3" vectorEffect="non-scaling-stroke" className="opacity-80"/>
                </svg>
              </div>
              <div className="h-32 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] font-mono text-sm">
                [AUTONOMOUS_BOT_ONLINE] PNL: +$4,250.00
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-24 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] p-4 border-l-4 border-l-[var(--success)]">
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Net Profit</p>
                <p className="text-2xl font-mono text-[var(--text-primary)] mt-1">+14.2%</p>
              </div>
              <div className="h-24 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] p-4 border-l-4 border-l-[var(--accent)]">
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Active Positions</p>
                <p className="text-2xl font-mono text-[var(--text-primary)] mt-1">3 LONG / 1 SHORT</p>
              </div>
              <div className="h-40 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] p-4">
                 <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Live Logs</p>
                 <div className="space-y-2 text-xs font-mono">
                   <div className="text-[var(--success)]">&gt; BUY 1.5 BTC @ $64k</div>
                   <div className="text-[var(--text-muted)]">&gt; Analyzing signals...</div>
                   <div className="text-[var(--text-muted)]">&gt; Volatility check pass</div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover-card">
            <BarChart2 className="w-10 h-10 text-[var(--accent)] mb-4" />
            <h3 className="text-xl font-bold mb-2">Deep Backtesting</h3>
            <p className="text-[var(--text-secondary)] text-sm">Simulate your strategies across years of historical data instantly.</p>
          </div>
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover-card">
            <Zap className="w-10 h-10 text-[var(--accent)] mb-4" />
            <h3 className="text-xl font-bold mb-2">Real-Time Execution</h3>
            <p className="text-[var(--text-secondary)] text-sm">Deploy algorithms to live markets with ultra-low latency webhook signals.</p>
          </div>
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover-card">
            <Shield className="w-10 h-10 text-[var(--accent)] mb-4" />
            <h3 className="text-xl font-bold mb-2">Secure & Autonomous</h3>
            <p className="text-[var(--text-secondary)] text-sm">Run your bots fully hands-off securely. Built-in circuit breakers protect your capital.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-[var(--text-muted)] text-sm border-t border-[var(--border)] mt-20 relative z-10">
        &copy; {new Date().getFullYear()} StrategyOS. All rights reserved. Built for quantitative traders.
      </footer>
    </div>
  )
}
