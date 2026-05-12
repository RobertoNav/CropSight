"use client";
import Link from 'next/link'

interface LogoProps {
  href?: string
}

export function Logo({ href = '/' }: LogoProps) {
  return (
    <Link href={href} className="logo">
      <img src="/logo.png" alt="CropSight logo" width={32} height={32} />
      <span className="logo__text">CropSight</span>
    </Link>
  )
}