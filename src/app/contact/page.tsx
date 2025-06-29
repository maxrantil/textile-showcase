'use client'

import Link from 'next/link'
import ContactForm from '@/components/adaptive/Forms'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import KeyboardScrollHandler from '@/components/KeyboardScrollHandler'

export default function ContactPage() {
  return (
    <>
      <KeyboardScrollHandler />

      <div
        className="nordic-container"
        style={{ minHeight: '100vh', paddingTop: '100px' }}
      >
        <ErrorBoundary>
          {/* Header Section */}
          <section className="nordic-section" style={{ textAlign: 'center' }}>
            <h1 className="nordic-display nordic-spacing-md">Contact</h1>

            <div className="nordic-content">
              <p className="nordic-body-large">
                Interested in collaborating or learning more about my work?
                I&aposd love to hear from you.
              </p>
            </div>
          </section>

          {/* Contact Form Section */}
          <section className="nordic-section">
            <div className="nordic-content">
              <ContactForm
                onSuccess={() => console.log('Form submitted successfully!')}
                onError={(error) =>
                  console.error('Form submission error:', error)
                }
              />
            </div>
          </section>

          {/* Contact Information */}
          <section className="nordic-section">
            <div className="nordic-content">
              <div
                style={{
                  padding: 'var(--spacing-2xl)',
                  background: '#fff',
                  borderRadius: 'var(--border-radius)',
                  boxShadow: 'var(--shadow-sm)',
                  textAlign: 'center',
                }}
              >
                <h2 className="nordic-h3 nordic-spacing-md">
                  Other Ways to Connect
                </h2>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: 'var(--spacing-lg)',
                  }}
                >
                  <div>
                    <h3 className="nordic-label nordic-spacing-sm">
                      Studio Location
                    </h3>
                    <p className="nordic-body">Stockholm, Sweden</p>
                  </div>

                  <div>
                    <h3 className="nordic-label nordic-spacing-sm">
                      Response Time
                    </h3>
                    <p className="nordic-body">Usually within 48 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Collaboration Section */}
          <section className="nordic-section">
            <div className="nordic-content">
              <div
                style={{
                  padding: 'var(--spacing-2xl)',
                  background: '#fff',
                  borderRadius: 'var(--border-radius)',
                  boxShadow: 'var(--shadow-sm)',
                  textAlign: 'center',
                }}
              >
                <h3 className="nordic-h3 nordic-spacing-md">
                  Let&aposs Create Together
                </h3>

                <p className="nordic-body nordic-spacing-sm">
                  Whether you&aposre interested in commissioning a piece,
                  collaborating on a project, or simply learning more about
                  sustainable textile practices, I&aposm here to help.
                </p>

                <p className="nordic-body">
                  Each inquiry is unique, and I take time to understand your
                  vision and needs. Together, we can create something meaningful
                  and lasting.
                </p>
              </div>
            </div>
          </section>

          {/* Back Link */}
          <section
            style={{ textAlign: 'center', paddingBottom: 'var(--spacing-3xl)' }}
          >
            <Link href="/" className="nordic-btn nordic-btn-secondary">
              ← Back to Gallery
            </Link>
          </section>
        </ErrorBoundary>
      </div>
    </>
  )
}
