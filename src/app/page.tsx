// src/app/page.tsx
// Root redirect — send to dashboard (middleware handles auth)
import { redirect } from 'next/navigation'
export default function RootPage() {
  redirect('/dashboard')
}
