// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

import { ClerkProvider } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'StrategyOS — Algorithmic Trading Platform',
  description: 'Professional strategy development, backtesting, optimization, and robustness testing platform.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-strong)',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
