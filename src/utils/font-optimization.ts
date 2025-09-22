// ABOUTME: Font optimization utilities for self-hosted fonts and performance improvements

export type FontDisplay = 'block' | 'swap' | 'fallback' | 'optional'

export interface FontConfig {
  family: string
  weight: string | number
  style?: 'normal' | 'italic'
  display: FontDisplay
  subset?: string
  url: string
}

export interface FontDisplayStrategy {
  critical: FontDisplay
  secondary: FontDisplay
  decorative: FontDisplay
}

export interface FontMetrics {
  ascent: number
  descent: number
  lineGap: number
  fallback: string
}

/**
 * Generate CSS for self-hosted fonts
 */
export function generateFontCSS(fonts: FontConfig[]): string {
  return fonts
    .map((font) =>
      `
@font-face {
  font-family: '${font.family}';
  src: url('${font.url}') format('woff2');
  font-weight: ${font.weight};
  font-style: ${font.style || 'normal'};
  font-display: ${font.display};
  unicode-range: ${font.subset === 'latin' ? 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' : 'U+0000-FFFF'};
}`.trim()
    )
    .join('\n\n')
}

/**
 * Optimize font loading strategy
 */
export function optimizeFontLoading(
  fontType: 'critical' | 'secondary' | 'decorative'
): FontConfig {
  const strategy: FontDisplayStrategy = {
    critical: 'block', // Block for critical fonts
    secondary: 'swap', // Swap for non-critical
    decorative: 'optional', // Optional for decorative
  }

  return {
    family: 'Inter',
    weight: 400,
    display: strategy[fontType],
    url: `/fonts/inter-400.woff2`,
  }
}

/**
 * Get font preload tags for critical fonts
 */
export function getFontPreloadTags(fonts: FontConfig[]): string[] {
  return fonts
    .filter((font) => font.display === 'block')
    .map(
      (font) =>
        `<link rel="preload" href="${font.url}" as="font" type="font/woff2" crossorigin="anonymous">`
    )
}

/**
 * Font display strategy configuration
 */
export const fontDisplayStrategy: FontDisplayStrategy = {
  critical: 'block', // Block for critical fonts
  secondary: 'swap', // Swap for non-critical
  decorative: 'optional', // Optional for decorative
}

/**
 * Font metrics for better fallback matching
 */
export const fontMetrics: Record<string, FontMetrics> = {
  inter: {
    ascent: 0.967,
    descent: 0.251,
    lineGap: 0,
    fallback: 'system-ui',
  },
}
