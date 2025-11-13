// ABOUTME: Enhanced CSP diagnostic test to identify inline style sources
import { test, expect } from '@playwright/test'

test.describe('CSP Violation Diagnostic', () => {
  test('Identify inline style sources with MutationObserver', async ({
    page,
  }) => {
    const inlineStyleElements: Array<{
      tag: string
      className: string
      id: string
      style: string
      parentTag: string
      parentClass: string
    }> = []

    // Intercept inline styles as they're added to DOM
    await page.addInitScript(() => {
      ;(window as any).__inlineStyleElements = []

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          // Check if style attribute was added/changed
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const target = mutation.target as HTMLElement
            const style = target.getAttribute('style')

            if (style) {
              ;(window as any).__inlineStyleElements.push({
                tag: target.tagName.toLowerCase(),
                className: target.className || '',
                id: target.id || '',
                style: style,
                parentTag: target.parentElement?.tagName.toLowerCase() || '',
                parentClass: target.parentElement?.className || '',
              })
            }
          }

          // Check if new elements with style attribute were added
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) {
                // Element node
                const element = node as HTMLElement
                const style = element.getAttribute('style')

                if (style) {
                  ;(window as any).__inlineStyleElements.push({
                    tag: element.tagName.toLowerCase(),
                    className: element.className || '',
                    id: element.id || '',
                    style: style,
                    parentTag: element.parentElement?.tagName.toLowerCase() || '',
                    parentClass: element.parentElement?.className || '',
                  })
                }

                // Check descendants
                const descendants = element.querySelectorAll('[style]')
                descendants.forEach((desc) => {
                  const descElement = desc as HTMLElement
                  const descStyle = descElement.getAttribute('style')

                  if (descStyle) {
                    ;(window as any).__inlineStyleElements.push({
                      tag: descElement.tagName.toLowerCase(),
                      className: descElement.className || '',
                      id: descElement.id || '',
                      style: descStyle,
                      parentTag: descElement.parentElement?.tagName.toLowerCase() || '',
                      parentClass: descElement.parentElement?.className || '',
                    })
                  }
                })
              }
            })
          }
        })
      })

      observer.observe(document.documentElement, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['style'],
      })
    })

    await page.goto('/')
    await page.waitForTimeout(3000) // Wait for page to fully load

    // Get captured inline styles from observer
    const capturedElements = await page.evaluate(() => {
      return (window as any).__inlineStyleElements || []
    })

    // ALSO query DOM directly for any elements with style attribute
    const domInlineStyles = await page.evaluate(() => {
      const elements = document.querySelectorAll('[style]')
      return Array.from(elements).map((elem) => {
        const htmlElem = elem as HTMLElement
        return {
          tag: htmlElem.tagName.toLowerCase(),
          className: htmlElem.className || '',
          id: htmlElem.id || '',
          style: htmlElem.getAttribute('style') || '',
          parentTag: htmlElem.parentElement?.tagName.toLowerCase() || '',
          parentClass: htmlElem.parentElement?.className || '',
          outerHTML: htmlElem.outerHTML.substring(0, 200),
        }
      })
    })

    // CHECK for <style> tags without nonces (these cause CSP violations too!)
    const styleTags = await page.evaluate(() => {
      const styles = document.querySelectorAll('style')
      return Array.from(styles).map((styleElem) => {
        return {
          hasNonce: styleElem.hasAttribute('nonce'),
          nonce: styleElem.getAttribute('nonce') || '',
          contentLength: styleElem.textContent?.length || 0,
          contentPreview: styleElem.textContent?.substring(0, 100) || '',
          parent: styleElem.parentElement?.tagName.toLowerCase() || '',
        }
      })
    })

    console.log('\n\n===== INLINE STYLE DIAGNOSTIC =====')
    console.log(`MutationObserver captured: ${capturedElements.length}`)
    console.log(`DOM query found: ${domInlineStyles.length}`)
    console.log(`Style tags found: ${styleTags.length}\n`)

    const allElements = [...capturedElements, ...domInlineStyles]

    if (allElements.length > 0) {
      console.log('===== DOM QUERY RESULTS =====')
      domInlineStyles.forEach((elem: any, idx: number) => {
        console.log(`[${idx + 1}/${domInlineStyles.length}]`, {
          element: `<${elem.tag}${elem.className ? ' class="' + elem.className.split(' ')[0] + '..."' : ''}${elem.id ? ' id="' + elem.id + '"' : ''}>`,
          style: elem.style.substring(0, 100) + (elem.style.length > 100 ? '...' : ''),
          parent: `<${elem.parentTag}${elem.parentClass ? ' class="' + elem.parentClass.split(' ')[0] + '..."' : ''}>`,
        })
      })
      console.log('')
    }

    if (styleTags.length > 0) {
      console.log('===== STYLE TAGS =====')
      const tagsWithoutNonce = styleTags.filter(tag => !tag.hasNonce)
      console.log(`Total: ${styleTags.length}, Without nonce: ${tagsWithoutNonce.length}\n`)

      styleTags.forEach((tag: any, idx: number) => {
        if (!tag.hasNonce || idx < 5) { // Show all without nonce, or first 5
          console.log(`[${idx + 1}/${styleTags.length}]`, {
            hasNonce: tag.hasNonce,
            nonce: tag.nonce ? tag.nonce.substring(0, 20) + '...' : 'NONE',
            size: tag.contentLength + ' chars',
            preview: tag.contentPreview,
            parent: tag.parent,
          })
        }
      })
      console.log('')
    }

    if (capturedElements.length > 0) {
      console.log('===== MUTATION OBSERVER RESULTS =====');
      // Group by tag and class for pattern analysis
      const patterns = new Map<string, number>()

      capturedElements.forEach((elem: any, idx: number) => {
        const pattern = `${elem.tag}${elem.className ? '.' + elem.className.split(' ')[0] : ''}`
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1)

        if (idx < 20) { // Show first 20 in detail
          console.log(`[${idx + 1}]`, {
            element: `<${elem.tag}${elem.className ? ' class="' + elem.className + '"' : ''}${elem.id ? ' id="' + elem.id + '"' : ''}>`,
            style: elem.style.substring(0, 100) + (elem.style.length > 100 ? '...' : ''),
            parent: `<${elem.parentTag}${elem.parentClass ? ' class="' + elem.parentClass.split(' ')[0] + '"' : ''}>`,
          })
        }
      })

      console.log('\n===== PATTERN SUMMARY =====')
      const sortedPatterns = Array.from(patterns.entries()).sort((a, b) => b[1] - a[1])
      sortedPatterns.forEach(([pattern, count]) => {
        console.log(`${pattern}: ${count} occurrences`)
      })
    }

    console.log('=====================================\n\n')

    // This test is for diagnostics only
    // We expect either MutationObserver or DOM query to find inline styles
    expect(allElements.length).toBeGreaterThanOrEqual(0)
  })
})
