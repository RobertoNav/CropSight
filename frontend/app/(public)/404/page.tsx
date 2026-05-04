// app/not-found.tsx  (Next.js 13+ catches all 404s here)
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export default function NotFound() {
  return (
    <div className="error-page">
      <Logo />
      <div className="error-code">404</div>
      <h1 className="error-title">Page not found</h1>
      <p className="error-desc">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        Check the URL or navigate back to a familiar place.
      </p>
      <div className="error-actions">
        <Link href="/" className="btn btn--primary" style={{ width: 'auto', padding: '.72rem 1.5rem' }}>
          Go to homepage
        </Link>
        <Link href="/dashboard" className="btn btn--ghost" style={{ width: 'auto', padding: '.72rem 1.5rem' }}>
          Dashboard
        </Link>
      </div>
    </div>
  )
}
