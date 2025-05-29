'use client'

import Link from 'next/link'

interface InteractiveLinkProps {
  href: string
  children: React.ReactNode
  style?: React.CSSProperties
  hoverStyle?: React.CSSProperties
}

export default function InteractiveLink({ 
  href, 
  children, 
  style = {}, 
  hoverStyle = {} 
}: InteractiveLinkProps) {
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    Object.assign(e.currentTarget.style, hoverStyle)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    Object.assign(e.currentTarget.style, style)
  }

  return (
    <Link 
      href={href}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </Link>
  )
}
