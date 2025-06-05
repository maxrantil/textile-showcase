'use client'

interface ProjectDetailsProps {
  projectTitle: string
  projectYear?: number
  projectDescription?: string
  projectMaterials?: string
  projectTechnique?: string
  projectDimensions?: string
  isMobile: boolean
}

export function ProjectDetails({ 
  projectTitle,
  projectYear,
  projectDescription,
  projectMaterials,
  projectTechnique,
  projectDimensions,
  isMobile
}: ProjectDetailsProps) {
  if (isMobile) {
    return (
      <div style={{ 
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{ 
          fontSize: 'clamp(24px, 6vw, 32px)', 
          fontWeight: 300, 
          margin: '0 0 12px 0',
          color: '#333',
          letterSpacing: '-0.5px'
        }}>
          {projectTitle}
        </h1>
        
        {projectYear && (
          <p style={{ 
            fontSize: '16px', 
            color: '#666', 
            margin: '0 0 20px 0'
          }}>
            {projectYear}
          </p>
        )}

        {projectDescription && (
          <p style={{ 
            fontSize: '16px', 
            color: '#333', 
            lineHeight: '1.6',
            margin: '0 0 24px 0'
          }}>
            {projectDescription}
          </p>
        )}

        {/* Technical Details - Mobile */}
        {(projectMaterials || projectTechnique || projectDimensions) && (
          <TechnicalDetails
            materials={projectMaterials}
            technique={projectTechnique}
            dimensions={projectDimensions}
            isMobile={true}
          />
        )}
      </div>
    )
  }

  // Desktop layout
  return (
    <div style={{ 
      width: '100%',
      maxWidth: '800px',
      marginTop: '40px'
    }}>
      <h1 style={{ 
        fontSize: '32px', 
        fontWeight: 300, 
        margin: '0 0 8px 0',
        color: '#333',
        textAlign: 'center',
        letterSpacing: '-0.5px'
      }}>
        {projectTitle}
      </h1>
      
      {projectYear && (
        <p style={{ 
          fontSize: '16px', 
          color: '#666', 
          margin: '0 0 20px 0',
          textAlign: 'center'
        }}>
          {projectYear}
        </p>
      )}

      {projectDescription && (
        <p style={{ 
          fontSize: '16px', 
          color: '#333', 
          lineHeight: '1.6',
          margin: '0 0 24px 0',
          textAlign: 'center'
        }}>
          {projectDescription}
        </p>
      )}

      {/* Technical Details - Desktop */}
      {(projectMaterials || projectTechnique || projectDimensions) && (
        <TechnicalDetails
          materials={projectMaterials}
          technique={projectTechnique}
          dimensions={projectDimensions}
          isMobile={false}
        />
      )}
    </div>
  )
}

// Technical Details Subcomponent
function TechnicalDetails({ 
  materials, 
  technique, 
  dimensions, 
  isMobile 
}: {
  materials?: string
  technique?: string
  dimensions?: string
  isMobile: boolean
}) {
  const containerStyle: React.CSSProperties = isMobile ? {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '24px',
    padding: '20px',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
  } : {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px',
    marginTop: '24px'
  }

  return (
    <div style={containerStyle}>
      {materials && (
        <TechnicalDetail label="Materials" value={materials} />
      )}
      {technique && (
        <TechnicalDetail label="Technique" value={technique} />
      )}
      {dimensions && (
        <TechnicalDetail label="Dimensions" value={dimensions} />
      )}
    </div>
  )
}

function TechnicalDetail({ label, value }: { label: string, value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ 
        fontSize: '12px', 
        color: '#999', 
        textTransform: 'uppercase',
        letterSpacing: '1px',
        margin: '0 0 8px 0',
        fontWeight: 500
      }}>
        {label}
      </h3>
      <p style={{ 
        fontSize: '14px', 
        margin: 0, 
        color: '#333',
        lineHeight: '1.4'
      }}>
        {value}
      </p>
    </div>
  )
}
