'use client'

import Link from 'next/link'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import KeyboardScrollHandler from '@/components/KeyboardScrollHandler'

export default function AboutPage() {
  return (
    <>
      <KeyboardScrollHandler />

      <div
        style={{
          background: '#ffffff',
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
            maxWidth: '1000px',
            padding: '60px clamp(16px, 4vw, 40px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <ErrorBoundary>
            {/* Artist Statement */}
            <section
              style={{
                marginBottom: '80px',
                width: '100%',
                maxWidth: '800px',
              }}
            >
              <h1
                className="text-display-mobile text-crisp"
                style={{
                  margin: '0 0 48px 0',
                  color: '#333',
                  letterSpacing: '-1px',
                }}
              >
                ARTIST STATEMENT
              </h1>

              <div
                style={{
                  width: '100%',
                }}
              >
                <p
                  className="text-body-large"
                  style={{
                    marginBottom: '32px',
                    color: '#555',
                    letterSpacing: '0.3px',
                  }}
                >
                  My work explores the intersection between traditional textile
                  craftsmanship and contemporary sustainable practices. Each
                  piece is a meditation on the relationship between material,
                  process, and time — honoring the slow, deliberate nature of
                  hand-weaving while addressing urgent questions about our
                  environmental future.
                </p>

                <p
                  className="text-body-large"
                  style={{
                    marginBottom: '32px',
                    color: '#555',
                    letterSpacing: '0.3px',
                  }}
                >
                  Through the rhythmic process of weaving, I create works that
                  speak to both intimacy and universality. The tactile quality
                  of natural fibers, the precise geometry of pattern, and the
                  subtle interplay of color and texture form a visual language
                  that transcends cultural boundaries while remaining deeply
                  rooted in material authenticity.
                </p>

                <p
                  className="text-body-large"
                  style={{
                    color: '#555',
                    letterSpacing: '0.3px',
                  }}
                >
                  Each textile is conceived as both functional object and
                  contemplative space — inviting viewers to slow down, to feel,
                  and to consider our collective relationship with the materials
                  that surround us in daily life.
                </p>
              </div>
            </section>

            {/* Main content - Centered */}
            <div
              style={{
                width: '100%',
                maxWidth: '900px',
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(40px, 8vw, 60px)',
                marginBottom: '80px',
              }}
            >
              {/* Studio Info */}
              <section
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '700px',
                  }}
                >
                  <h2
                    className="text-h2-mobile text-crisp"
                    style={{
                      margin: '0 0 32px 0',
                      color: '#333',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    About the Studio
                  </h2>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '24px',
                    }}
                  >
                    <p
                      className="text-body-mobile"
                      style={{
                        color: '#666',
                      }}
                    >
                      Founded in 2018, our studio operates from a converted
                      warehouse in Stockholm, where we maintain both traditional
                      floor looms and modern sustainable dyeing facilities. Our
                      practice emphasizes collaboration with local artisans and
                      suppliers who share our commitment to ethical production
                      methods.
                    </p>

                    <p
                      className="text-body-mobile"
                      style={{
                        color: '#666',
                      }}
                    >
                      We work exclusively with natural and regenerated fibers,
                      sourcing materials from certified organic producers and
                      pioneering innovative approaches to natural dyeing using
                      locally foraged plants and minerals.
                    </p>

                    <p
                      className="text-body-mobile"
                      style={{
                        color: '#666',
                      }}
                    >
                      Our works have been exhibited internationally and are held
                      in private collections across Europe and North America.
                    </p>
                  </div>
                </div>
              </section>

              {/* Approach and Recognition */}
              <section
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '700px',
                  }}
                >
                  <h3
                    className="text-h2-mobile text-crisp"
                    style={{
                      margin: '0 0 32px 0',
                      color: '#333',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    Our Approach
                  </h3>

                  <div style={{ marginBottom: '40px' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        marginBottom: '32px',
                      }}
                    >
                      <div
                        className="text-body-mobile"
                        style={{
                          color: '#555',
                          lineHeight: '1.8',
                        }}
                      >
                        <strong style={{ color: '#333' }}>Materials:</strong>{' '}
                        Organic cotton, linen, hemp, and wool from certified
                        sustainable sources
                      </div>

                      <div
                        className="text-body-mobile"
                        style={{
                          color: '#555',
                          lineHeight: '1.8',
                        }}
                      >
                        <strong style={{ color: '#333' }}>Techniques:</strong>{' '}
                        Traditional hand-weaving, natural dyeing, and
                        contemporary finishing methods
                      </div>

                      <div
                        className="text-body-mobile"
                        style={{
                          color: '#555',
                          lineHeight: '1.8',
                        }}
                      >
                        <strong style={{ color: '#333' }}>Philosophy:</strong>{' '}
                        Slow production, zero waste, and deep collaboration with
                        material processes
                      </div>

                      <div
                        className="text-body-mobile"
                        style={{
                          color: '#555',
                          lineHeight: '1.8',
                        }}
                      >
                        <strong style={{ color: '#333' }}>Impact:</strong>{' '}
                        Carbon-neutral studio operations and direct partnerships
                        with fiber producers
                      </div>
                    </div>

                    <h4
                      className="text-body-mobile"
                      style={{
                        fontWeight: 500,
                        margin: '0 0 16px 0',
                        color: '#333',
                      }}
                    >
                      Recent Recognition
                    </h4>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        alignItems: 'left',
                      }}
                    >
                      <span
                        className="text-body-mobile"
                        style={{ color: '#666' }}
                      >
                        2024 — Sustainable Design Award, Stockholm Design Week
                      </span>
                      <span
                        className="text-body-mobile"
                        style={{ color: '#666' }}
                      >
                        2023 — Featured in Textile Arts International
                      </span>
                      <span
                        className="text-body-mobile"
                        style={{ color: '#666' }}
                      >
                        2022 — Solo exhibition, Craft Contemporary, London
                      </span>
                      <span
                        className="text-body-mobile"
                        style={{ color: '#666' }}
                      >
                        2021 — Nordic Craft Prize finalist
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Add some extra content for better desktop scrolling */}
              <section
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '40px 0',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '700px',
                  }}
                >
                  <h3
                    className="text-h2-mobile text-crisp"
                    style={{
                      margin: '0 0 24px 0',
                      color: '#333',
                    }}
                  >
                    Philosophy & Process
                  </h3>

                  <p
                    className="text-body-mobile"
                    style={{
                      color: '#666',
                      lineHeight: '1.8',
                      marginBottom: '24px',
                    }}
                  >
                    Our creative process begins with an intimate understanding
                    of materials. Each fiber tells a story of its origin, from
                    the soil that nurtured it to the hands that harvested it. We
                    honor this journey through mindful design and considered
                    construction.
                  </p>

                  <p
                    className="text-body-mobile"
                    style={{
                      color: '#666',
                      lineHeight: '1.8',
                    }}
                  >
                    Time is our most precious tool. In an age of instant
                    gratification, we choose the slow path — allowing ideas to
                    develop organically, patterns to emerge naturally, and
                    beauty to unfold at its own pace.
                  </p>
                </div>
              </section>
            </div>

            {/* Back Link - Centered */}
            <div
              style={{
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
