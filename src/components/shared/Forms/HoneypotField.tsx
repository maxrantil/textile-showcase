// ABOUTME: Hidden contact-form field that only bots fill (Issue #477, audit SEC-05)
// ABOUTME: Off-screen, aria-hidden and not focusable, so people and screen readers never reach it

import { HONEYPOT_FIELD } from '@/lib/honeypot'

// Off-screen rather than display:none, which some bots detect and skip
const offScreen: React.CSSProperties = {
  position: 'absolute',
  left: '-10000px',
  top: 'auto',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
}

export function HoneypotField() {
  return (
    <div aria-hidden="true" style={offScreen}>
      <label htmlFor={`field-${HONEYPOT_FIELD}`}>Leave this field empty</label>
      <input
        id={`field-${HONEYPOT_FIELD}`}
        type="text"
        name={HONEYPOT_FIELD}
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  )
}
