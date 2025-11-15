// ABOUTME: CSP-compliant Image component that omits inline styles from Next.js Image
// Solves Issue #198 - Next.js Image adds style="color:transparent" which violates CSP

import NextImage, { getImageProps } from 'next/image'
import { ComponentProps } from 'react'

/**
 * CSP-Compliant Image Component
 *
 * Next.js Image component automatically adds inline style="color: transparent"
 * which violates Content Security Policy when nonce is present.
 *
 * This component uses getImageProps() to get all the Next.js Image optimizations
 * (responsive srcset, lazy loading, format selection) while omitting the inline style.
 *
 * Usage: Drop-in replacement for next/image
 * @example
 * ```tsx
 * import ImageNoStyle from '@/components/ui/ImageNoStyle'
 *
 * <ImageNoStyle
 *   src={imageUrl}
 *   alt="Description"
 *   width={800}
 *   height={600}
 *   priority={true}
 * />
 * ```
 *
 * @see https://github.com/vercel/next.js/discussions/61209
 * @see https://github.com/vercel/next.js/issues/61388
 */
export default function ImageNoStyle(props: ComponentProps<typeof NextImage>) {
  const { props: nextProps } = getImageProps({ ...props })

  // Omit the style attribute to comply with CSP
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { style: _omit, ...delegated } = nextProps

  return <img {...delegated} />
}
