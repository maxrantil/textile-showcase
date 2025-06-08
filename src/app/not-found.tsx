'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="full-height-mobile"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
      }}
    >
      <div
        className="container-mobile"
        style={{
          textAlign: 'center',
          maxWidth: '500px',
        }}
      >
        {/* 404 Number */}
        <div
          style={{
            fontSize: 'clamp(80px, 15vw, 120px)',
            fontWeight: 100,
            color: '#e5e5e5',
            lineHeight: 1,
            marginBottom: '16px',
            userSelect: 'none',
          }}
        >
          404
        </div>

        <h1
          className="text-display-mobile text-crisp"
          style={{
            margin: '0 0 16px 0',
            color: '#333',
            letterSpacing: '-0.5px',
          }}
        >
          Page Not Found
        </h1>

        <p
          className="text-body-large"
          style={{
            color: '#666',
            marginBottom: '32px',
            lineHeight: '1.6',
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Navigation options */}
        <div
          className="stack-mobile"
          style={{
            alignItems: 'center',
          }}
        >
          <Link
            href="/"
            className="btn-mobile btn-mobile-primary touch-feedback"
            style={{
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            ← Back to Gallery
          </Link>

          <div
            className="grid-mobile-2"
            style={{
              justifyContent: 'center',
            }}
          >
            <Link
              href="/about"
              className="btn-mobile btn-mobile-ghost touch-feedback"
            >
              About
            </Link>

            <Link
              href="/contact"
              className="btn-mobile btn-mobile-ghost touch-feedback"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Help text */}
        <div
          className="spacing-mobile-xl"
          style={{
            padding: '24px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
          }}
        >
          <h2
            className="text-body-mobile"
            style={{
              fontWeight: 500,
              margin: '0 0 12px 0',
              color: '#333',
            }}
          >
            Looking for something specific?
          </h2>
          <p
            className="text-caption-mobile"
            style={{
              color: '#666',
              margin: 0,
              lineHeight: '1.5',
            }}
          >
            If you followed a link to get here, it might be broken. Try
            navigating from the main gallery or contact me if you need help
            finding something.
          </p>
        </div>
      </div>
    </div>
  )
}
