// ABOUTME: E2E check that every page starts its content at the same left edge on a phone
// Guards the page gutter shared by the header, home gallery, project page, About and Contact

import { test, expect, type Page } from '@playwright/test'

async function leftEdge(page: Page, selector: string): Promise<number> {
  const locator = page.locator(selector).first()
  await expect(locator).toBeVisible()
  const box = await locator.boundingBox()
  return Math.round(box?.x ?? -1)
}

test.describe('Shared left edge on the phone', () => {
  test('header, gallery, project, about and contact content start at the same x', async ({
    page,
  }) => {
    const viewport = page.viewportSize()
    test.skip(!viewport || viewport.width >= 768, 'phone layout only')

    await page.goto('/')
    const logo = await leftEdge(page, '.header__logo')
    const galleryImage = await leftEdge(page, '.mobile-gallery-image')
    const galleryCaption = await leftEdge(page, '.mobile-gallery-title')
    const href = await page
      .locator('a.mobile-gallery-item')
      .first()
      .getAttribute('href')

    await page.goto(href as string)
    const projectTitle = await leftEdge(page, '.mobile-project-title')
    const projectImage = await leftEdge(page, '.mobile-image')
    const projectText = await leftEdge(page, '.mobile-project-description')

    await page.goto('/about')
    const aboutTitle = await leftEdge(page, 'h1')

    await page.goto('/contact')
    const contactTitle = await leftEdge(page, 'h1')
    const contactField = await leftEdge(page, '.mobile-form-input')
    const contactButton = await leftEdge(
      page,
      '.mobile-contact-form button[type="submit"]'
    )

    expect(
      {
        galleryImage,
        galleryCaption,
        projectTitle,
        projectImage,
        projectText,
        aboutTitle,
        contactTitle,
        contactField,
        contactButton,
      },
      'left edges compared with the header logo'
    ).toEqual({
      galleryImage: logo,
      galleryCaption: logo,
      projectTitle: logo,
      projectImage: logo,
      projectText: logo,
      aboutTitle: logo,
      contactTitle: logo,
      contactField: logo,
      contactButton: logo,
    })
  })
})
