'use client'

import Link from 'next/link'
import ContactForm from '@/components/forms/ContactForm'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import KeyboardScrollHandler from '@/components/KeyboardScrollHandler'

export default function ContactPage() {
  return (
    <>
      <KeyboardScrollHandler />

      <div
        style={{
          background: '#fafafa',
          width: '100%',
          overflowX: 'hidden',
          minHeight: '100vh', // Changed from height to minHeight
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ height: '100px' }} />

        <div
          style={{
            width: '100%',
            maxWidth: '800px',
            padding: '60px clamp(16px, 4vw, 40px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <ErrorBoundary>
            <div
              style={{
                textAlign: 'center',
                marginBottom: '48px',
                width: '100%',
                maxWidth: '600px',
              }}
            >
              <h1
                className="text-display-mobile text-crisp"
                style={{
                  margin: '0 0 24px 0',
                  color: '#333',
                  letterSpacing: '-1px',
                }}
              >
                Contact
              </h1>

              <p
                className="text-body-large"
                style={{
                  color: '#666',
                  lineHeight: '1.6',
                }}
              >
                Interested in collaborating or learning more about my work?
                I&apos;d love to hear from you.
              </p>
            </div>

            {/* Contact Form - Centered */}
            <div
              style={{
                width: '100%',
                maxWidth: '600px',
                marginBottom: '48px',
              }}
            >
              <ContactForm
                onSuccess={() => console.log('Form submitted successfully!')}
                onError={(error) =>
                  console.error('Form submission error:', error)
                }
              />
            </div>

            {/* Additional Contact Information */}
            <div
              style={{
                padding: 'clamp(20px, 5vw, 40px)',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                width: '100%',
                maxWidth: '600px',
                marginBottom: '48px',
              }}
            >
              <h2
                className="text-h2-mobile text-crisp"
                style={{
                  margin: '0 0 24px 0',
                  color: '#333',
                  textAlign: 'center',
                }}
              >
                Other Ways to Connect
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '24px',
                  textAlign: 'center',
                }}
              >
                <div>
                  <h3
                    className="text-caption-mobile"
                    style={{
                      fontWeight: 500,
                      margin: '0 0 8px 0',
                      color: '#333',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    Studio Location
                  </h3>
                  <p
                    className="text-body-mobile"
                    style={{ color: '#666', margin: 0 }}
                  >
                    Stockholm, Sweden
                  </p>
                </div>

                <div>
                  <h3
                    className="text-caption-mobile"
                    style={{
                      fontWeight: 500,
                      margin: '0 0 8px 0',
                      color: '#333',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    Response Time
                  </h3>
                  <p
                    className="text-body-mobile"
                    style={{ color: '#666', margin: 0 }}
                  >
                    Usually within 48 hours
                  </p>
                </div>
              </div>
            </div>

            {/* Add some extra content for better desktop scrolling */}
            <div
              style={{
                padding: 'clamp(20px, 5vw, 40px)',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                width: '100%',
                maxWidth: '600px',
                marginBottom: '48px',
                textAlign: 'center',
              }}
            >
              <h3
                className="text-h2-mobile text-crisp"
                style={{
                  margin: '0 0 16px 0',
                  color: '#333',
                }}
              >
                Let&apos;s Create Together
              </h3>

              <p
                className="text-body-mobile"
                style={{
                  color: '#666',
                  lineHeight: '1.6',
                  marginBottom: '16px',
                }}
              >
                Whether you&apos;re interested in commissioning a piece,
                collaborating on a project, or simply learning more about
                sustainable textile practices, I&apos;m here to help.
              </p>

              <p
                className="text-body-mobile"
                style={{
                  color: '#666',
                  lineHeight: '1.6',
                }}
              >
                Each inquiry is unique, and I take time to understand your
                vision and needs. Together, we can create something meaningful
                and lasting.
              </p>
            </div>

            {/* Back Link - Centered */}
            <div
              style={{
                textAlign: 'center',
                paddingBottom: '60px', // Extra padding for better spacing
              }}
            >
              <Link
                href="/"
                className="btn-mobile btn-mobile-secondary touch-feedback"
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
