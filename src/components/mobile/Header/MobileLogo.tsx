// ABOUTME: Mobile header logo component with link to homepage
'use client'
import Link from 'next/link'

export function MobileLogo() {
  return (
    <Link href="/" className="mobile-logo nordic-label">
      IDA ROMME
    </Link>
  )
}
