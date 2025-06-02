'use client'

import Link from 'next/link'
import ContactForm from '@/components/forms/ContactForm'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import KeyboardScrollHandler from '@/components/KeyboardScrollHandler'

export default function ContactPage() {
  return (
    <>
      <KeyboardScrollHandler />
      
      <div style={{ minHeight: '100vh', background: '#fafafa' }}>
        <div style={{ height: '100px' }} />
        
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto', 
          padding: '60px clamp(20px, 5vw, 40px)' 
        }}>
          <ErrorBoundary>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h1 style={{ 
                fontSize: 'clamp(32px, 5vw, 48px)', 
                fontWeight: 300, 
                margin: '0 0 24px 0',
                color: '#333',
                letterSpacing: '-1px'
              }}>
                Contact
              </h1>
              
              <p style={{ 
                fontSize: 'clamp(16px, 2.5vw, 18px)', 
                color: '#666', 
                lineHeight: '1.6',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Interested in collaborating or learning more about my work? 
                I'd love to hear from you.
              </p>
            </div>

            {/* Contact Form */}
            <ContactForm 
              onSuccess={() => console.log('Form submitted successfully!')}
              onError={(error) => console.error('Form submission error:', error)}
            />

            {/* Additional Contact Information */}
            <div style={{ 
              marginTop: '60px', 
              padding: '40px', 
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{
                fontSize: 'clamp(20px, 3vw, 24px)',
                fontWeight: 300,
                margin: '0 0 24px 0',
                color: '#333',
                textAlign: 'center'
              }}>
                Other Ways to Connect
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '32px',
                textAlign: 'center'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    margin: '0 0 8px 0',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Studio Location
                  </h3>
                  <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                    Stockholm, Sweden
                  </p>
                </div>
                
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    margin: '0 0 8px 0',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Response Time
                  </h3>
                  <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                    Usually within 48 hours
                  </p>
                </div>
              </div>
            </div>

            {/* Back Link */}
            <div style={{ textAlign: 'center', marginTop: '60px' }}>
              <Link 
                href="/"
                style={{
                  fontSize: '14px',
                  color: '#333',
                  textDecoration: 'none',
                  letterSpacing: '1px',
                  border: '2px solid #333',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  transition: 'all 0.3s ease',
                  display: 'inline-block'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#333'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#333'
                }}
              >
                ← Back to Gallery
              </Link>
            </div>
          </ErrorBoundary>
        </div>
      </div>
    </>
  )
}
