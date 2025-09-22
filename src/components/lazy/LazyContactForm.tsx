// ABOUTME: Minimal lazy contact form for TDD GREEN phase
// Basic implementation for form code splitting

import React from 'react'

export default function LazyContactForm() {
  return (
    <form data-testid="contact-form">
      <div>Lazy-loaded Contact Form</div>
      <input type="email" placeholder="Email" />
      <textarea placeholder="Message"></textarea>
      <button type="submit">Send</button>
    </form>
  )
}

export const ContactFormSkeleton = () => (
  <div data-testid="contact-form-skeleton">Loading contact form...</div>
)
