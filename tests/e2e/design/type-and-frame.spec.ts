// ABOUTME: E2E checks for the site's type system and frame: two text sizes, one weight, no capitalised text, compact header
// Asserts computed styles on every page so a stray stylesheet rule cannot reintroduce a third size or a tracked heading

import { test, expect, type Page } from '@playwright/test'

const TEXT_SIZES = ['16px', '20px']
const STATIC_PAGES = ['/', '/about', '/contact']

interface TextStyle {
  text: string
  fontSize: string
  fontWeight: string
  textTransform: string
  letterSpacing: string
}

/** Computed type styles of every element that directly contains visible text. */
async function visibleTextStyles(page: Page): Promise<TextStyle[]> {
  return page.evaluate(() => {
    const styles: TextStyle[] = []
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    )
    const seen = new Set<Element>()

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement
      if (!element || seen.has(element) || !node.textContent?.trim()) continue
      seen.add(element)

      if (element.closest('script, style, noscript, nextjs-portal')) continue
      const rect = element.getBoundingClientRect()
      const computed = getComputedStyle(element)
      const hidden =
        rect.width <= 1 ||
        rect.height <= 1 ||
        computed.visibility === 'hidden' ||
        computed.display === 'none'
      if (hidden) continue

      styles.push({
        text: node.textContent.trim().slice(0, 30),
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        textTransform: computed.textTransform,
        letterSpacing: computed.letterSpacing,
      })
    }
    return styles

    interface TextStyle {
      text: string
      fontSize: string
      fontWeight: string
      textTransform: string
      letterSpacing: string
    }
  })
}

async function firstProjectPath(page: Page): Promise<string> {
  await page.goto('/')
  const href = await page
    .locator('a[href^="/project/"]')
    .first()
    .getAttribute('href')
  expect(href).toBeTruthy()
  return href as string
}

async function expectOneTypeVoice(page: Page) {
  const styles = await visibleTextStyles(page)
  expect(styles.length).toBeGreaterThan(0)

  const describe = (s: TextStyle) =>
    `"${s.text}" ${s.fontSize}/${s.fontWeight} ${s.textTransform} ${s.letterSpacing}`

  expect(
    styles.filter((s) => !TEXT_SIZES.includes(s.fontSize)).map(describe),
    'text outside the two sizes'
  ).toEqual([])
  expect(
    styles.filter((s) => s.fontWeight !== '400').map(describe),
    'text that is not regular weight'
  ).toEqual([])
  expect(
    styles.filter((s) => s.textTransform !== 'none').map(describe),
    'capitalised text'
  ).toEqual([])
  expect(
    styles.filter((s) => s.letterSpacing !== 'normal').map(describe),
    'tracked text'
  ).toEqual([])
}

test.describe('Type system', () => {
  for (const path of STATIC_PAGES) {
    test(`${path} uses two sizes, one weight, no capitals or tracking`, async ({
      page,
    }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expectOneTypeVoice(page)
    })
  }

  test('project page uses two sizes, one weight, no capitals or tracking', async ({
    page,
  }) => {
    await page.goto(await firstProjectPath(page))
    await page.waitForLoadState('networkidle')
    // The layout is chosen after hydration, so wait for the one that matches this viewport
    const isPhone = (page.viewportSize()?.width ?? 0) < 768
    await expect(
      page.locator(isPhone ? '.mobile-project' : '.desktop-project')
    ).toBeVisible()
    await expectOneTypeVoice(page)
  })
})

test.describe('Frame', () => {
  test('desktop header is compact and anchored to the corners', async ({
    page,
  }) => {
    const viewport = page.viewportSize()
    test.skip(!viewport || viewport.width < 1024, 'desktop layout only')

    await page.goto('/')
    const header = await page.locator('header.header').boundingBox()
    const logo = await page.locator('.header__logo').boundingBox()
    const lastLink = await page
      .locator('.header__nav-link')
      .last()
      .boundingBox()

    expect(header?.height).toBeLessThanOrEqual(64)
    expect(logo?.x).toBeLessThanOrEqual(24)
    expect(
      (viewport?.width ?? 0) - ((lastLink?.x ?? 0) + (lastLink?.width ?? 0))
    ).toBeLessThanOrEqual(24)
  })

  test('name and navigation share one size and weight', async ({ page }) => {
    const viewport = page.viewportSize()
    test.skip(!viewport || viewport.width < 1024, 'desktop layout only')

    await page.goto('/')
    const typeOf = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((el) => {
          const computed = getComputedStyle(el)
          return `${computed.fontSize}/${computed.fontWeight}`
        })

    expect(await typeOf('.header__logo')).toBe(
      await typeOf('.header__nav-link')
    )
  })

  test('desktop gallery images take at least two thirds of the window height', async ({
    page,
  }) => {
    const viewport = page.viewportSize()
    test.skip(!viewport || viewport.width < 1024, 'desktop layout only')

    await page.goto('/')
    const image = page.locator('.desktop-gallery-img').first()
    await expect(image).toBeVisible()
    const box = await image.boundingBox()

    expect(box?.height).toBeGreaterThanOrEqual((viewport?.height ?? 0) * 0.66)
  })
})
