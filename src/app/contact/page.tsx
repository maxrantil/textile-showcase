'use client'

import { useState } from 'react'
import ContactForm from '@/components/adaptive/Forms'
import { EmailRevealButton } from '@/components/shared/EmailReveal/EmailRevealButton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import KeyboardScrollHandler from '@/components/KeyboardScrollHandler'

export default function ContactPage() {
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(
    null
  )

  return (
    <>
      <KeyboardScrollHandler />

      <div
        className="nordic-container"
        style={{ minHeight: '100vh', paddingTop: '100px' }}
      >
        <ErrorBoundary>
          <section className="nordic-section">
            <div className="nordic-content">
              <h1 className="nordic-display nordic-spacing-md">Contact</h1>
              <p className="nordic-body-large nordic-spacing-md">
                Interested in collaborating or learning more about my work?
                I&apos;d love to hear from you.
              </p>
              <div className="contact-direct">
                <EmailRevealButton />
                <a
                  href="https://www.instagram.com/idaromme"
                  className="contact-direct-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram @idaromme
                </a>
              </div>
            </div>
          </section>

          <section className="nordic-section">
            <div className="nordic-content">
              {submitStatus === 'success' ? (
                <div
                  style={{
                    padding: 'var(--spacing-2xl)',
                    background: '#f8fffe',
                    borderRadius: 'var(--border-radius)',
                    border: '1px solid #e8f5f3',
                    textAlign: 'center',
                  }}
                >
                  <h3
                    className="nordic-h3 nordic-spacing-md"
                    style={{ color: '#2d5a52' }}
                  >
                    Thank You
                  </h3>
                  <p
                    className="nordic-body nordic-spacing-lg"
                    style={{ color: '#456059' }}
                  >
                    Your message has been sent successfully. I&apos;ll get back
                    to you soon.
                  </p>
                  <button
                    onClick={() => setSubmitStatus(null)}
                    className="nordic-btn nordic-btn-secondary nordic-btn-sm"
                    style={{ marginTop: 'var(--spacing-md)' }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  {submitStatus === 'error' && (
                    <div
                      style={{
                        padding: 'var(--spacing-lg)',
                        background: '#fef9f9',
                        borderRadius: 'var(--border-radius)',
                        border: '1px solid #f5e8e8',
                        marginBottom: 'var(--spacing-lg)',
                        textAlign: 'center',
                      }}
                    >
                      <p className="nordic-body" style={{ color: '#6b4343' }}>
                        Something went wrong. Please try again or contact me
                        directly.
                      </p>
                    </div>
                  )}

                  <ContactForm
                    onSuccess={() => {
                      console.log('Form submitted successfully!')
                      setSubmitStatus('success')
                    }}
                    onError={(error) => {
                      console.error('Form submission error:', error)
                      setSubmitStatus('error')
                    }}
                  />
                </>
              )}
            </div>
          </section>
        </ErrorBoundary>
      </div>
    </>
  )
}
