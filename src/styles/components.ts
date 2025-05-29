export const buttonStyles = {
  navigation: {
    base: {
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      border: 'none',
      borderRadius: '50%',
      width: '60px',
      height: '60px',
      cursor: 'pointer',
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      fontSize: '20px',
      color: '#333',
      flexShrink: 0 as const
    },
    hover: {
      background: 'rgba(255, 255, 255, 1)',
      transform: 'scale(1.1)'
    },
    normal: {
      background: 'rgba(255, 255, 255, 0.9)',
      transform: 'scale(1)'
    }
  }
}

export const layoutStyles = {
  container: {
    fullHeight: {
      height: '100vh',
      overflow: 'hidden' as const,
      background: '#fafafa',
      position: 'relative' as const
    }
  },
  text: {
    counter: {
      fontSize: '14px',
      color: '#999',
      letterSpacing: '2px',
      textTransform: 'uppercase' as const
    },
    title: {
      fontSize: '24px',
      fontWeight: 300,
      margin: '24px 0 0 0',
      textAlign: 'center' as const,
      color: '#333',
      letterSpacing: '0.5px'
    }
  }
}
