import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="full-height-mobile" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#fafafa'
    }}>
      <div className="container-mobile" style={{ textAlign: 'center' }}>
        <h1 className="text-display-mobile text-crisp" style={{ 
          margin: '0 0 16px 0',
          color: '#333'
        }}>
          Project Not Found
        </h1>
        <p className="text-body-large" style={{ 
          color: '#666',
          marginBottom: '32px'
        }}>
          The textile project you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link 
          href="/"
          className="btn-mobile btn-mobile-secondary touch-feedback"
        >
          ← Back to Gallery
        </Link>
      </div>
    </div>
  )
}
