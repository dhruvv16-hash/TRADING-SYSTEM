// src/app/(app)/layout.tsx
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/login')

  const userProp = {
    name: user.firstName ? `${user.firstName} ${user.lastName}` : user.primaryEmailAddress?.emailAddress,
    email: user.primaryEmailAddress?.emailAddress,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Topbar user={userProp} />
      <main style={{ flex: 1, padding: '32px 40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  )
}
