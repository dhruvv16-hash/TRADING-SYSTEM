import { SignUp } from '@clerk/nextjs'

export default function RegisterPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <SignUp routing="hash" fallbackRedirectUrl="/dashboard" />
    </div>
  )
}
