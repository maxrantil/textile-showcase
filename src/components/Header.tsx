'use client'

import Link from 'next/link'

export default function Header() {
  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid #e5e5e5'
    }}>
      <div style={{
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Left side - Home link */}
        <Link 
          href="/" 
          style={{
            fontSize: '24px',
            fontWeight: 300,
            letterSpacing: '2px',
            color: '#333',
            textDecoration: 'none',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#666'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
        >
          IDA ROMME
        </Link>
        
        {/* Right side - Navigation */}
        <nav style={{
          display: 'flex',
          gap: '32px'
        }}>
          <Link 
            href="/" 
            style={{
              fontSize: '14px',
              letterSpacing: '1px',
              color: '#333',
              textDecoration: 'none',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#666'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
          >
            WORK
          </Link>
          <Link 
            href="/about" 
            style={{
              fontSize: '14px',
              letterSpacing: '1px',
              color: '#333',
              textDecoration: 'none',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#666'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
          >
            ABOUT
          </Link>
          <Link 
            href="/contact" 
            style={{
              fontSize: '14px',
              letterSpacing: '1px',
              color: '#333',
              textDecoration: 'none',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#666'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
          >
            CONTACT
          </Link>
        </nav>
      </div>
    </header>
  )
}
