// ABOUTME: Minimal email reveal button with analytics tracking and accessibility
'use client'

import { useState } from 'react'
import { UmamiEvents } from '@/utils/analytics'
import './email-reveal.css'

export function EmailRevealButton() {
  const [isRevealed, setIsRevealed] = useState(false)

  const handleReveal = () => {
    setIsRevealed(true)
    UmamiEvents.emailRevealClicked('normal')
  }

  return (
    <div className="email-reveal-container" data-testid="email-reveal">
      {!isRevealed ? (
        <button
          type="button"
          className="email-reveal-button"
          onClick={handleReveal}
          aria-expanded="false"
          aria-controls="email-content"
          data-testid="reveal-button"
        >
          Show email
        </button>
      ) : (
        <div
          id="email-content"
          className="email-revealed-container"
          data-testid="email-content"
        >
          <a
            href="mailto:idaromme@gmail.com"
            className="email-address"
            aria-label="Email address: idaromme at gmail dot com"
          >
            idaromme@gmail.com
          </a>
        </div>
      )}
    </div>
  )
}
