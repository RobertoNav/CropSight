"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function HomePage() {
  return (
    <>
      <nav className="landing-nav">
        <Logo />

        <div className="landing-nav__links">
          <a href="#features">
            Features
          </a>

          <a href="#how-it-works">
            How it works
          </a>

          <Link
            href="/login"
            className="btn btn--ghost btn--sm"
            style={{
              width: "auto",
            }}
          >
            Sign in
          </Link>

          <Link
            href="/register"
            className="btn btn--primary btn--sm"
            style={{
              width: "auto",
            }}
          >
            Get started
          </Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div>
          <span className="landing-hero__eyebrow">
            AI-powered crop
            diagnostics
          </span>

          <h1 className="landing-hero__title">
            Diagnose crop diseases
            instantly
          </h1>

          <p className="landing-hero__desc">
            CropSight uses computer
            vision to identify
            diseases and pests in
            seconds.
          </p>
        </div>
      </section>
    </>
  );
}