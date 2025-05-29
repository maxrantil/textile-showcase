import Link from 'next/link'

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <div style={{ height: '100px' }} />
      
      <div style={{ 
        maxWidth: '1000px', 
        margin: '0 auto', 
        padding: '60px 40px' 
      }}>
        {/* Artist Statement Section */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 300, 
            margin: '0 0 48px 0',
            color: '#333',
            letterSpacing: '-1px'
          }}>
            ARTIST STATEMENT
          </h1>
          
          <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto',
            fontSize: '20px',
            color: '#555',
            lineHeight: '1.8',
            letterSpacing: '0.3px'
          }}>
            <p style={{ marginBottom: '32px' }}>
              My work explores the intersection between traditional textile craftsmanship 
              and contemporary sustainable practices. Each piece is a meditation on the 
              relationship between material, process, and time — honoring the slow, 
              deliberate nature of hand-weaving while addressing urgent questions about 
              our environmental future.
            </p>
            
            <p style={{ marginBottom: '32px' }}>
              Through the rhythmic process of weaving, I create works that speak to both 
              intimacy and universality. The tactile quality of natural fibers, the 
              precise geometry of pattern, and the subtle interplay of color and texture 
              form a visual language that transcends cultural boundaries while remaining 
              deeply rooted in material authenticity.
            </p>
            
            <p>
              Each textile is conceived as both functional object and contemplative space — 
              inviting viewers to slow down, to feel, and to consider our collective 
              relationship with the materials that surround us in daily life.
            </p>
          </div>
        </div>

        {/* About Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '80px',
          alignItems: 'start'
        }}>
          <div>
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: 300, 
              margin: '0 0 32px 0',
              color: '#333',
              letterSpacing: '-0.5px'
            }}>
              About the Studio
            </h2>
            
            <p style={{ 
              fontSize: '18px', 
              color: '#666', 
              lineHeight: '1.7',
              marginBottom: '24px'
            }}>
              Founded in 2018, our studio operates from a converted warehouse in 
              Stockholm, where we maintain both traditional floor looms and 
              modern sustainable dyeing facilities. Our practice emphasizes 
              collaboration with local artisans and suppliers who share our 
              commitment to ethical production methods.
            </p>
            
            <p style={{ 
              fontSize: '18px', 
              color: '#666', 
              lineHeight: '1.7',
              marginBottom: '24px'
            }}>
              We work exclusively with natural and regenerated fibers, sourcing 
              materials from certified organic producers and pioneering innovative 
              approaches to natural dyeing using locally foraged plants and 
              minerals.
            </p>

            <p style={{ 
              fontSize: '18px', 
              color: '#666', 
              lineHeight: '1.7'
            }}>
              Our works have been exhibited internationally and are held in 
              private collections across Europe and North America.
            </p>
          </div>
          
          <div>
            <h3 style={{ 
              fontSize: '24px', 
              fontWeight: 300, 
              margin: '0 0 32px 0',
              color: '#333',
              letterSpacing: '-0.3px'
            }}>
              Our Approach
            </h3>
            
            <div style={{ marginBottom: '40px' }}>
              <div style={{ 
                fontSize: '16px',
                color: '#555',
                lineHeight: '1.8',
                marginBottom: '12px'
              }}>
                <strong style={{ color: '#333' }}>Materials:</strong> Organic cotton, linen, hemp, and wool from certified sustainable sources
              </div>
              
              <div style={{ 
                fontSize: '16px',
                color: '#555',
                lineHeight: '1.8',
                marginBottom: '12px'
              }}>
                <strong style={{ color: '#333' }}>Techniques:</strong> Traditional hand-weaving, natural dyeing, and contemporary finishing methods
              </div>
              
              <div style={{ 
                fontSize: '16px',
                color: '#555',
                lineHeight: '1.8',
                marginBottom: '12px'
              }}>
                <strong style={{ color: '#333' }}>Philosophy:</strong> Slow production, zero waste, and deep collaboration with material processes
              </div>
              
              <div style={{ 
                fontSize: '16px',
                color: '#555',
                lineHeight: '1.8'
              }}>
                <strong style={{ color: '#333' }}>Impact:</strong> Carbon-neutral studio operations and direct partnerships with fiber producers
              </div>
            </div>

            <h4 style={{ 
              fontSize: '18px', 
              fontWeight: 300, 
              margin: '0 0 16px 0',
              color: '#333'
            }}>
              Recent Recognition
            </h4>
            
            <ul style={{ 
              listStyle: 'none', 
              padding: 0,
              fontSize: '15px',
              color: '#666',
              lineHeight: '1.6'
            }}>
              <li style={{ marginBottom: '8px' }}>2024 — Sustainable Design Award, Stockholm Design Week</li>
              <li style={{ marginBottom: '8px' }}>2023 — Featured in Textile Arts International</li>
              <li style={{ marginBottom: '8px' }}>2022 — Solo exhibition, Craft Contemporary, London</li>
              <li>2021 — Nordic Craft Prize finalist</li>
            </ul>
          </div>
        </div>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
          <Link 
            href="/"
            style={{
              fontSize: '14px',
              color: '#333',
              textDecoration: 'none',
              letterSpacing: '1px',
              border: '1px solid #333',
              padding: '12px 24px',
              borderRadius: '6px',
              transition: 'all 0.3s ease'
            }}
          >
            ← Back to Gallery
          </Link>
        </div>
      </div>
    </div>
  )
}
