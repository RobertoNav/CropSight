// app/(public)/(errors)/403/page.tsx
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export default function ForbiddenPage() {
  return (
    <div className="error-page">
      <Logo />
      <div className="error-code">403</div>
      <h1 className="error-title">Access denied</h1>
      <p className="error-desc">
        You don&apos;t have permission to view this page. If you think this is a mistake,
        contact your company administrator or sign in with a different account.
      </p>
      <div className="error-actions">
        <Link href="/dashboard" className="btn btn--primary" style={{ width: 'auto', padding: '.72rem 1.5rem' }}>
          Back to dashboard
        </Link>
        <Link href="/login" className="btn btn--ghost" style={{ width: 'auto', padding: '.72rem 1.5rem' }}>
          Sign in again
        </Link>
      </div>
    </div>
  )
}