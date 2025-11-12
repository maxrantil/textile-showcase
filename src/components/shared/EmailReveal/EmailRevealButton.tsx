// ABOUTME: Progressive disclosure email reveal button with accessibility, copy-to-clipboard, and error state handling
'use client'

import { useState, useRef, useEffect } from 'react'
import { UmamiEvents } from '@/utils/analytics'
import './email-reveal.css'

interface EmailRevealButtonProps {
  hasError?: boolean
}

export function EmailRevealButton({ hasError = false }: EmailRevealButtonProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyButtonRef = useRef<HTMLButtonElement>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      // Cleanup any pending timers
    }
  }, [])

  const handleReveal = () => {
    setIsRevealed(true)
    UmamiEvents.emailRevealClicked(hasError ? 'error' : 'normal')
  }

  const handleHide = () => {
    setIsRevealed(false)
    UmamiEvents.emailHidden()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('idaromme@gmail.com')
      setCopied(true)
      UmamiEvents.emailCopied('success')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
      UmamiEvents.emailCopied('error')
    }
  }

  // Check if clipboard API is supported
  const isCopySupported =
    typeof window !== 'undefined' &&
    navigator?.clipboard?.writeText !== undefined

  return (
    <div className="email-reveal-container" data-testid="email-reveal">
      {!isRevealed ? (
        <>
          <button
            type="button"
            className={`email-reveal-button ${hasError ? 'error-state' : 'normal-state'}`}
            onClick={handleReveal}
            aria-expanded="false"
            aria-controls="email-content"
            aria-describedby="email-reveal-help"
            data-testid="reveal-button"
          >
            <span aria-hidden="true" className="email-icon">
              ✉{' '}
            </span>
            {hasError
              ? 'Having trouble? Click to show email address'
              : 'Prefer email? Show address'}
          </button>

          <span id="email-reveal-help" className="sr-only">
            Clicking will reveal the artist&apos;s email address as an
            alternative contact method
          </span>
        </>
      ) : (
        <div
          id="email-content"
          role="region"
          aria-label="Email address revealed"
          className="email-revealed-container"
          data-testid="email-content"
        >
          <p className="email-label">Email me directly:</p>

          <div className="email-display">
            <a
              href="mailto:idaromme@gmail.com"
              className="email-address"
              aria-label="Email address: idaromme at gmail dot com"
            >
              idaromme@gmail.com
            </a>

            {isCopySupported && (
              <button
                ref={copyButtonRef}
                type="button"
                onClick={handleCopy}
                className={`copy-button ${copied ? 'copied' : ''}`}
                aria-label={
                  copied
                    ? 'Email copied to clipboard'
                    : 'Copy email to clipboard'
                }
                disabled={copied}
                data-testid="copy-button"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleHide}
            className="hide-email-button"
            aria-expanded="true"
            aria-controls="email-content"
            aria-label="Hide email address"
            data-testid="hide-button"
          >
            Hide email
          </button>

          {/* Screen reader announcement for copy success */}
          <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {copied && 'Email address copied to clipboard'}
          </div>
        </div>
      )}
    </div>
  )
}
