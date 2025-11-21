// src/components/forms/FormMessages.tsx
'use client'

interface FormSuccessProps {
  title?: string
  message: string
  className?: string
}

export function FormSuccess({
  title = 'Success!',
  message,
  className = '',
}: FormSuccessProps) {
  return (
    <div
      className={`form-message form-message-success ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="form-message-content">
        <h3 className="form-message-title">{title}</h3>
        <p className="form-message-text">{message}</p>
      </div>
    </div>
  )
}

interface FormErrorProps {
  title?: string
  message: string
  className?: string
  onRetry?: () => void
}

export function FormError({
  title = 'Error',
  message,
  className = '',
  onRetry,
}: FormErrorProps) {
  return (
    <div
      className={`form-message form-message-error ${className}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="form-message-content">
        <h3 className="form-message-title">{title}</h3>
        <p className="form-message-text">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-mobile btn-mobile-secondary form-retry-button"
            aria-label="Try submitting the form again"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
