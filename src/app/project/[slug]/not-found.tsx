import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#fafafa'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: 300, 
          margin: '0 0 16px 0',
          color: '#333'
        }}>
          Project Not Found
        </h1>
        <p style={{ 
          fontSize: '18px', 
          color: '#666',
          marginBottom: '32px'
        }}>
          The textile project you're looking for doesn't exist.
        </p>
        <Link 
          href="/"
          style={{
            fontSize: '14px',
            color: '#333',
            textDecoration: 'none',
            letterSpacing: '1px',
            border: '1px solid #333',
            padding: '12px 24px',
            borderRadius: '6px'
          }}
        >
          ← Back to Gallery
        </Link>
      </div>
    </div>
  )
}
