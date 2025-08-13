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
              {}
              <p className="nordic-body-large nordic-spacing-md">
                My work springs from a fascination of color combinations - how
                colors react, transform, and create new meanings when they meet
                in unexpected contexts. This cornerstone drives my work into the
                tension field between textiles&apos; traditional associations
                and the contrasts I create through my material choices.
              </p>

              <p className="nordic-body-large nordic-spacing-md">
                Through meticulous precision, I explore how this approach can
                create an aesthetic that challenges our preconceived notions of
                what textiles can be. My practice is built on methodical
                repetition, where I work through series of color compositions -
                I investigate how specific color combinations behave through
                different techniques, or how a single technique can reveal
                hidden potentials when applied across different color palettes.
              </p>

              <p className="nordic-body-large nordic-spacing-md">
                This color-based focus drives my process, regardless of whether
                the final expression becomes interior, sculpture, body-related
                work, or pure research. Research and intuition meet in equal
                measure, where each combination is examined with both analytical
                rigor and sensory openness.
              </p>

              {}
              <p className="nordic-body-large nordic-spacing-md">
                Through this exploration of color interplay, I create space for
                reflection, where each work becomes a step in a larger
                investigation of textiles&apos; unexplored potentials.
              </p>
            </div>
          </section>

          {/* Studio Info */}
          {/* <section className="nordic-section">
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
          </section> */}

          {/* Recognition */}
          <section className="nordic-section">
            <div className="nordic-content">
              <h3 className="nordic-section-title nordic-spacing-md">
                Recent Recognition
              </h3>
              <div className="nordic-spacing-sm">
                <p className="nordic-caption">
                  3daysofdesign, Group Exhibition, Copenhagen, Denmark 2025
                </p>
                <p className="nordic-caption">
                  MA Graduation Exhibition, Exit, Textilmuseet, Borås, Sweden
                  2025
                </p>
                <p className="nordic-caption">
                  Paul Frankenius Stiftelse Grant, 2025
                </p>
                <p className="nordic-caption">
                  Work in Progress Exhibition, Textilmuseet, Borås, Sweden 2024
                </p>
                <p className="nordic-caption">
                  BA Graduation Exhibition, FABRIKKEN for Kunst og Design,
                  Copenhagen, Denmark 2023
                </p>
                <p className="nordic-caption">
                  Tage Vanggaard og Hustrus Fond Grant, 2023
                </p>
              </div>
            </div>
          </section>
        </ErrorBoundary>
      </div>
    </>
  )
}
