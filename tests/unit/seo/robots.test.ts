// ABOUTME: Tests for robots.txt configuration
// ABOUTME: Validates proper crawler directives and sitemap reference

import * as fs from 'fs/promises'
import * as path from 'path'

describe('robots.txt', () => {
  const robotsPath = path.join(process.cwd(), 'public', 'robots.txt')

  it('should exist in public directory', async () => {
    const exists = await fs
      .access(robotsPath)
      .then(() => true)
      .catch(() => false)
    expect(exists).toBe(true)
  })

  it('should allow all crawlers by default', async () => {
    const content = await fs.readFile(robotsPath, 'utf-8')
    expect(content).toContain('User-agent: *')
    expect(content).toContain('Allow: /')
  })

  it('should reference the sitemap', async () => {
    const content = await fs.readFile(robotsPath, 'utf-8')
    expect(content).toContain('Sitemap: https://idaromme.dk/sitemap.xml')
  })

  it('should block sensitive paths', async () => {
    const content = await fs.readFile(robotsPath, 'utf-8')
    // API routes should be blocked from crawling
    expect(content).toContain('Disallow: /api/')
    // Studio should be blocked
    expect(content).toContain('Disallow: /studio')
  })

  it('should not block important content paths', async () => {
    const content = await fs.readFile(robotsPath, 'utf-8')
    // Should not disallow project pages, about, contact
    expect(content).not.toContain('Disallow: /project')
    expect(content).not.toContain('Disallow: /about')
    expect(content).not.toContain('Disallow: /contact')
  })

  it('should have crawl-delay for politeness (optional)', async () => {
    const content = await fs.readFile(robotsPath, 'utf-8')
    // Optional but good practice
    // Either has Crawl-delay or doesn't specify (which is fine)
    const hasExplicitNoDelay = !content.includes('Crawl-delay')
    const hasReasonableDelay =
      content.includes('Crawl-delay: 1') ||
      content.includes('Crawl-delay: 2') ||
      content.includes('Crawl-delay: 5')
    expect(hasExplicitNoDelay || hasReasonableDelay).toBe(true)
  })
})
