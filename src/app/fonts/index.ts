import { Inter, Noto_Sans } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

// Noto Sans as fallback for Hiragino Sans (similar characteristics)
export const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-noto-sans',
  display: 'swap',
  preload: true,
  weight: ['300', '400', '500', '600', '700'],
})
