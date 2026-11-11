// ABOUTME: E2E checks that pages share one left edge on desktop and that the contact page leads with direct contact details
// Guards the alignment between Project, About and Contact, and the plain styling of the contact form

import { test, expect, type Page } from '@playwright/test'

async function leftEdge(page: Page, selector: string): Promise<number> {
  const locator = page.locator(selector).first()
  await expect(locator).toBeVisible()
  const box = await locator.boundingBox()
  return Math.round(box?.x ?? -1)
}

test.describe('Shared left edge', () => {
  test('project, about and contact content start at the same x', async ({
    page,
  }) => {
    const viewport = page.viewportSize()
    test.skip(!viewport || viewport.width < 1024, 'desktop layout only')

    await page.goto('/about')
    const aboutTitle = await leftEdge(page, 'h1')
    const aboutText = await leftEdge(page, '.nordic-body-large')

    await page.goto('/contact')
    const contactTitle = await leftEdge(page, 'h1')
    const contactText = await leftEdge(page, '.nordic-body-large')
    const contactForm = await leftEdge(page, '.desktop-contact-form')

    await page.goto('/')
    const href = await page
      .locator('a[href^="/project/"]')
      .first()
      .getAttribute('href')
    await page.goto(href as string)
    const projectTitle = await leftEdge(page, '.desktop-project-title')

    expect(
      [aboutText, contactTitle, contactText, contactForm, projectTitle],
      'left edges of about text, contact title, contact text, contact form, project title'
    ).toEqual(Array(5).fill(aboutTitle))
  })
})

/** The form is swapped for the device's own version after hydration, so target that one by class. */
function contactForm(page: Page) {
  const isPhone = (page.viewportSize()?.width ?? 0) < 768
  return page.locator(
    isPhone ? '.mobile-contact-form' : '.desktop-contact-form'
  )
}

test.describe('Contact page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact')
    await expect(contactForm(page)).toBeVisible()
  })

  test('email and Instagram come before the form', async ({ page }) => {
    const form = await contactForm(page).boundingBox()
    expect(form).not.toBeNull()
    const reveal = page.getByRole('button', { name: 'Show email' })
    const instagram = page.getByRole('link', { name: /instagram/i })

    await expect(reveal).toBeVisible()
    await expect(instagram).toHaveAttribute(
      'href',
      'https://www.instagram.com/idaromme'
    )
    expect((await reveal.boundingBox())?.y).toBeLessThan(form?.y ?? -1)
    expect((await instagram.boundingBox())?.y).toBeLessThan(form?.y ?? -1)
    await expect(contactForm(page).getByText('Show email')).toHaveCount(0)
  })

  test('form fields are square with a hairline border and no red marker', async ({
    page,
  }) => {
    const input = contactForm(page).locator('input').first()
    const style = await input.evaluate((el) => {
      const computed = getComputedStyle(el)
      return {
        radius: computed.borderTopLeftRadius,
        border: computed.borderTopWidth,
      }
    })
    expect(style).toEqual({ radius: '0px', border: '1px' })

    const label = contactForm(page).locator('label').first()
    const colors = await label.evaluate((el) => {
      const marker = el.querySelector('.text-required')
      return {
        label: getComputedStyle(el).color,
        marker: marker ? getComputedStyle(marker).color : null,
      }
    })
    expect(colors.marker).toBe(colors.label)
  })
})
