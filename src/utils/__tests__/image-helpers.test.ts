// ABOUTME: Unit tests for image-helpers.ts — Sanity CDN URL generation utilities
// Env vars NEXT_PUBLIC_SANITY_PROJECT_ID/DATASET are set via .env.test

import {
  getOptimizedImageUrl,
  getSimpleImageUrl,
  getResponsiveImageUrls,
  generateSrcSet,
} from '../image-helpers'
import type { ImageSource } from '@/types/textile'

const BASE = 'https://cdn.sanity.io/images/testproject/testdataset'

const makeImageSource = (ref: string): ImageSource => ({
  _type: 'image',
  asset: { _ref: ref, _type: 'reference' },
})

describe('image-helpers', () => {
  describe('getOptimizedImageUrl', () => {
    describe('string source passthrough', () => {
      it('returns the string as-is when source is a string', () => {
        expect(getOptimizedImageUrl('https://example.com/img.jpg')).toBe(
          'https://example.com/img.jpg'
        )
      })

      it('returns empty string passthrough even if URL is empty', () => {
        expect(getOptimizedImageUrl('')).toBe('')
      })
    })

    describe('asset reference parsing', () => {
      it('returns empty string when source has no asset ref', () => {
        const source = { _type: 'image' } as ImageSource
        expect(getOptimizedImageUrl(source)).toBe('')
      })

      it('returns empty string when _ref is missing id segment', () => {
        const source = makeImageSource('image')
        expect(getOptimizedImageUrl(source)).toBe('')
      })

      it('reads _ref from top-level source._ref', () => {
        const source: ImageSource = {
          _type: 'image',
          _ref: 'image-abc123-800x600-jpg',
        }
        const url = getOptimizedImageUrl(source)
        expect(url).toBe(`${BASE}/abc123-800x600.jpg`)
      })

      it('reads _ref from source.asset._ref', () => {
        const source = makeImageSource('image-abc123-800x600-jpg')
        const url = getOptimizedImageUrl(source)
        expect(url).toBe(`${BASE}/abc123-800x600.jpg`)
      })

      it('prefers source._ref over source.asset._ref when both present', () => {
        const source: ImageSource = {
          _type: 'image',
          _ref: 'image-top-800x600-jpg',
          asset: { _ref: 'image-asset-800x600-jpg', _type: 'reference' },
        }
        const url = getOptimizedImageUrl(source)
        expect(url).toBe(`${BASE}/top-800x600.jpg`)
      })
    })

    describe('URL generation without options', () => {
      it('builds base CDN URL with no query params when no options given', () => {
        const source = makeImageSource('image-abc123-1920x1080-jpg')
        expect(getOptimizedImageUrl(source)).toBe(
          `${BASE}/abc123-1920x1080.jpg`
        )
      })
    })

    describe('URL generation with options', () => {
      it('appends width param', () => {
        const source = makeImageSource('image-abc123-1920x1080-jpg')
        const url = getOptimizedImageUrl(source, { width: 800 })
        expect(url).toContain('w=800')
      })

      it('appends height param', () => {
        const source = makeImageSource('image-abc123-1920x1080-jpg')
        const url = getOptimizedImageUrl(source, { height: 600 })
        expect(url).toContain('h=600')
      })

      it('appends quality param', () => {
        const source = makeImageSource('image-abc123-1920x1080-jpg')
        const url = getOptimizedImageUrl(source, { quality: 75 })
        expect(url).toContain('q=75')
      })

      it('appends format param when format differs from source format', () => {
        const source = makeImageSource('image-abc123-1920x1080-jpg')
        const url = getOptimizedImageUrl(source, { format: 'webp' })
        expect(url).toContain('fm=webp')
      })

      it('does NOT append format param when format matches source format', () => {
        const source = makeImageSource('image-abc123-1920x1080-jpg')
        const url = getOptimizedImageUrl(source, { format: 'jpg' })
        expect(url).not.toContain('fm=')
      })

      it('does NOT append format param when format is "auto"', () => {
        const source = makeImageSource('image-abc123-1920x1080-jpg')
        const url = getOptimizedImageUrl(source, { format: 'auto' })
        expect(url).not.toContain('fm=')
      })

      it('appends fit param', () => {
        const source = makeImageSource('image-abc123-1920x1080-jpg')
        const url = getOptimizedImageUrl(source, { fit: 'crop' })
        expect(url).toContain('fit=crop')
      })

      it('appends multiple params', () => {
        const source = makeImageSource('image-abc123-1920x1080-jpg')
        const url = getOptimizedImageUrl(source, {
          width: 640,
          quality: 85,
          format: 'webp',
        })
        expect(url).toContain('w=640')
        expect(url).toContain('q=85')
        expect(url).toContain('fm=webp')
      })

      it('returns base URL without ? when no valid options produce params', () => {
        const source = makeImageSource('image-abc123-1920x1080-jpg')
        // format matches source — no params
        const url = getOptimizedImageUrl(source, { format: 'jpg' })
        expect(url).not.toContain('?')
      })
    })
  })

  describe('getSimpleImageUrl', () => {
    it('returns string source as-is', () => {
      expect(getSimpleImageUrl('https://example.com/img.png')).toBe(
        'https://example.com/img.png'
      )
    })

    it('returns empty string when no asset ref', () => {
      const source = { _type: 'image' } as ImageSource
      expect(getSimpleImageUrl(source)).toBe('')
    })

    it('returns empty string when ref has no id', () => {
      expect(getSimpleImageUrl(makeImageSource('image'))).toBe('')
    })

    it('builds correct CDN URL without query params', () => {
      const source = makeImageSource('image-xyz789-640x480-png')
      expect(getSimpleImageUrl(source)).toBe(`${BASE}/xyz789-640x480.png`)
    })

    it('never appends query params', () => {
      const source = makeImageSource('image-xyz789-640x480-png')
      expect(getSimpleImageUrl(source)).not.toContain('?')
    })
  })

  describe('getResponsiveImageUrls', () => {
    it('returns URLs for each of the default sizes', () => {
      const source = makeImageSource('image-abc123-1920x1080-jpg')
      const urls = getResponsiveImageUrls(source)
      expect(Object.keys(urls).map(Number)).toEqual([640, 768, 1024, 1280, 1920])
    })

    it('returns URLs for custom sizes', () => {
      const source = makeImageSource('image-abc123-1920x1080-jpg')
      const urls = getResponsiveImageUrls(source, [320, 480])
      expect(Object.keys(urls).map(Number)).toEqual([320, 480])
    })

    it('each URL contains the correct width param', () => {
      const source = makeImageSource('image-abc123-1920x1080-jpg')
      const urls = getResponsiveImageUrls(source, [400])
      expect(urls[400]).toContain('w=400')
    })

    it('each URL uses webp format', () => {
      const source = makeImageSource('image-abc123-1920x1080-jpg')
      const urls = getResponsiveImageUrls(source, [500])
      expect(urls[500]).toContain('fm=webp')
    })

    it('each URL uses quality 85', () => {
      const source = makeImageSource('image-abc123-1920x1080-jpg')
      const urls = getResponsiveImageUrls(source, [500])
      expect(urls[500]).toContain('q=85')
    })
  })

  describe('generateSrcSet', () => {
    it('generates srcSet string with default sizes', () => {
      const source = makeImageSource('image-abc123-1920x1080-jpg')
      const srcSet = generateSrcSet(source)
      expect(srcSet).toContain('640w')
      expect(srcSet).toContain('768w')
      expect(srcSet).toContain('1024w')
      expect(srcSet).toContain('1280w')
      expect(srcSet).toContain('1920w')
    })

    it('generates srcSet string with custom sizes', () => {
      const source = makeImageSource('image-abc123-1920x1080-jpg')
      const srcSet = generateSrcSet(source, [320, 640])
      expect(srcSet).toContain('320w')
      expect(srcSet).toContain('640w')
    })

    it('separates entries with ", "', () => {
      const source = makeImageSource('image-abc123-1920x1080-jpg')
      const srcSet = generateSrcSet(source, [320, 640])
      const parts = srcSet.split(', ')
      expect(parts).toHaveLength(2)
    })

    it('each srcSet entry has URL followed by width descriptor', () => {
      const source = makeImageSource('image-abc123-1920x1080-jpg')
      const srcSet = generateSrcSet(source, [400])
      expect(srcSet).toMatch(/https:\/\/.*\s400w/)
    })
  })
})
