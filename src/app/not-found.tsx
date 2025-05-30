'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#fafafa',
      padding: '20px'
    }}>
      <div style={{ 
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* 404 Number */}
        <div style={{
          fontSize: 'clamp(80px, 15vw, 120px)',
          fontWeight: 100,
          color: '#e5e5e5',
          lineHeight: 1,
          marginBottom: '16px',
          userSelect: 'none'
        }}>
          404
        </div>

        <h1 style={{ 
          fontSize: 'clamp(24px, 5vw, 48px)', 
          fontWeight: 300, 
          margin: '0 0 16px 0',
          color: '#333',
          letterSpacing: '-0.5px'
        }}>
          Page Not Found
        </h1>
        
        <p style={{ 
          fontSize: 'clamp(16px, 2.5vw, 18px)', 
          color: '#666',
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Navigation options */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          alignItems: 'center'
        }}>
          <Link 
            href="/"
            style={{
              fontSize: '14px',
              color: '#fff',
              backgroundColor: '#333',
              textDecoration: 'none',
              letterSpacing: '1px',
              border: '2px solid #333',
              padding: '16px 32px',
              borderRadius: '6px',
              transition: 'all 0.3s ease',
              display: 'inline-block',
              textTransform: 'uppercase',
              fontWeight: 500
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#000'
              e.currentTarget.style.borderColor = '#000'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#333'
              e.currentTarget.style.borderColor = '#333'
            }}
          >
            ← Back to Gallery
          </Link>

          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <Link 
              href="/about"
              style={{
                fontSize: '14px',
                color: '#333',
                textDecoration: 'none',
                letterSpacing: '1px',
                border: '1px solid #ddd',
                padding: '12px 24px',
                borderRadius: '6px',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#333'
                e.currentTarget.style.backgroundColor = '#f9f9f9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#ddd'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              About
            </Link>

            <Link 
              href="/contact"
              style={{
                fontSize: '14px',
                color: '#333',
                textDecoration: 'none',
                letterSpacing: '1px',
                border: '1px solid #ddd',
                padding: '12px 24px',
                borderRadius: '6px',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#333'
                e.currentTarget.style.backgroundColor = '#f9f9f9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#ddd'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Help text */}
        <div style={{
          marginTop: '48px',
          padding: '24px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #e5e5e5'
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 500,
            margin: '0 0 12px 0',
            color: '#333'
          }}>
            Looking for something specific?
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: 0,
            lineHeight: '1.5'
          }}>
            If you followed a link to get here, it might be broken. 
            Try navigating from the main gallery or contact me if you need help finding something.
          </p>
        </div>
      </div>
    </div>
  )
}
