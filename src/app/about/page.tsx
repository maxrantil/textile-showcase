'use client'

import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import KeyboardScrollHandler from '@/components/KeyboardScrollHandler'

export default function AboutPage() {
  return (
    <>
      <KeyboardScrollHandler />

      <div
        className="nordic-container"
        style={{ minHeight: '100vh', paddingTop: '100px' }}
      >
        <ErrorBoundary>
          {/* Artist Statement */}
          <section className="nordic-section">
            <h1 className="nordic-display nordic-spacing-lg">
              Artist Statement
            </h1>

            <div className="nordic-content">
              <p className="nordic-body-large nordic-spacing-md">
                My work explores the intersection between traditional textile
                craftsmanship and contemporary sustainable practices. Each piece
                is a meditation on the relationship between material, process,
                and time — honoring the slow, deliberate nature of hand-weaving
                while addressing urgent questions about our environmental
                future.
              </p>

              <p className="nordic-body-large nordic-spacing-md">
                Through the rhythmic process of weaving, I create works that
                speak to both intimacy and universality. The tactile quality of
                natural fibers, the precise geometry of pattern, and the subtle
                interplay of color and texture form a visual language that
                transcends cultural boundaries while remaining deeply rooted in
                material authenticity.
              </p>

              <p className="nordic-body-large">
                Each textile is conceived as both functional object and
                contemplative space — inviting viewers to slow down, to feel,
                and to consider our collective relationship with the materials
                that surround us in daily life.
              </p>
            </div>
          </section>

          {/* Studio Info */}
          <section className="nordic-section">
            <div className="nordic-content">
              <h2 className="nordic-h2 nordic-spacing-md">About the Studio</h2>

              <p className="nordic-body nordic-spacing-sm">
                Founded in 2018, our studio operates from a converted warehouse
                in Stockholm, where we maintain both traditional floor looms and
                modern sustainable dyeing facilities.
              </p>

              <p className="nordic-body nordic-spacing-sm">
                We work exclusively with natural and regenerated fibers,
                sourcing materials from certified organic producers and
                pioneering innovative approaches to natural dyeing.
              </p>

              <p className="nordic-body">
                Our works have been exhibited internationally and are held in
                private collections across Europe and North America.
              </p>
            </div>
          </section>

          {/* Recognition */}
          <section className="nordic-section">
            <div className="nordic-content">
              <h3 className="nordic-section-title nordic-spacing-md">
                Recent Recognition
              </h3>

              <div className="nordic-spacing-sm">
                <p className="nordic-caption">
                  2024 — Sustainable Design Award, Stockholm Design Week
                </p>
                <p className="nordic-caption">
                  2023 — Featured in Textile Arts International
                </p>
                <p className="nordic-caption">
                  2022 — Solo exhibition, Craft Contemporary, London
                </p>
                <p className="nordic-caption">
                  2021 — Nordic Craft Prize finalist
                </p>
              </div>
            </div>
          </section>
        </ErrorBoundary>
      </div>
    </>
  )
}
