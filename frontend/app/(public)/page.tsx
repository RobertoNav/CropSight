import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export default function LandingPage() {
  return (
    <>
      {/* ── Nav ── */}
      <nav className="landing-nav">
        <Logo />
        <div className="landing-nav__links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <Link href="/login" className="btn btn--ghost btn--sm" style={{ width: 'auto' }}>
            Sign in
          </Link>
          <Link href="/register" className="btn btn--primary btn--sm" style={{ width: 'auto' }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div>
          <span className="landing-hero__eyebrow">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" fill="#2D6A2D" fillOpacity=".2"/>
              <circle cx="6" cy="6" r="2.5" fill="#2D6A2D"/>
            </svg>
            AI-powered crop diagnostics
          </span>
          <h1 className="landing-hero__title">
            Diagnose crop diseases<br/>
            <em>instantly</em> from a photo
          </h1>
          <p className="landing-hero__desc">
            CropSight uses computer vision to identify diseases and pests in seconds. 
            Built for farmers and agribusinesses who need fast, reliable answers in the field.
          </p>
          <div className="landing-hero__cta">
            <Link href="/register" className="btn btn--primary">
              Start for free
            </Link>
            <Link href="/register/company" className="btn btn--secondary">
              Register your company
            </Link>
          </div>
        </div>

        {/* Decorative visual */}
        <div className="hero-visual">
          <div className="hero-visual__inner">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="10" fill="#eaf3ea"/>
              <path d="M24 8C24 8 12 17 12 28C12 34.627 17.373 40 24 40C30.627 40 36 34.627 36 28C36 17 24 8 24 8Z" fill="#2D6A2D" fillOpacity=".3"/>
              <path d="M24 8C24 8 12 17 12 28" stroke="#2D6A2D" strokeWidth="1.5" strokeDasharray="3 3" fill="none"/>
              <path d="M24 20V38" stroke="#2D6A2D" strokeWidth="2" strokeLinecap="round"/>
              <path d="M24 27C24 27 19 23 16 25" stroke="#2D6A2D" strokeWidth="2" strokeLinecap="round"/>
              <path d="M24 32C24 32 28 28 31 30" stroke="#2D6A2D" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '.78rem', color: 'var(--gray-400)' }}>Upload a crop photo</span>
          </div>
          {/* Floating badge */}
          <div style={{
            position: 'absolute', bottom: '1.25rem', right: '1.25rem',
            background: 'var(--white)', borderRadius: '8px', padding: '.6rem .9rem',
            boxShadow: '0 4px 16px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', gap: '.5rem',
            fontSize: '.8rem', fontWeight: 500
          }}>
            <span style={{ fontSize: '1rem' }}>🌿</span>
            Diagnosis ready in 2s
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="features-grid">
        {[
          {
            icon: '🔬',
            title: 'Instant AI diagnosis',
            desc: 'Our CNN model identifies diseases and pests across 5 crops with high accuracy, trained on PlantVillage.'
          },
          {
            icon: '🏢',
            title: 'Multi-tenant platform',
            desc: 'Companies can onboard their entire field team, centralize results, and track crop health across regions.'
          },
          {
            icon: '📊',
            title: 'Admin dashboard',
            desc: 'Monitor model performance, review predictions, promote new model versions, and trigger retraining when needed.'
          },
          {
            icon: '🔄',
            title: 'Continuous improvement',
            desc: 'User feedback loops into our retraining pipeline. Every correction makes the model smarter.'
          },
          {
            icon: '🔒',
            title: 'Secure & private',
            desc: 'JWT-based authentication, company-scoped data isolation, and encrypted image storage on AWS S3.'
          },
          {
            icon: '⚡',
            title: 'Built for the field',
            desc: 'Mobile-friendly interface. Take a photo, get a result, act immediately — no agronomist required.'
          }
        ].map(f => (
          <div className="feature-card" key={f.title}>
            <div className="feature-icon">
              <span style={{ fontSize: '1.2rem' }}>{f.icon}</span>
            </div>
            <div className="feature-title">{f.title}</div>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── CTA Band ── */}
      <section style={{
        background: 'var(--green-800)', color: 'var(--white)',
        padding: '4rem max(1.5rem, calc((100% - 1100px)/2))',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
          fontWeight: 400, marginBottom: '.75rem', letterSpacing: '-.02em'
        }}>
          Ready to protect your harvest?
        </h2>
        <p style={{ color: 'rgba(255,255,255,.7)', marginBottom: '1.75rem', fontSize: '.95rem' }}>
          Join hundreds of farmers already using CropSight to catch problems early.
        </p>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn" style={{
            width: 'auto', background: 'var(--white)', color: 'var(--green-800)',
            padding: '.75rem 1.75rem'
          }}>
            Create an account
          </Link>
          <Link href="/register/company" className="btn btn--ghost" style={{
            width: 'auto', borderColor: 'rgba(255,255,255,.35)', color: 'var(--white)',
            padding: '.75rem 1.75rem'
          }}>
            Register your company
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <Logo />
        <span>© {new Date().getFullYear()} CropSight. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/login" className="link" style={{ color: 'var(--gray-400)', fontSize: '.83rem' }}>Sign in</Link>
          <Link href="/register" className="link" style={{ color: 'var(--gray-400)', fontSize: '.83rem' }}>Register</Link>
        </div>
      </footer>
    </>
  )
}
